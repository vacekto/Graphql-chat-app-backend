const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  friends: [String],
  directChannels: [
    {
      type: Schema.Types.ObjectId,
      ref: "directChannel"
    }
  ],
  rooms: [
    {
      type: Schema.Types.ObjectId,
      ref: "Room"
    }
  ]
})

module.exports = mongoose.model("User", userSchema);