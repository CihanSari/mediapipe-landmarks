const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { getInstanceName } = require("./instance.js");
app.use(express.static("dist"));

io.on("connection", (socket) => {
  socket.on("get-random-instance", () => {
    socket.emit("instance-name", getInstanceName());
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected.");
  });
  socket.on("join", (instance_name) => {
    socket.join(instance_name);
  });
  socket.on("landmarks", (landmarks, instance_name) => {
    io.to(instance_name).emit("landmarks", landmarks);
    console.log(landmarks);
    console.log(`Landmarks received with: ${landmarks.length} elements!`);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
