const Channel = require("../mongodb/channel.js")
const Message = require("../mongodb/message.js")
const User = require("../mongodb/user.js")

module.exports = {
  login: async args => {
    try {
      const user = await User.findOne({ userName: args.input.userName })
      if (!user || args.input.password !== user.password) {
        throw new Error("invalid input")
      }
      return { ...user._doc, password: null, }
    } catch (err) {
      throw err
    }
  },

  register: async args => {
    try {
      const user = await User.findOne({ userName: args.input.userName })
      if (user) {
        throw new Error("user already exists")
      }
      const newUser = new User({
        userName: args.input.userName,
        password: args.input.password,
        friends: [],
        rooms: [],
      })
      const result = await newUser.save();
      return { ...result._doc, password: null }
    } catch (err) {
      throw err
    }
  },
  addFriend: async args => {
    try {
      const [user, friend] = await Promise.all([
        User.findOne({ userName: args.input.userName }),
        User.findOne({ userName: args.input.friendUserName })
      ])
      if (!friend) {
        throw new Error("user by that userName doesnt exist")
      }
      const channelName = [user._doc.userName, friend._doc.userName].sort().join("");
      let channel = await Channel.findOne({ name: channelName })
      if (!channel) {
        channel = new Channel({
          name: channelName,
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
    } catch (err) {
      throw err
    }
  },
  sendMessage: async args => {
    try {
      const { senderName, text, date, channelName } = args.input
      const message = new Message({
        text: text,
        sender: senderName,
        date: date,
      })
      const channel = await Channel.findOne({ name: channelName })
      channel.messages.push(message._id)
      await Promise.all([message.save(), channel.save()])
      return message._doc
    } catch (err) {
      throw err
    }
  }
}

