const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
console.log("JWT_SECRET from .env:", process.env.JWT_SECRET);

const Message = require("./models/message"); // Message model
const authRoutes = require("./routes/auth"); // Auth routes
const groupRoutes = require("./routes/group"); // Group routes
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);

const __dirname1 = path.resolve();
const staticPath = path.join(__dirname1, "..", "frontend", "build");

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Serving static files from:", staticPath);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(staticPath));

  app.get("*", (req, res) => {
    console.log("Serving index.html");
    res.sendFile(
      path.resolve(__dirname1, "..", "frontend", "build", "index.html")
    );
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running successfully");
  });
}
// Online users tracking
let onlineUsers = {};

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/chatapp"
    );
    console.log("✅ MongoDB connected successfully");
    console.log("NODE_ENV:", process.env.NODE_ENV);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    setTimeout(connectDB, 5000); // Retry connection every 5 seconds
  }
};

connectDB();

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("🔵 User Connected:", socket.id);

  // Identify user
  socket.on("identify", (username) => {
    if (!username || typeof username !== "string") {
      console.error("❌ Invalid username format:", username);
      return;
    }
    onlineUsers[username.trim()] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log(`🟢 User identified: ${username}`, onlineUsers);
  });

  // PRIVATE CHAT EVENTS
  socket.on("joinRoom", ({ sender, receiver }) => {
    const roomId = [sender, receiver].sort().join("_");
    socket.join(roomId);
    console.log(`📌 ${sender} joined room: ${roomId}`);
  });

  socket.on("sendMessage", async (data) => {
    console.log("📩 Private message received:", data);
    try {
      const message = new Message(data);
      await message.save();
      console.log("✅ Private message saved to DB");

      const roomId = [data.sender, data.receiver].sort().join("_");
      io.to(roomId).emit("receiveMessage", data);
    } catch (err) {
      console.error("❌ Error saving private message:", err);
    }
  });

  // Read Receipts
  socket.on("markAsRead", async (data) => {
    try {
      console.log("📖 Marking messages as read for:", data);

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
        messages: updatedMessages,
      });

      console.log(`✅ Marked messages as read for conversation: ${roomId}`);
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }
  });

  // GROUP CHAT EVENTS
  socket.on("joinGroup", ({ groupId, user }) => {
    socket.join(groupId);
    console.log(`👥 ${user} joined group ${groupId}`);
  });

  socket.on("sendGroupMessage", async (data) => {
    console.log("📢 Group message received:", data);
    try {
      const message = new Message({
        sender: data.sender,
        text: data.text,
        time: data.time,
        groupId: data.groupId,
      });
      await message.save();
      console.log("✅ Group message saved");

      io.to(data.groupId).emit("receiveGroupMessage", data);
    } catch (err) {
      console.error("❌ Error saving group message:", err);
    }
  });

  // Typing Indicator
  socket.on("typing", (data) => {
    const roomId = [data.sender, data.receiver].sort().join("_");
    socket.broadcast.to(roomId).emit("typing", data);
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    for (const [username, id] of Object.entries(onlineUsers)) {
      if (id === socket.id) {
        delete onlineUsers[username];
        break;
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("🔴 User Disconnected:", socket.id);
  });
});

// GET Private Messages
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
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// GET Group Messages
app.get("/api/groupMessages", async (req, res) => {
  try {
    const { groupId } = req.query;
    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required" });
    }
    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    console.error("❌ Error fetching group messages:", err);
    res.status(500).json({ message: "Error fetching group messages" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
