const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    require: true
  },
})

module.exports = mongoose.model("Message", messageSchema);