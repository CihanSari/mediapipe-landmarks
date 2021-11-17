class SocketInterface {
  socket = io();

  listen(instance_name) {
    this.socket.emit("join", instance_name);
    this.socket.on("landmarks", (landmarks) => {
      console.log("Landmarks received: ", landmarks);
    });
  }
}

const socketInterface = new SocketInterface();

document.getElementById("instance_listen").onclick = () => {
  const instanceName = document.getElementById("instance_name").value;
  socketInterface.listen(instanceName);
};
