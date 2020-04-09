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
  friends: [
    {
      type: Schema.Types.ObjectId,
      ref: "Channel"
    }
  ],
  rooms: [
    {
      type: Schema.Types.ObjectId,
      ref: "Channel"
    }
  ]
})

module.exports = mongoose.model("User", userSchema);