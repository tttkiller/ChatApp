// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Message = require("./models/message"); // Message model with read field
const authRoutes = require("./routes/auth"); // Your auth routes
const groupRoutes = require("./routes/group"); // Your group routes

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://chatapp-4-lmax.onrender.com",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(
  cors({
    origin: "*", // Allow requests from all origins
    methods: ["GET", "POST"],
  })
);

// Use auth and group routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);

// In-memory online users storage
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // Identify a user for online presence tracking
  socket.on("identify", (username) => {
    if (typeof username === "object") {
      console.error("Invalid username format:", username);
      return;
    }
    onlineUsers[username] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log(`User identified: ${username}`, onlineUsers);
  });

  // PRIVATE CHAT EVENTS
  socket.on("joinRoom", ({ sender, receiver }) => {
    const roomId = [sender, receiver].sort().join("_");
    socket.join(roomId);
    console.log(`${sender} joined room: ${roomId}`);
  });

  socket.on("sendMessage", (data) => {
    console.log("Private message received:", data);
    const message = new Message(data);
    message
      .save()
      .then(() => console.log("Private message saved to DB"))
      .catch((err) => console.error("Error saving private message:", err));
    const roomId = [data.sender, data.receiver].sort().join("_");
    // Use broadcast so the sender doesn't receive a duplicate message
    socket.broadcast.to(roomId).emit("receiveMessage", data);
  });

  // Read Receipt: Mark messages as read and broadcast receipt
  socket.on("markAsRead", async (data) => {
    try {
      console.log("Marking messages as read for:", data); // Debug log

      // Ensure sender and receiver are strings
      const sender = String(data.sender);
      const receiver = String(data.receiver);

      await Message.updateMany(
        { sender: receiver, receiver: sender, read: false },
        { $set: { read: true } }
      );

      const updatedMessages = await Message.find({
        sender: receiver,
        receiver: sender,
      }).sort({ createdAt: 1 });

      const roomId = [sender, receiver].sort().join("_");

      io.to(roomId).emit("readReceipt", {
        sender,
        receiver,
        messages: updatedMessages, // Updated messages with read status
      });

      console.log(`Marked messages as read for conversation: ${roomId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  // GROUP CHAT EVENTS
  socket.on("joinGroup", ({ groupId, user }) => {
    socket.join(groupId);
    console.log(`${user} joined group ${groupId}`);
  });

  socket.on("sendGroupMessage", (data) => {
    console.log("Group message received:", data);
    const message = new Message({
      sender: data.sender,
      text: data.text,
      time: data.time,
      groupId: data.groupId,
    });
    message
      .save()
      .then(() => console.log("Group message saved"))
      .catch((err) => console.error("Error saving group message:", err));
    // Use broadcast to avoid duplicate on sender
    socket.broadcast.to(data.groupId).emit("receiveGroupMessage", data);
  });

  // TYPING INDICATOR (private chat)
  socket.on("typing", (data) => {
    const roomId = [data.sender, data.receiver].sort().join("_");
    socket.broadcast.to(roomId).emit("typing", data);
  });

  socket.on("disconnect", () => {
    // Remove disconnected user from onlineUsers
    for (const [username, id] of Object.entries(onlineUsers)) {
      if (id === socket.id) {
        delete onlineUsers[username];
        break;
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("User Disconnected:", socket.id);
  });
});

// GET endpoint to fetch private messages
app.get("/api/messages", async (req, res) => {
  try {
    const { sender, receiver } = req.query;
    if (!sender || !receiver) {
      return res
        .status(400)
        .json({ message: "Sender and receiver are required" });
    }
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// GET endpoint to fetch group messages by groupId
app.get("/api/groupMessages", async (req, res) => {
  try {
    const { groupId } = req.query;
    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required" });
    }
    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    console.error("Error fetching group messages:", err);
    res.status(500).json({ message: "Error fetching group messages" });
  }
});

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/chatapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

server.listen(5000, () => console.log("Server running on port 5000"));
