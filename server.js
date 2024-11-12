// chat-backend/server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Set frontend URL
    methods: ["GET", "POST"],
  },
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Socket.IO event handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_session", (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined session ${sessionId}`);
  });

  socket.on("send_message", async (message) => {
    const { sessionId, sender, content } = message;

    io.to(sessionId).emit("new_message", message);

    try {
      const newMessage = new Message({ sessionId, sender, content });
      await newMessage.save();
      console.log("Message saved to database:", newMessage);
    } catch (error) {
      console.error("Error saving message to database:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
