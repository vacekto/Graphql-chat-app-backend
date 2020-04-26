const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const directChannelSchema = new Schema({
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message"
    },
  ],
  channelType: {
    type: String,
    default: "directChannel"
  },
  members: [String],
  displayed: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model("DirectChannel", directChannelSchema);