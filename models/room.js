const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roomSchema = new Schema({
  members: [String],
  creator: String,
  channelType: {
    type: String,
    default: "room"
  },
  channelName: {
    type: String,
    required: true
  },
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message"
    }
  ],
  displayed: {
    type: Boolean,
    default: false
  },
  publicRoom: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model("Room", roomSchema);