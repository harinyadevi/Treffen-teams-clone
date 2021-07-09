const express = require("express");
//Using the 'require' function to get the express module

const app = express();
//express application created; 'app' object has methods for routing http requests

const server = require("http").Server(app);
//Requiring the 'http' module of node.js to transfer data over http and the server is created

const { v4: uuidv4 } = require("uuid");
//unviersally unique identifiers; uuid module is imported and a random id gets created

app.set("view engine", "ejs");
//set the view engine to ejs (for rendering web pages)

const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
//module socket.io is imported; cross origin resource sharing;


const { ExpressPeerServer } = require("peer");         //requiring the peer server module
const peerServer = ExpressPeerServer(server, {         //accessing the peer server
  debug: true,
});

app.use("/peerjs", peerServer);           //serving the peerjs at an instance of ExpressPeerServer
app.use(express.static('public'));        //access all the static files within the public folder


//A route method is derived from one of the HTTP methods, and is attached to an instance of the express class
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});                                       
//redirects to the randomly generated room id

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });      
});
//add a view for every unique room and passing the current URL to that view


//socket connection established, whenever someone connects
io.on("connection", (socket) => {                                   
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);                                            //join the particular room using roomId
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});

server.listen(process.env.PORT || 3000);        //listening on port 3000 (output)
