// routes/group.js
const express = require("express");
const router = express.Router();
const Group = require("../models/group");

// Create a new group with a list of members
router.post("/create", async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return res
        .status(400)
        .json({ message: "Group name and members are required" });
    }
    const newGroup = new Group({ name, members });
    await newGroup.save();
    res
      .status(201)
      .json({ message: "Group created successfully", group: newGroup });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add a member to an existing group
router.put("/:id/add", async (req, res) => {
  try {
    const groupId = req.params.id;
    const { member } = req.body;
    if (!member) {
      return res.status(400).json({ message: "Member name is required" });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (group.members.includes(member)) {
      return res.status(400).json({ message: "Member already in group" });
    }
    group.members.push(member);
    await group.save();
    res.json({ message: "Member added successfully", group });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
