const socket = io("/");
//server API

const videospace = document.getElementById("videospace");
//display videos

const currentvideo = document.createElement("video");                      
currentvideo.muted = true;


const user = prompt("Username");
//username

//connecting to the server from client PeerJS
var peer = new Peer(undefined, {
  path: "/peerjs",                            
  host: "/",
  port: "3000",
});

let currentvideostream;

//getUserMedia -> to relay media

navigator.mediaDevices.getUserMedia({ audio: true, video: true, }).then((stream) => {
//real-time media stream is depicted by a 'stream' object in the form of video or audio
    currentvideostream = stream;
    addVideoStream(currentvideo, stream);
    //addVideoStream function to add the stream to the video element

    peer.on("call", (call) => {
    //answering the call providing our data stream
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        //adding the remote video to the canvas element
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
      //connection gets established and the users get connected
    });
  });

const connectToNewUser = (userId, stream) => {              //calling a peer and establishing a connection
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);                  //adding peer's remote media
  });
};

const addVideoStream = (video, stream) => {                  //addVideoStream function to add the stream to the 'video' element
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videospace.append(video);
  });
};

peer.on("open", (id) => {
  //every peer object is assigned a random, unique id when it's created
  socket.emit("join-room", ROOM_ID, id,user);
});


const adduser = document.querySelector("#adduser");                     //adduser icon to invite a new user
const micicon = document.querySelector("#micicon");                     //micicon to switch on and off audio
const cameraicon = document.querySelector("#cameraicon");               //cameraicon to switch on and off video
const leaveroom = document.querySelector("#leaveroom");                 //leave icon to leave the meeting
const screenbutton = document.querySelector("#screenbutton");           //screen sharing icon to share the screen

var constraints =  { audio: true,  video: true};

function handleSuccess(stream) {
  screenbutton.disabled = true;
  
  currentvideo.srcObject = stream;
  //screen of the user gets relayed

  stream.getVideoTracks()[0].addEventListener('ended', () => {                            
    console.log("User ended sharing screen");
    screenbutton.disabled = false;
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      //video comes back when screen sharing stops
      var video = document.querySelector('video');
      video.srcObject = stream;
   }).catch(function(err) {
       //error displayed in the console
        console.log('Error in getting stream', err);
   });
  });
}

function handleError(error) {
  console.log(error);
}

screenbutton.addEventListener('click', () => {
  navigator.mediaDevices.getDisplayMedia({video: true})                                  
  //getDisplayMedia() to capture user's screen
      .then(handleSuccess, handleError);
});

if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
  //to handle screen sharing
  screenbutton.disabled = false;
} else {
  console.log("Not supported");
}


micicon.addEventListener("click", () => {
  //when micicon is clicked
  const enabled = currentvideostream.getAudioTracks()[0].enabled;
  if (enabled) {
    currentvideostream.getAudioTracks()[0].enabled = false;
    console.log('Audio stopped streaming');
    html = `<i class="fas fa-microphone-slash"></i>`;
    //to change the icon
    micicon.innerHTML = html;
  } else {
    currentvideostream.getAudioTracks()[0].enabled = true;
    console.log('Audio started streaming');
    html = `<i class="fas fa-microphone"></i>`;
    micicon.innerHTML = html;
  }
});

adduser.addEventListener("click", (e) => {
  //when adduser icon clicked
  prompt(
    "Copy and share link to invite new users!!",
    //user is prompted with the url link
    window.location.href
  );
  console.log('User add');
});

cameraicon.addEventListener("click", () => {
  //when cameraicon clicked
  const enabled = currentvideostream.getVideoTracks()[0].enabled;                            
  if (enabled) {
    currentvideostream.getVideoTracks()[0].enabled = false;
    console.log('Video stopped streaming');
    html = `<i class="fas fa-video-slash"></i>`;
    cameraicon.innerHTML = html;
  } else {
    currentvideostream.getVideoTracks()[0].enabled = true;
    console.log('Video started streaming');
    html = `<i class="fas fa-video"></i>`;
    cameraicon.innerHTML = html;
  }
});

leaveroom.addEventListener("click",(e) => {
  //when a user clicks the leaveroom icon
  alert("Close tab/window to leave the meeting!"); 
  console.log('Exit room');
});

let msg = document.querySelector("#chatwin");               //msg area for the chat window
let send = document.getElementById("send");                 //send icon
let allmsgs = document.querySelector(".allmsgs");           //all messages in the chat window

send.addEventListener("click", (e) => {
  //when the send icon is clicked
  if (msg.value.length !== 0) {
    socket.emit("message", msg.value);
    msg.value = "";
    //msg value becomes null after the message is sent
  }
});


socket.on("createMessage", (message, userName) => {
  //message and username
  allmsgs.innerHTML =
    allmsgs.innerHTML +
    //displays the username and message
    `<div class="message">
        <b><span> ${ userName }</span> </b>
        <span>${message}</span>
    </div>`;
});
