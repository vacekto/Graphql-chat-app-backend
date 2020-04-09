const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const channelSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message"
    }
  ],
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  password: String

})

module.exports = mongoose.model("Channel", channelSchema);