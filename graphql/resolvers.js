const Room = require("../models/room.js")
const Message = require("../models/message.js")
const User = require("../models/user.js")
const DirectChannel = require("../models/directChannel")
const { PubSub, withFilter } = require("apollo-server")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")

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
    searchUser: async (_, args) => {
      const regex = new RegExp(args.userName)
      const users = await User.find({ "userName": { $regex: regex, $options: "i" } }).limit(20)
      return users.map(user => user._doc.userName)
    },
    test: async () => {
      const result = await User.find({ "userName": { $in: ["tom", "t", "rajce"] } })
      return result.map(user => user.userName)
    },
    fetchDirectChannel: async (_, args) => {
      let [searchingUser, searchedUser, directChannel] = await Promise.all([
        User.findOne({ userName: args.searchingUser }),
        User.findOne({ userName: args.searchedUser }),
        DirectChannel.findOne({
          members: { $all: [args.searchingUser, args.searchedUser] }
        })
      ])
      if (!searchedUser) throw new Error("no such user exists")
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
    },

    login: async (_, args) => {
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
      const directChannels = getDirectChannels.bind(this, user._doc.directChannels, user._doc.userName)
      const rooms = getRooms.bind(this, user._doc.rooms)
      const selectedChannel = await Room.findOne({ publicRoom: true })
      return {
        ...user._doc,
        token,
        directChannels,
        rooms,
        selectedChannel: {
          ...selectedChannel._doc,
          messages: getMessages.bind(this, selectedChannel._doc.messages)
        }
      }
    }
  },
  Mutation: {
    register: async (_, args) => {
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
      return { ...result._doc, password: null }
    },
    addFriend: async (_, args) => {
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
    },
    sendMessage: async (_, args) => {
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
      pubSub.publish('getMessages', {
        getMessages: { ...message._doc, channelId, channelType },
        members: channel._doc.members
      })
      return { ...message._doc, channelId, channelType }
    },
    createRoom: async (_, args) => {
      if (args.channelName === "Public") throw new Error("invalid input, please choose different name")
      const room = new Room({
        channelName: args.channelName,
        members: [args.creator],
        messages: [],
        creator: args.creator
      })
      const [result, creator] = await Promise.all([
        room.save(),
        User.findOne({ userName: args.creator })
      ])
      creator.rooms.push(result.id)
      await creator.save()
      const messages = getMessages.bind(this, room._doc.messages)
      return { ...result._doc, messages, creator: args.creator }
    },
    addPeopleToRoom: async (_, args) => {
      const [users, room] = await Promise.all([
        User.find({ "userName": { $in: args.users } }),
        Room.findOne({ _id: args.roomId })
      ])

      users.forEach(user => {
        user.rooms.push(mongoose.Types.ObjectId(args.roomId))
        room.members.push(user.userName)
      })
      await Promise.all(users.map(user => { return user.save() }))
      await room.save()
      pubSub.publish('addedToRoom', {
        addedToRoom: room._doc,
        users: args.users
      })
      return args.users
    },
    leaveRoom: async (_, args) => {
      const [room, user] = await Promise.all([
        Room.findOne({ _id: args.roomId }),
        User.findOne({ userName: args.userName })
      ])
      room.members = room.members.filter(member => member !== args.userName)
      user.rooms = user.rooms.filter(roomId => roomId != args.roomId)
      await Promise.all([
        room.save(),
        user.save()
      ])
      return args.roomId
    }
  },
  Subscription: {
    getMessages: {
      subscribe: withFilter(
        () => pubSub.asyncIterator('getMessages'),
        (payload, args) => payload.members.includes(args.userName) && args.userName !== payload.getMessages.sender
      )
    },
    addedToRoom: {
      subscribe: withFilter(
        () => pubSub.asyncIterator("addedToRoom"),
        (payload, args) => payload.users.includes(args.userName)
      )
    }
  },
}