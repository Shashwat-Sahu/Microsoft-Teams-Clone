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
import shareScreenStop20Filled from '@iconify/icons-fluent/share-screen-stop-20-filled';
import overflowMenuHorizontal from '@iconify/icons-carbon/overflow-menu-horizontal';
import record48Regular from '@iconify/icons-fluent/record-48-regular';
import Switch from "react-switch";
import ReactTooltip from 'react-tooltip';
import transcriptIcon from '@iconify/icons-gg/transcript';
import Chats from "./Chats";
import { connect } from 'react-redux';
import "../styles/meet.css"
import { useBeforeunload } from 'react-beforeunload';
import Modal from 'react-modal';
import { useHistory } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Transcript from './Transcript'



const CreateRef = ({ peer, style, options }) => {
  const clientRef = useRef();
  var optionUser = peer.options ? peer.options : { video: false, audio: false };
  if (options)
    optionUser = options;
  useEffect(() => {
    
    peer.peer.on("stream", (stream) => {
      console.log("here")
      if(clientRef&&clientRef.current)
      clientRef.current.srcObject = stream
      peer.stream = stream
    })
  
  }, [])

  
  return peer.destroyed?null:<>
  <div className="user-video-box" style={{display: optionUser.video ? "block" : "none"}} id={peer.peerID + "-video_on"}>
    <UserVideo
      hostRef={clientRef}
      muted={false}
      style={style }
    />
    <div className="member-name">
        {peer.name}
      </div>
    </div>
    <div
      className="camera-off-member"
      style={{display: !optionUser.video ? "flex" : "none" }}
      id={peer.peerID + "-video_off"}>
      <div className="member-name-initial">{peer.name.slice(0, 1)}</div>
      <div className="member-name">
        {peer.name}
      </div>
    </div>
  </>


}

