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
import shareScreenStart28Filled from '@iconify/icons-fluent/share-screen-start-28-filled';
import Chats from "./Chats";
import { connect } from 'react-redux';
import "../styles/meet.css"
import { useBeforeunload } from 'react-beforeunload';
import Modal from 'react-modal';
import { useHistory } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const CreateRef = ({ peer, style, options }) => {


  const clientRef = useRef();

  var optionUser = peer.options ? peer.options : { video: false, audio: false };

  if (options)
    optionUser = options;
  useEffect(() => {
    peer.peer.on("stream", (stream) => {

      clientRef.current.srcObject = stream
    })
    peer.peer.on("track", (track, stream) => {
    })

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

  const { camera, mic, setMic, setCamera, stream, setStream, name, email, setName, setEmail, setVideoDevices, setAudioDevices } = props;
  const hostRef = useRef()
  const [peers, setPeers] = useState([]);
  const [userUpdate, setUserUpdate] = useState();
  // Modal to ask Name from user (optional)
  const [modalIsOpen, setIsOpen] = useState(name == "Anonymous" ? true : false)
  const [chatBadge, setChatBadge] = useState(false)

  const socketRef = useRef();
  const peersRef = useRef([]);
  const chatsRef = useRef([]);
  // Storing peers for screen Share in ref
  const screenSharesRef = useRef([]);
  // Storing peers for screen Share as a state
  const [screenShares, setScreenShares] = useState([])
  // screenStream is to store screen stream
  const screenStream = useRef()
  // screenStreamComponent is ref video screen share element
  const screenStreamComponent = useRef()
  // Storing screen streams for each person
  const userScreenStreams = useRef([])
  const chatOpenedRef = useRef();
  const history = useHistory()
  const [openChat, setOpenChat] = useState(false);
  const [chats, setChats] = useState([])
  const [screenSharingEnabled, setScreenSharingEnabled] = useState(false)
  const screenSharingEnabledRef = useRef(false);

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
    width: "80%",
    maxWidth: "400px",
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
    chatOpenedRef.current = openChat;
  }, [])

  useBeforeunload((event) => {

    if (socketRef && socketRef.current) {
      socketRef.current.emit("disconnectMeet")
    }

  });

  const disconnectMeet = () => {
    socketRef.current.emit("disconnectMeet")
    setTimeout(() => {
      history.push("/")
    },
      1000);
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
      !chatOpenedRef.current ? setChatBadge(true) : setChatBadge(false);
      chatsRef.current = [...chatsRef.current, { name: message.name, message: message.message }];
      const chatsUpdated = chatsRef.current;
      setChats(chatsUpdated)

    })
  }



  const screenShare = () => {
    if (!screenSharingEnabled) {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(screenStreamUpdate => {
        setScreenSharingEnabled(true)
        screenSharingEnabledRef.current = true
        screenStreamComponent.current.srcObject = screenStreamUpdate
        console.log(screenStreamComponent.current.muted)
        socketRef.current.emit("screen stream update", { updateStream: true, roomID })
        screenSharesRef.current.forEach((screenRef) => {
          if (screenStreamUpdate.getTracks()[1]) {
            screenRef.peer.replaceTrack(screenStream.current.getTracks()[1], screenStreamUpdate.getTracks()[1], screenStream.current)
            screenRef.peer.replaceTrack(screenStream.current.getTracks()[0], screenStreamUpdate.getTracks()[0], screenStream.current)
          }
          else if (screenStreamUpdate.getTracks()[0]) {
            screenRef.peer.replaceTrack(screenStream.current.getTracks()[1], screenStreamUpdate.getTracks()[0], screenStream.current)
          }
        })
        screenStreamUpdate.getVideoTracks()[0].onended = function () {
          setScreenSharingEnabled(false)
          screenSharingEnabledRef.current = false
          if (screenStreamUpdate.getAudioTracks()[0])
            screenStreamUpdate.getAudioTracks()[0].stop();
          socketRef.current.emit("screen stream update", { updateStream: false, roomID })
        };
      })
    }
    else {
      setScreenSharingEnabled(false)
      screenSharingEnabledRef.current = false
      if (screenStreamComponent.current.srcObject.getAudioTracks()[0])
        screenStreamComponent.current.srcObject.getAudioTracks()[0].stop();
      screenStreamComponent.current.srcObject.getVideoTracks()[0].stop()

      socketRef.current.emit("screen stream update", { updateStream: false, roomID })
    }
  }


  const enableScreenSharingForNewUser = (peer) => {
    console.log("New peer for screen share dynamic", peer)
    if (screenStreamComponent.current.srcObject.getAudioTracks()[0]) {
      peer.replaceTrack(screenStream.current.getTracks()[1], screenStreamComponent.current.srcObject.getTracks()[1], screenStream.current)
      peer.replaceTrack(screenStream.current.getTracks()[0], screenStreamComponent.current.srcObject.getTracks()[0], screenStream.current)
    }
    else {
      peer.replaceTrack(screenStream.current.getTracks()[1], screenStreamComponent.current.srcObject.getTracks()[0], screenStream.current)
    }
  }


  const sendMessage = (sendMessage) => {
    const payload = { name, message: sendMessage, senderId: socketRef.current.id, roomID };
    socketRef.current.emit("send message", payload);
    chatsRef.current = [...chatsRef.current, { name: "You", message: payload.message }]
    const chatsUpdated = chatsRef.current;
    setChats(chatsUpdated)

  }




  function createStream() {
    MediaInit({ camera, mic, hostRef, setStream }).then((stream) => {
      setStream(stream);
      hostRef.current.srcObject = stream;
      screenStream.current = stream.clone();
      screenStream.current.getTracks().forEach(function (track) {
        if (track.kind === "audio") {
          track.enabled = false;
        }
        if (track.kind === "video") {
          track.enabled = false;
        }
      }
      )
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
          toast.dark(`${userID.name} is already present`, {
            position: "top-left",
            hideProgressBar: false
          });
        });
        setPeers(peers);
        const peersForScreenStream = [];

        users.forEach((userID) => {
          const peer = createPeerForScreenShare(userID.id, socketRef.current.id, screenStream.current);
          screenSharesRef.current.push({
            peerID: userID.id + "-screen-share",
            peer,
            options: userID.options,
            name: userID.name
          });
          peersForScreenStream.push({
            peerID: userID.id + "-screen-share",
            peer,
            options: userID.options,
            name: userID.name
          });

        });
        setScreenShares(peersForScreenStream);

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
        const peerUpdate = peersRef.current.filter((p) => p.peerID !== payload.callerID);
        peerUpdate.push({
          peerID: payload.callerID,
          peer,
          options: payload.options,
          name: payload.name
        })
        toast.dark(`${payload.name} has joined`, {
          position: "top-left",
          hideProgressBar: false
        });
        setPeers(peerUpdate)
      });

      socketRef.current.on("user left", (id) => {
        console.log("User Left", id);
        const index = peersRef.current.findIndex((p) => p.peerID === id);

        if (index != -1) {
          if (peersRef.current[index]) {
            peersRef.current[index].peer.destroy();
            toast.dark(`${peersRef.current[index].name} has left`, {
              position: "top-left",
              hideProgressBar: false
            });
          }
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

      socketRef.current.on("user added screen stream", (payload) => {
        console.log("User added screen stream", payload)
        const peer = addPeerForScreenShare(payload.signal, payload.callerID, screenStream.current);
        screenSharesRef.current.push({
          peerID: payload.callerID + "-screen-share",
          peer,
        });
        const peerUpdate = screenSharesRef.current.filter((p) => p.peerID !== payload.callerID + "-screen-share");
        peerUpdate.push({
          peerID: payload.callerID + "-screen-share",
          peer,
        })
        setScreenShares(peerUpdate)
        if (screenSharingEnabledRef)
          enableScreenSharingForNewUser(peer)
      });

      socketRef.current.on("user left screen stream", (id) => {
        console.log("User Left screen stream", id);
        const index = screenSharesRef.current.findIndex((p) => p.peerID === id);

        if (index != -1) {
          if (screenSharesRef.current[index]) {
            screenSharesRef.current[index].peer.destroy();
          }
        }
        const peers = screenSharesRef.current.filter((p) => p.peerID !== id);
        screenSharesRef.current = peers;

        setScreenShares(peers);
      });

      socketRef.current.on("receiving returned screen stream", (payload) => {
        console.log("Receiving signal", payload)
        const item = screenSharesRef.current.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });

      socketRef.current.on("screen share update", payload => {
        console.log("stream update", payload)
        if (payload.updateStream) {
          setScreenSharingEnabled(true)
          screenSharingEnabledRef.current = true
          const peer = userScreenStreams.current.find((peer) => peer.peerID == payload.id + "-screen-share");
          screenStreamComponent.current.srcObject = peer.stream
        }
        else {
          setScreenSharingEnabled(false)
          screenSharingEnabledRef.current = false
        }
      })


    }).catch(err => {
      console.log(err)
    })
  }



  function createPeer(userToSignal, callerID, stream, options, name) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream

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
      stream
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID, options, name });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  function createPeerForScreenShare(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream

    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending screen stream", {
        userToSignal,
        callerID,
        signal,

      });
    });


    return peer;
  }

  function addPeerForScreenShare(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning screen stream", { signal, callerID });
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
    var i = 0;
    screenSharesRef.current.forEach((peer) => {
      peer.peer.on("stream", (stream) => {
        userScreenStreams.current.push({ peerID: peer.peerID, stream })
        i++;
        if (i == screenSharesRef.current.length && !screenSharingEnabled) {
          socketRef.current.emit("screen streaming running for new user", { roomID })
        }
      })
    })

  }, [screenShares, screenSharesRef])
  useEffect(() => {

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
        <div className="meet-icons">
          <img src={MicrosoftTeams}
            className="meet-teams-logo"
            onClick={() => { window.location = "/" }} />
          <div className="meet-top-option-box">
            <Icon icon={shareScreenStart28Filled}
              onClick={screenShare}
              className="screen-share" />
            <div className="chat-opener-wrapper">
              <Icon
                icon={bxsMessageAltDetail}
                className="chat-opener"
                onClick={() => {
                  setOpenChat(!openChat);
                  setChatBadge(false)
                  chatOpenedRef.current = false
                }}
              />
              {
                chatBadge ?
                  <div className="chat-badge">

                  </div> : null
              }
            </div>
          </div>
        </div>
        <div className="meet_And_screen_share">

          <div className="screen-share-box" style={{ display: screenSharingEnabled ? 'flex' : 'none' }}>
            <video ref={screenStreamComponent} muted={false} playsInline id="share-screen-user" autoPlay />
          </div>

          <div className="members-with-config" style={{ width: screenSharingEnabled ? '30%' : '100%' }}>
            <div className="members-row">
              <UserVideo hostRef={hostRef} muted={true} style={style} />
              {camera
                ? null :
                <div className="camera-off-member">
                  <div className="member-name">{name.slice(0, 1)}</div>
                </div>
              }
              {
                peersRef.current.map(peer => {
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


        </div>
      </div>
      <Chats chats={chats} sendMessage={sendMessage} openChat={openChat} setOpenChat={setOpenChat} />
      <ToastContainer />
    </div>
  )
}

const mapStateToProps = state => {
  return {
    email: state.userDetails.email,
    name: state.userDetails.name,
    mic: state.userDetails.mic,
    camera: state.userDetails.camera,
    stream: state.userDetails.stream,
    videoDevices: state.userDetails.videoDevices,
    audioDevices: state.userDetails.audioDevices
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
    },
    setVideoDevices: data => {
      dispatch({
        type: 'SET_VIDEO_DEVICES',
        videoDevices: data
      })
    },
    setAudioDevices: data => {
      dispatch({
        type: 'SET_AUDIO_DEVICES',
        audioDevices: data
      })
    }
  }
}



export default connect(mapStateToProps, mapDispatchToProps)(Meet)