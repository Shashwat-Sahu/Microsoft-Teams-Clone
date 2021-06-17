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

const CreateRef = ({ peer }) => {
  const clientRef = useRef();
  useEffect(() => {
    peer.on("stream", (stream) => {
      // console.log(stream)
      clientRef.current.srcObject = stream
    })
  }, [])
  return <UserVideo hostRef={clientRef} muted={false} />;
}

const Meet = (props) => {
  const { camera, mic, setMic, setCamera, stream, setStream } = props;
  const hostRef = useRef()
  const [peers, setPeers] = useState([]);
  const [audioFlag, setAudioFlag] = useState(true);
  const [videoFlag, setVideoFlag] = useState(true);
  const [userUpdate, setUserUpdate] = useState([]);
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
  }


  useEffect(() => {
    socketRef.current = io.connect("/");
    createStream();
  }, []);

  function createStream() {
    MediaInit({ camera, mic, hostRef, setStream }).then((stream) => {
      console.log("Promise stream", stream)
      hostRef.current.srcObject = stream;
      if (!mic) {
        hostRef.current.srcObject.getTracks().forEach(function (track) {
          if (track.kind === "audio") {
            track.stop();
          }
        }
        )
      }
      if (!camera) {
        hostRef.current.srcObject.getTracks().forEach(function (track) {
          if (track.kind === "video") {
            track.stop();
          }
        }
        )
      }
      socketRef.current.emit("join room", roomID);
      socketRef.current.on("all users", (users) => {
        console.log("All Users", users)
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID, socketRef.current.id, stream);
          peersRef.current.push({
            peerID: userID,
            peer,
          });
          peers.push({
            peerID: userID,
            peer,
          });
        });
        setPeers(peers);
      });
      socketRef.current.on("user joined", (payload) => {
        console.log("User Joined", payload)
        const peer = addPeer(payload.signal, payload.callerID, stream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });
        // peers.push({
        //   peerID: payload.callerID,
        //   peer
        // })
        const peerUpdate = peersRef.current.filter((p) => p.peerID !== payload.callerID);
        peerUpdate.push({
          peerID: payload.callerID,
          peer
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
        console.log("change", payload);
        setUserUpdate(payload);
      });
    });
  }

  useEffect(() => {
    console.log("All peers", peers);
    console.log("Peer ref", peersRef.current)
  })

  function createPeer(userToSignal, callerID, stream) {
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
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }
  const ToggleState = (state, setState) => {
    Toggler(state, setState);
  }

  return (<div className="meet-parent">
    <div className="members-row">

      <UserVideo hostRef={hostRef} muted={true} style={style} />
      {camera
        ? null :
        <div className="camera-off-member"></div>
      }
    </div>
    {
      peers.map(peer => {
        return (
          <CreateRef peer={peer.peer} />
        )

        // console.log(peer.peer)
        // return(

        // <UserVideo hostRef={ref} />

        // )
      })
    }
    <button onClick={() => {
      if(hostRef.current.srcObject&&hostRef.current&&hostRef)
      {
      hostRef.current.srcObject.getTracks().forEach(function (track) {

        if (track.kind === "audio") {

          socketRef.current.emit("change", [...userUpdate, {

            id: socketRef.current.id,
            video: camera,
            audio: !mic,
          }]);
          track.enabled = !mic
        }

      })
      ToggleState(mic, setMic)
    }
    }}>
      {
        mic ? <Icon icon={micIcon} />
          :
          <Icon icon={micMute} />
      }</button>
    <button onClick={() => {
            if(hostRef.current.srcObject&&hostRef.current&&hostRef){
      hostRef.current.srcObject.getTracks().forEach(function (track) {
        if (track.kind === "video") {
          socketRef.current.emit("change", [...userUpdate, {
            id: socketRef.current.id,
            video: !camera,
            audio: mic,
          }]);
          track.enabled = !camera
        }

      })
      ToggleState(camera, setCamera)
    }
    }}>
      {
        camera ? <Icon icon={cameraVideo} />
          :
          <Icon icon={cameraVideoOff} />
      }
    </button>
  </div>
  )
}

export default Meet