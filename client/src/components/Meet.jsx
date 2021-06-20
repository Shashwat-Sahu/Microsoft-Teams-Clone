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
import bxsMessageAltDetail from '@iconify/icons-bx/bxs-message-alt-detail';
import phoneOff from '@iconify/icons-carbon/phone-off';
import MicrosoftTeams from "../assets/microsoft-teams.svg";
import Chats from "./Chats";
import { connect } from 'react-redux';
import "../styles/meet.css"
import { useBeforeunload } from 'react-beforeunload';
import Modal from 'react-modal';
import { useHistory } from 'react-router-dom'

const CreateRef = ({ peer, style, options }) => {
  console.log(peer)
  const clientRef = useRef();

  var optionUser = peer.options ? peer.options : { video: false, audio: false };

  if (options)
    optionUser = options;
  useEffect(() => {
    peer.peer.on("stream", (stream) => {
      clientRef.current.srcObject = stream
    })
    console.log(optionUser)
  }, [])

  return <>
    <UserVideo
      hostRef={clientRef}
      muted={false}
      style={{ ...style, display: optionUser.video ? "block" : "none" }}
      id={peer.peerID + "-video_on"} />

    <div
      className="camera-off-member"
      style={{ ...style, display: !optionUser.video ? "flex" : "none" }}
      id={peer.peerID + "-video_off"}>
      <div className="member-name">{peer.name.slice(0, 1)}</div>
    </div>
  </>


}

