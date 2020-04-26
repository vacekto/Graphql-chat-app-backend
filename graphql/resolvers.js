const Room = require("../models/room.js")
const Message = require("../models/message.js")
const User = require("../models/user.js")
const DirectChannel = require("../models/directChannel")
const { PubSub, withFilter } = require("apollo-server")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const pubSub = new PubSub();

let getRooms = async ids => {
  const result = await Room.find({
    _id: { $in: ids }
  })
  return result.map(room => {
    const messages = getMessages.bind(this, room._doc.messages)
    return {
      ...room._doc,
      messages
    }
  })
}

let getDirectChannels = async (ids, userName) => {
  const result = await DirectChannel.find({ _id: { $in: ids } })
  return result.map(directChannel => {
    const channelName = directChannel._doc.members[0] === userName ?
      directChannel._doc.members[1] :
      directChannel._doc.members[0]
    const messages = getMessages.bind(this, directChannel._doc.messages)
    return {
      ...directChannel._doc,
      messages,
      channelName,
      channelType: "directChannel"
    }
  })
}

let getMessages = async ids => {
  return await Message.find({ _id: { $in: ids } })
}

module.exports = {
  Query: {
    directChannel: async (_, args) => {
      try {
        console.log(args.searchedUser)
        const [searchingUser, searchedUser] = await Promise.all([
          User.findOne({ userName: args.searchingUser }),
          User.findOne({ userName: args.searchedUser })
        ])
        if (!searchedUser) throw new Error("no such user exists")
        let directChannel = await DirectChannel.findOne({
          members: { $all: [args.searchingUser, args.searchedUser] }
        })
        if (!directChannel) {
          directChannel = new DirectChannel({
            members: [args.searchingUser, args.searchedUser]
          })

          searchingUser.directChannels.push(directChannel._id)
          searchedUser.directChannels.push(directChannel._id)
          await Promise.all([
            searchingUser.save(),
            searchedUser.save(),
            directChannel.save()
          ])
        }
        const messages = getMessages.bind(this, directChannel._doc.messages)
        return {
          ...directChannel._doc,
          channelName: args.searchedUser,
          messages
        }
      } catch (err) { throw err }

    },

    login: async (_, args) => {
      try {
        const user = await User.findOne({ userName: args.input.userName })
        if (!user) throw new Error("invalid input")
        const match = await bcrypt.compare(args.input.password, user.password)
        if (!match) throw new Error("invalid input")
        user.isOnline = true
        await user.save()
        const token = jwt.sign({
          id: user.id,
          userName: user._doc.userName
        }, process.env.SECRET_KEY, { expiresIn: `1h` })
        console.log("login")
        const directChannels = getDirectChannels.bind(this, user._doc.directChannels, user._doc.userName)
        const rooms = getRooms.bind(this, user._doc.rooms)
        return {
          ...user._doc,
          token,
          password: null,
          directChannels,
          rooms
        }
      } catch (err) { throw err }
    }
  },
  Mutation: {
    register: async (_, args) => {
      try {
        if (args.input.userName.trim() === "") throw new Error("invalid input")
        const user = await User.findOne({ userName: args.input.userName })
        if (user) throw new Error("username is already taken")
        const [hashedPassword, publicRoom] = await Promise.all([
          bcrypt.hash(args.input.password, 12),
          Room.findOne({ publicRoom: true })
        ])
        const newUser = new User({
          userName: args.input.userName,
          password: hashedPassword,
          friends: [],
          rooms: [publicRoom._id],
        })
        const result = await newUser.save();
        console.log(result)
        return { ...result._doc, password: null }
      } catch (err) { throw err }
    },
    addFriend: async (_, args) => {
      try {
        const [user, friend] = await Promise.all([
          User.findOne({ userName: args.input.userName }),
          User.findOne({ userName: args.input.friendUserName })
        ])
        if (!friend) throw new Error("user by that userName doesnt exist")
        const channelName = [user._doc.userName, friend._doc.userName].sort().join("");
        let channel = await Room.findOne({ channelName })
        if (!channel) {
          channel = new Room({
            channelName,
            messages: [],
            members: [user._doc._id, friend._doc._id]
          })
          await channel.save()
        }
        if (user._doc.friends.includes(channel._doc._id)) {
          throw new Error("user already is your friend")
        }
        user.friends.push(channel._id)
        await user.save()
        return { ...friend._doc, password: null }
      } catch (err) { throw err }
    },
    sendMessage: async (_, args) => {
      try {
        const { senderName, text, date, channelId, channelType } = args.input
        let message = new Message({
          text: text,
          sender: senderName,
          date: date,
        })
        const channel = channelType === "room" ?
          await Room.findOne({ _id: channelId }) :
          await DirectChannel.findOne({ _id: channelId })
        if (!channel) throw new Error("channel doesnt exists")
        channel.messages.push(message._id)
        await Promise.all([message.save(), channel.save()])
        pubSub.publish('getMessages', { getMessages: { ...message._doc, channelId, channelType }, members: channel._doc.members })
        return { ...message._doc, channelId, channelType }
      } catch (err) { throw err }
    }
  },
  Subscription: {
    getMessages: {
      subscribe: withFilter(
        () => pubSub.asyncIterator('getMessages')
        , (payload, args) => payload.members.includes(args.userName) && args.userName !== payload.getMessages.sender
      )
    }
  },
}

