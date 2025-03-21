// models/message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    receiver: String, // Optional for group messages
    text: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    receiptDelivered: {
      type: Boolean,
      default: false,
    },
    groupId: String, // For group messages only
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