const Meet = (props) => {

  const { camera, mic, setMic, setCamera, stream, setStream, name, email, setName, setEmail } = props;
  const hostRef = useRef()
  const [peers, setPeers] = useState([]);
  const [userUpdate, setUserUpdate] = useState();
  const [modalIsOpen, setIsOpen] = useState(name == "Anonymous" ? true : false)
  const socketRef = useRef();
  const peersRef = useRef([]);
  const chatsRef = useRef([]);
  const history = useHistory()
  const [openChat,setOpenChat] = useState(false);
  const [chats, setChats] = useState([])

  const customStylesModal = {
    overlay: {
      backgroundColor: 'rgba(0,0,0,0.7)'
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: '20px'
    },
  };
  const roomID = props.match.params.teamId;

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
    if (name != "Anonymous")
      startStream()

  }, [])

  useBeforeunload((event) => {
    if (socketRef && socketRef.current) {
      socketRef.current.emit("disconnectMeet")
    }
  });

  const disconnectMeet = () =>{
    // socketRef.current.emit("disconnectMeet")
    
      window.location="/"
    

  }

  const startStream = () => {
    setIsOpen(false)
    socketRef.current = io.connect("https://microsoft-team-clone.herokuapp.com/");
    // socketRef.current = io.connect("http://localhost:8000");
    createStream();
    startChat()
  }

  const startChat = () => {
    socketRef.current.on("receivedMessage", (message) => {
      console.log("Message",message)
      console.log("Here",chats)
      chatsRef.current = [...chatsRef.current, { name: message.name, message: message.message }];
      const chatsUpdated = chatsRef.current;
      setChats(chatsUpdated)
      
    })
  }
  const sendMessage = (sendMessage) => {
    const payload = { name, message:sendMessage,senderId:socketRef.current.id,roomID };
    socketRef.current.emit("send message", payload);
    chatsRef.current = [...chatsRef.current, { name: "You", message: payload.message }]
    const chatsUpdated = chatsRef.current;
    setChats(chatsUpdated)
    
  }
  useEffect(() => {
    console.log("Chats",chats)
  })
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
      var options = { audio: mic, video: camera }
      socketRef.current.emit("join room", { roomID, options, name });
      socketRef.current.on("all users", (users) => {
        console.log("All Users", users)
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID.id, socketRef.current.id, stream, options, name);
          peersRef.current.push({
            peerID: userID.id,
            peer,
            options: userID.options,
            name: userID.name
          });
          peers.push({
            peerID: userID.id,
            peer,
            options: userID.options,
            name: userID.name
          });
        });
        setPeers(peers);
      });
      socketRef.current.on("user joined", (payload) => {
        console.log("User Joined data", payload)
        const peer = addPeer(payload.signal, payload.callerID, stream, payload.options, payload.name);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
          options: payload.options,
          name: payload.name
        });
        // peers.push({
        //   peerID: payload.callerID,
        //   peer
        // })
        const peerUpdate = peersRef.current.filter((p) => p.peerID !== payload.callerID);
        peerUpdate.push({
          peerID: payload.callerID,
          peer,
          options: payload.options,
          name: payload.name
        })
        setPeers(peerUpdate)
        console.log("Total Users", peers)
      });

      socketRef.current.on("user left", (id) => {
        console.log("User Left", id);
        const index = peersRef.current.findIndex((p) => p.peerID === id);

        if (index != -1) {
          if (peersRef[index]) {
            peersRef[index].peer.destroy();
          }
          // var videoBox = document.getElementById(id + "-video_on")
          // var videoOffBox = document.getElementById(id + "-video_off")
          // if(videoBox)
          // videoBox.parentNode.removeChild(videoBox);
          // if(videoOffBox)
          // videoOffBox.parentNode.removeChild(videoOffBox);
        }
        const peers = peersRef.current.filter((p) => p.peerID !== id);
        peersRef.current = peers;

        setPeers(peers);
        console.log("After User Left", peers)
      });

      socketRef.current.on("receiving returned signal", (payload) => {
        console.log("Receiving signal", payload)
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });

      socketRef.current.on("change", (payload) => {
        setUserUpdate({ id: payload.id, video: payload.video, audio: payload.audio });
      });
    });
  }



  function createPeer(userToSignal, callerID, stream, options, name) {
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
        options,
        name
      });
    });


    return peer;
  }

  function addPeer(incomingSignal, callerID, stream, options) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID, options, name });
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

  }, [peers, peersRef])
  useEffect(() => {
    console.log("Update", userUpdate);
    if (userUpdate) {
      if (userUpdate.video) {
        if (document.getElementById(userUpdate.id + "-video_on") && document.getElementById(userUpdate.id + "-video_off")) {
          document.getElementById(userUpdate.id + "-video_on").style.display = "block"
          document.getElementById(userUpdate.id + "-video_off").style.display = "none"
        }
      }
      else {
        if (document.getElementById(userUpdate.id + "-video_on") && document.getElementById(userUpdate.id + "-video_off")) {
          document.getElementById(userUpdate.id + "-video_on").style.display = "none"
          document.getElementById(userUpdate.id + "-video_off").style.display = "flex"
        }
      }
    }
  })
  return (
    <div className="meet-parent">

      {/* Modal to add name */}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={startStream}
        style={customStylesModal}
        contentLabel="Name Modal"
      >
        <input
          type="text"
          placeholder="Enter Name (Optional)"
          className="name-input-meet"
          onChange={(e) => { setName(e.target.value) }}
        />
        <div className="Modal-Box-Meet-options">
          {
            mic
              ?
              <Icon
                icon={micIcon}
                className="meet-modal-controllers"
                onClick={() => {

                  setMic(!mic)

                }} />
              :
              <Icon
                icon={micMute}
                className="meet-modal-controllers"
                onClick={() => {

                  setMic(!mic)

                }} />
          }
          {
            camera
              ?
              <Icon
                icon={cameraVideo}
                className="meet-modal-controllers"
                onClick={() => {
                  setCamera(!camera)

                }} />
              :
              <Icon
                icon={cameraVideoOff}
                className="meet-modal-controllers"
                onClick={() => {
                  setCamera(!camera)

                }} />
          }
        </div>
        <div className="Modal-Box-Meet-footer">
          <button
            className="home-entry-buttons"
            onClick={startStream}
          >Confirm</button>
          <button
            className="home-entry-buttons"
            onClick={() => { setName("Anonymous"); startStream(); }}
          >Close</button>
        </div>
      </Modal>


      <div className="meet-outer-layout">
        <div className="members-with-config">
        <div className="meet-icons">
            <img src={MicrosoftTeams} className="meet-teams-logo"/>
            <Icon 
            icon={bxsMessageAltDetail} 
            className="chat-opener"
            onClick={()=>{setOpenChat(!openChat)}}
            />
            </div>
          <div className="members-row">
            <UserVideo hostRef={hostRef} muted={true} style={style} />
            {camera
              ? null :
              <div className="camera-off-member">
                <div className="member-name">{name.slice(0, 1)}</div>
              </div>
            }
            {
              peers.map(peer => {
                return <CreateRef peer={peer} style={style} />
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
            <Icon 
            className="meet-controllers" 
            icon={phoneOff}
            onClick={disconnectMeet}
            />

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
      <Chats chats={chats} sendMessage={sendMessage} openChat={openChat} setOpenChat={setOpenChat}/>
      </div>
    </div>
  )
}

const mapStateToProps = state => {
  return {
    email: state.userDetails.email,
    name: state.userDetails.name,
    mic: state.userDetails.mic,
    camera: state.userDetails.camera,
    stream: state.userDetails.stream
  }
}

const mapDispatchToProps = dispatch => {
  return {

    setEmail: data => {
      dispatch({
        type: 'SET_EMAIL',
        email: data,
      })
    },
    setName: data => {
      dispatch({
        type: 'SET_NAME',
        name: data
      })
    },
    setMic: data => {
      dispatch({
        type: 'SET_MIC',
        mic: data
      })
    }
    ,
    setCamera: data => {
      dispatch({
        type: 'SET_CAMERA',
        camera: data
      })
    }
    ,
    setStream: data => {
      dispatch({
        type: 'SET_STREAM',
        stream: data
      })
    }
  }
}



export default connect(mapStateToProps, mapDispatchToProps)(Meet)