const Meet = (props) => {

  const {
    camera,
    mic,
    setMic,
    setCamera,
    stream,
    setStream,
    name,
    email,
    setName,
    setEmail,
    setVideoDevices,
    setAudioDevices } = props;

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
  const history = useHistory()
  const [openChat, setOpenChat] = useState(false);
  const [chats, setChats] = useState([])
  const [transcripts, setTranscripts] = useState([])
  const transcriptsRef = useRef([])
  const [openTranscripts, setOpenTranscripts] = useState(false);
  const [screenSharingEnabled, setScreenSharingEnabled] = useState({ enabled: false, presenter: null })
  const screenSharingEnabledRef = useRef(false);
  const [customBackground, setCustomBackground] = useState(false)


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
    width: "100%",
    // maxWidth: "400px",
    height: "100%",
    // display: camera ? "block" : "none",
    // boxSizing: "border-box",
    // boxShadow: "0px 1px 24px -1px rgba(0, 0, 0, 0.1)",
    borderRadius: "27px",
    objectFit: "cover",
    // margin: "20px"
  }

  useEffect(() => {
    if (name != "Anonymous")
      startStream()
  }, [])

  useEffect(() => {
    var i = 0;
    screenSharesRef.current.forEach((peer) => {
      peer.peer.on("stream", (stream) => {
        userScreenStreams.current.push({ peerID: peer.peerID, stream })
        i++;
        if (i == screenSharesRef.current.length && !screenSharingEnabledRef.current) {
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
  }, [userUpdate])

  useBeforeunload((event) => {
    if (socketRef && socketRef.current) {
      socketRef.current.emit("disconnectMeet")
    }
  });

  const disconnectMeet = () => {
    socketRef.current.emit("disconnectMeet",(name))
    // stopTranscripting()
    setTranscripts([])
    transcriptsRef.current = []
    setTimeout(() => {
      window.location = "/"
    },
      1500);
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
      setChatBadge(true)
      chatsRef.current = [...chatsRef.current, { name: message.name, message: message.message }];
      const chatsUpdated = chatsRef.current;
      setChats(chatsUpdated)
    })
  }


  const screenShare = () => {
    if (!screenSharingEnabled.enabled) {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(screenStreamUpdate => {
        setScreenSharingEnabled({ enabled: true, presenter: socketRef.current.id })
        screenSharingEnabledRef.current = true
        screenStreamComponent.current.srcObject = screenStreamUpdate
        socketRef.current.emit("screen stream update", { updateStream: true, roomID, name })
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
          setScreenSharingEnabled({ enabled: false, presenter: null })
          screenSharingEnabledRef.current = false
          if (screenStreamUpdate.getAudioTracks()[0])
            screenStreamUpdate.getAudioTracks()[0].stop();
          socketRef.current.emit("screen stream update", { updateStream: false, roomID, name })
        };
      })
    }
    else {
      setScreenSharingEnabled({ enabled: false, presenter: null })
      screenSharingEnabledRef.current = false
      if (screenStreamComponent.current.srcObject.getAudioTracks()[0])
        screenStreamComponent.current.srcObject.getAudioTracks()[0].stop();
      screenStreamComponent.current.srcObject.getVideoTracks()[0].stop()

      socketRef.current.emit("screen stream update", { updateStream: false, roomID, name })
    }
  }


  const enableScreenSharingForNewUser = (peer) => {
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


  // const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjYxOTczNjE4MjA4Mjc2NDgiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoiSzlqcGxETnByaXJIZ3I5bGVnVjV6amNmcDRBb1RHRVVAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNjI0OTUyNTgyLCJleHAiOjE2MjUwMzg5ODIsImF6cCI6Iks5anBsRE5wcmlySGdyOWxlZ1Y1empjZnA0QW9UR0VVIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.1duye6C7CdWhzRpJ2u5e7H2UAzJdR5tPU4PkjcnM696E9ha7mNlL6ZFMU_jWMXYzxGmLNADVes-GYHdTIzYwpYzcAcIv6jXZtn61SbyhWx5QRGBw0OwcYQx-tBBwrCHlUpnYutTWit6FbOzfJ_GO72NkbTeM9icvOUoJOxw7RfaPBZAMJZlCfvb7gD4tEfrr7UhvhK6YJRznip3LSAm3I_rc69TUdEyKkTURyzyELl8AoiGlu_ksC7XBRQbl1rKBy264HeIa0Lg9D_A2a-bo5ynv2tdko2yJoPfZrtLOL5jfnArMlYVrz6ZGWCXHbHsd5_WM5TbDQ074H-fPR8pbJA"
  // const uniqueMeetingId = btoa(roomID)
  // const symblEndpoint = `wss://api.symbl.ai/v1/realtime/insights/${uniqueMeetingId}?access_token=${accessToken}`;
  // const ws = new WebSocket(symblEndpoint);

  // const startTranscripting = ({ stream, roomID, socketRef, name }) => {
  //   // Fired when a message is received from the WebSocket server
  //   ws.onmessage = (event) => {
  //     // You can find the conversationId in event.message.data.conversationId;
  //     const data = JSON.parse(event.data);
  //     if (data.type === 'message' && data.message.hasOwnProperty('data')) {
  //       console.log('conversationId', data.message.data.conversationId);
  //     }
  //     if (data.type === 'message_response') {
  //       var messagesConcatenation = "";
  //       for (let message of data.messages) {
  //         console.log('Transcript (more accurate): ', message.payload.content);
  //         messagesConcatenation = messagesConcatenation + message.payload.content;
  //       }
  //       transcriptsRef.current=[...transcriptsRef.current,{ name: 'You', message: messagesConcatenation }]
  //       console.log(transcriptsRef.current)
  //       setTranscripts(transcriptsRef.current)
  //       socketRef.current.emit("transcript data send",{roomID,name: name, message: messagesConcatenation})
  //     }
  //     if (data.type === 'topic_response') {
  //       for (let topic of data.topics) {
  //         // console.log('Topic detected: ', topic.phrases)
  //       }
  //     }
  //     if (data.type === 'insight_response') {
  //       for (let insight of data.insights) {
  //         console.log('Insight detected: ', insight.payload.content);
  //       }
  //     }
  //     if (data.type === 'message' && data.message.hasOwnProperty('punctuated')) {
  //       console.log('Live transcript (less accurate): ', data.message.punctuated.transcript)
  //     }
  //     console.log(`Response type: ${data.type}. Object: `, data);
  //   };

  //   // Fired when the WebSocket closes unexpectedly due to an error or lost connetion
  //   ws.onerror = (err) => {
  //     console.error(err);
  //   };

  //   // Fired when the WebSocket connection has been closed
  //   ws.onclose = (event) => {
  //     console.info('Connection to websocket closed');
  //   };

  //   // Fired when the connection succeeds.
  //   ws.onopen = (event) => {
  //     toast.dark("Transcript is ON")
  //     ws.send(JSON.stringify({
  //       type: 'start_request',
  //       meetingTitle: 'Websockets How-to', // Conversation name
  //       insightTypes: ['question', 'action_item'], // Will enable insight generation
  //       config: {
  //         confidenceThreshold: 0.5,
  //         languageCode: 'en-US',
  //         speechRecognition: {
  //           encoding: 'LINEAR16',
  //           sampleRateHertz: 44100,
  //         }
  //       },
  //       speaker: {
  //         userId: socketRef.current.id,
  //         name: name,
  //       }
  //     }));
  //   };

  //   /**
  //    * The callback function which fires after a user gives the browser permission to use
  //    * the computer's microphone. Starts a recording session which sends the audio stream to
  //    * the WebSocket endpoint for processing.
  //    */
  //   const handleSuccess = (stream) => {
  //     const AudioContext = window.AudioContext;
  //     const context = new AudioContext();
  //     const source = context.createMediaStreamSource(stream);
  //     const processor = context.createScriptProcessor(1024, 1, 1);
  //     const gainNode = context.createGain();
  //     source.connect(gainNode);
  //     gainNode.connect(processor);
  //     processor.connect(context.destination);
  //     processor.onaudioprocess = (e) => {
  //       // convert to 16-bit payload
  //       const inputData = e.inputBuffer.getChannelData(0) || new Float32Array(this.bufferSize);
  //       const targetBuffer = new Int16Array(inputData.length);
  //       for (let index = inputData.length; index > 0; index--) {
  //         targetBuffer[index] = 32767 * Math.min(1, inputData[index]);
  //       }
  //       // Send audio stream to websocket.
  //       if (ws.readyState === WebSocket.OPEN) {
  //         ws.send(targetBuffer.buffer);
  //       }
  //     };
  //   };


  //   handleSuccess(stream);
  // }

  // const stopTranscripting =() =>{
  //   // const interval = setInterval(function() {
  //   //   if (ws.bufferedAmount == 0){
  //       // ws.send(JSON.stringify({
  //       //   type: 'stop_request'
  //       // }));
  //       ws.close()
  //       toast.dark("Transcript stopped !")
  // //       clearInterval(interval)
  // //     }
  // // }, 50); 
  // }

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
      // if(mic)
      // startTranscripting({ stream, name, roomID, socketRef })

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
            name: userID.name,
            new:true,
            destroyed:false
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
          name: payload.name,
          new:true,
            destroyed:false
        });
        const peerUpdate = peersRef.current.filter((p) => p.peerID !== payload.callerID);
        peerUpdate.push({
          peerID: payload.callerID,
          peer,
          options: payload.options,
          name: payload.name,
                      
        })
        toast.dark(`${payload.name} has joined`, {
          position: "top-left",
          hideProgressBar: false
        });
        setPeers(peerUpdate)
      });

      socketRef.current.on("user left", ({id,name}) => {
        console.log("User Left", id);
        
        peersRef.current.filter((p) =>{
          if(p.peerID == id)
          {
          p.destroyed=true;
          p.peer.destroy();
            if(name==undefined)
            toast.dark(`${p.name} has left`, {
              position: "top-left",
              hideProgressBar: false
            });
          }
        });
        if(name!=undefined)
        toast.dark(`${name} has left`, {
          position: "top-left",
          hideProgressBar: false
        });
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
        if (screenSharingEnabledRef.current)
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
        console.log(payload)
        if (payload.updateStream) {
          setScreenSharingEnabled({ enabled: true, presenter: payload.id })
          screenSharingEnabledRef.current = true
          const peer = userScreenStreams.current.find((peer) => peer.peerID == payload.id + "-screen-share");
          screenStreamComponent.current.srcObject = peer.stream;
          toast.dark(`${payload.name} started screen sharing`, {
            position: "top-left",
            hideProgressBar: false
          })
        }
        else {
          setScreenSharingEnabled({ enabled: false, presenter: null })
          screenSharingEnabledRef.current = false
          toast.dark(`${payload.name} stopped screen sharing`, {
            position: "top-left",
            hideProgressBar: false
          })
        }
      })

      socketRef.current.on("receive transcript", (payload) => {
        transcriptsRef.current = [...transcriptsRef.current, { name: payload.name, message: payload.message }]
        setTranscripts(transcriptsRef.current)
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

    // if(!mic) {
    //   toast.dark("Transcript is loading")
    //   startTranscripting({ stream, name, roomID, socketRef})
    // }
    // else
    // {
    //   stopTranscripting()
    // }
  }





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
      {/* Transcript component */}
      <Transcript
        transcripts={transcripts}
        openTranscripts={openTranscripts}
        setOpenTranscripts={setOpenTranscripts}
        transcriptsRef={transcriptsRef} />

      <div className="meet-outer-layout">
        <div className="meet-icons">
          <img src={MicrosoftTeams}
            className="meet-teams-logo"
            onClick={() => {
              window.location = "/"
            }}
          />
          <div className="meet-top-option-box">
            <div className="other-options">
              <Icon icon={overflowMenuHorizontal}
                style={{ color: '#10a19f' }}
              />
              <ul className="dropdown-meet">
                <li>Custom Background
                  <Switch
                    className="background-switcher"
                    uncheckedIcon={false}
                    checkedIcon={false}
                    onChange={(val) => {
                      setCustomBackground(val)
                      if (val)
                        document.
                        getElementsByClassName('meet-outer-layout')[0].
                        style.backgroundImage = `url("https://picsum.photos/1920/1080")`
                      else
                        document.
                        getElementsByClassName('meet-outer-layout')[0].
                        style.backgroundImage = null
                    }} checked={customBackground} />
                </li>
                <li>Record Screen share
                  <Icon icon={record48Regular}
                    style={{
                      color: '#eb4a4a'

                    }}
                  /></li>
              </ul>
            </div>
            <Icon
              icon={transcriptIcon}
              data-tip="Transcript Panel"
              className="chat-opener"
              onClick={() => {
                setOpenTranscripts(!openTranscripts);
              }}
            />
            {!screenSharingEnabled.enabled
              ? <Icon icon={shareScreenStart28Filled}
                onClick={screenShare}
                data-tip="Share Screen"
                className="screen-share"
              /> :
              <Icon icon={shareScreenStop20Filled}
                data-tip={socketRef.current && screenSharingEnabled.presenter == socketRef.current.id
                  ?
                  'Stop Screen Share'
                  : 'Only presenter can stop screen sharing'
                }
                onClick={

                  socketRef.current && screenSharingEnabled.presenter == socketRef.current.id
                    ?
                    screenShare
                    :
                    null
                }
                className={`screen-share ${socketRef.current && screenSharingEnabled.presenter != socketRef.current.id
                  ?
                  'screen-share-disabled'
                  :
                  null}`}
                style={{
                  color: '#ff0000'
                }}
              />
            }
            <div className="chat-opener-wrapper">
              <Icon
                icon={bxsMessageAltDetail}
                className="chat-opener"
                onClick={() => {
                  setOpenChat(!openChat);
                  setChatBadge(false)
                }}
                data-tip="Chats Panel"
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

          <div className="screen-share-box" style={{ display: screenSharingEnabled.enabled ? 'flex' : 'none' }}>
            <video ref={screenStreamComponent}
              muted={socketRef.current && screenSharingEnabled.presenter == socketRef.current.id}
              playsInline id="share-screen-user"
              autoPlay />
          </div>

          <div className="members-with-config" style={{ width: screenSharingEnabled.enabled ? '30%' : '100%' }}>
            <div className="members-row">
              <div className="user-video-box" style={{display:camera?'flex':'none'}}>
              <UserVideo hostRef={hostRef} muted={true} style={style} />
              <div className="member-name">
                    {name}
                  </div>
              </div>
              {camera
                ? null :
                <div className="camera-off-member">
                  <div className="member-name-initial">
                    {name.slice(0, 1)}
                  </div>
                  <div className="member-name">
                    {name}
                  </div>
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
      <ReactTooltip effect="solid" place="bottom" />
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