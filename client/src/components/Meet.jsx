import React, { useRef, useEffect, useState } from 'react'
import UserVideo from "./userWindow"
import { Toggler, MediaInit } from "../utils/utilityFunctions"
import { io } from "socket.io-client"
import Peer from "simple-peer"
import { Icon } from '@iconify/react';
import micMute from '@iconify/icons-bi/mic-mute';
import micIcon from '@iconify/icons-bi/mic';
import cameraVideo from '@iconify/icons-bi/camera-video';
import cameraVideoOff from '@iconify/icons-bi/camera-video-off';
import "../styles/meet.css"

const CreateRef = ({ peer, style,options }) => {
  console.log(peer)
  const clientRef = useRef();
  var optionUser=peer.options?peer.options:{video:false,audio:false};
  if(options)
  optionUser=options;
  useEffect(() => {
    peer.peer.on("stream", (stream) => {
      console.log(stream.getTracks())
      // setOptionUser({audio:stream.getTracks()[0].enabled,video:stream.getTracks()[1].enabled})
      clientRef.current.srcObject = stream
    })
    console.log(optionUser)
  }, [])

  return <>
    <UserVideo hostRef={clientRef} muted={false} style={{ ...style, display: optionUser.video ? "block" : "none" }} id={peer.peerID+"-video_on"}/>
    <div className="camera-off-member" style={{ ...style, display: !optionUser.video ? "block" : "none"}} id={peer.peerID+"-video_off"}></div>
  </>


}

const Meet = (props) => {
  const { camera, mic, setMic, setCamera, stream, setStream } = props;
  const hostRef = useRef()
  const [peers, setPeers] = useState([]);
  const [audioFlag, setAudioFlag] = useState(true);
  const [videoFlag, setVideoFlag] = useState(true);
  const [userUpdate, setUserUpdate] = useState();
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  console.log(props.params)
  const roomID = "123";

  const style = {
    width: "400px",
    height: "200px",
    display: camera ? "block" : "none",
    boxSizing: "border-box",
    boxShadow: "0px 1px 24px -1px rgba(0, 0, 0, 0.1)",
    borderRadius: "27px",
    objectFit: "cover",
    margin: "20px"
  }


  useEffect(() => {

    socketRef.current = io.connect("https://microsoft-team-clone.herokuapp.com/");
    // socketRef.current = io.connect("http://localhost:8000");
    createStream();
  }, []);

  function createStream() {
    MediaInit({ camera, mic, hostRef, setStream }).then((stream) => {

      hostRef.current.srcObject = stream;

      {
        hostRef.current.srcObject.getTracks().forEach(function (track) {
          if (track.kind === "audio") {
            track.enabled = mic;
          }
          if (track.kind === "video") {
            track.enabled = camera;
          }
        }
        )
      }
      console.log("Promise stream", stream.getTracks())
      var options = {audio:mic,video:camera}
      socketRef.current.emit("join room", {roomID,options});
      socketRef.current.on("all users", (users) => {
        console.log("All Users", users)
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID.id, socketRef.current.id, stream,options);
          peersRef.current.push({
            peerID: userID.id,
            peer,
            options: userID.options
          });
          peers.push({
            peerID: userID.id,
            peer,
            options: userID.options
          });
        });
        setPeers(peers);
      });
      socketRef.current.on("user joined", (payload) => {
        console.log("User Joined data", payload)
        const peer = addPeer(payload.signal, payload.callerID, stream,payload.options);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
          options:payload.options
        });
        // peers.push({
        //   peerID: payload.callerID,
        //   peer
        // })
        const peerUpdate = peersRef.current.filter((p) => p.peerID !== payload.callerID);
        peerUpdate.push({
          peerID: payload.callerID,
          peer,
          options:payload.options
        })
        setPeers(peerUpdate)
        console.log("Total Users", peers)
      });

      socketRef.current.on("user left", (id) => {
        console.log("User Left", id);
        const peerObj = peersRef.current.find((p) => p.peerID === id);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        const peers = peersRef.current.filter((p) => p.peerID !== id);
        peersRef.current = peers;
        console.log("After User Left", peers)
        setPeers(peers);
      });

      socketRef.current.on("receiving returned signal", (payload) => {
        console.log("Receiving signal", payload)
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });

      socketRef.current.on("change", (payload) => {
        setUserUpdate({id:payload.id,video:payload.video,audio:payload.audio});
      });
    });
  }

  useEffect(() => {
    console.log("All peers", peers);
    console.log("Peer ref", peersRef.current)
  })

  function createPeer(userToSignal, callerID, stream,options) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
        options
      });
    });


    return peer;
  }

  function addPeer(incomingSignal, callerID, stream,options) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID ,options});
    });

    peer.signal(incomingSignal);

    return peer;
  }
  const ToggleState = (kind, state, setState) => {
    if (hostRef.current.srcObject && hostRef.current && hostRef) {
      hostRef.current.srcObject.getTracks().forEach(function (track) {

        if (track.kind === kind) {

          socketRef.current.emit("change", {

            id: socketRef.current.id,
            video: kind == "video" ? !camera : camera,
            audio: kind == "audio" ? !mic : mic,
          });
          track.enabled = kind == "audio" ? !mic : !camera;
        }
        Toggler(state, setState)
      })
    }
  }
  useEffect(() => {
    console.log("Peers", peers)
    console.log("Peers", peersRef.current)
    
  },[peers,peersRef])
  useEffect(() => {
    console.log("Update", userUpdate);
    if(userUpdate)
    {
    if(userUpdate.video) {
      if(document.getElementById(userUpdate.id+"-video_on")&&document.getElementById(userUpdate.id+"-video_off"))
      {
      document.getElementById(userUpdate.id+"-video_on").style.display="block"
      document.getElementById(userUpdate.id+"-video_off").style.display="none"
      }
    }
    else{
      if(document.getElementById(userUpdate.id+"-video_on")&&document.getElementById(userUpdate.id+"-video_off"))
      {
      document.getElementById(userUpdate.id+"-video_on").style.display="none"
      document.getElementById(userUpdate.id+"-video_off").style.display="block"
      }
    }
  }
  })
  return (<div className="meet-parent">
    <div className="members-row">

      <UserVideo hostRef={hostRef} muted={true} style={style} />
      {camera
        ? null :
        <div className="camera-off-member"></div>
      }
      {
        peers.map(peer => {
          return <CreateRef peer={peer} style={style}/>
        })
      }
    </div>
<div className="meet-options">
    {
      mic
        ?
        <Icon 
        icon={micIcon} 
        className="meet-controllers"
        onClick={() => {

          ToggleState("audio", mic, setMic)

        }} />
        :
        <Icon 
        icon={micMute} 
        className="meet-controllers"
        onClick={() => {

          ToggleState("audio", mic, setMic)

        }} />
    }
    {
      camera
        ?
        <Icon 
        icon={cameraVideo} 
        className="meet-controllers"
        onClick={() => {
          ToggleState("video", camera, setCamera)

        }} />
        :
        <Icon 
        icon={cameraVideoOff} 
        className="meet-controllers"
        onClick={() => {
          ToggleState("video", camera, setCamera)

        }} />
    }
    </div>
  </div>
  )
}

export default Meet