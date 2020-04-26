const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roomSchema = new Schema({
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
    type:Boolean,
    default: false
  },
  password: String,
  members: [String],
})

module.exports = mongoose.model("Room", roomSchema);