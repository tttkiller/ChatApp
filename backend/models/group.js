// models/group.js
const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    members: [{ type: String, required: true }], // array of usernames
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", GroupSchema);
