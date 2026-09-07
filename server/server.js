import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import usersRoutes from "./routes/usersRoutes.js"

import { Server } from "socket.io";



dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [
      "https://horizontechx-taskflow-realtime-z8ne.onrender.com",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = new Server(server, {
  cors: {
     origin: "https://horizontechx-taskflow-realtime-z8ne.onrender.com",
    methods: ["GET", "POST", "PUT"],
  },
});


io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);


  // JOIN PROJECT ROOM
  socket.on("joinProject", (projectId) => {
    socket.join(projectId);
  });


  // TASK CREATED
  socket.on("taskCreated", ({ projectId, task }) => {
    socket.to(projectId).emit("receiveTask", task);
  });


  // TASK UPDATED
  socket.on("taskUpdated", ({ projectId, tasks }) => {
    socket.to(projectId).emit("tasksUpdated", tasks);
  });


  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });

});

/// api

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);

