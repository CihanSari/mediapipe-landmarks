const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { hri } = require("human-readable-ids");
app.use(express.static("dist"));

io.on("connection", (socket) => {
  socket.on("get-random-instance", () => {
    socket.emit("instance-name", hri.random());
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected.");
  });
  let instance_name;
  socket.on("broadcaster-join", (instance_name_req) => {
    instance_name = instance_name_req;
    // we don't listen to landmarks with web client
  });
  socket.on("join", (instance_name_req) => {
    instance_name = instance_name_req;
    socket.join(instance_name);
  });
  socket.on("landmarks", (landmarks) => {
    if (instance_name != null)
      io.to(instance_name).emit("landmarks", landmarks);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
