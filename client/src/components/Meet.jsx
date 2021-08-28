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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Transcript from './Transcript'
import { prodUrl as url } from "../Config/config.json"
import axios from "axios"

//  Create Ref component for each peer joining
const CreateRef = ({ peer, style, options }) => {
  // Ref for each peer
  const clientRef = useRef();
  // check whether peer video and audio setting before rendering them
  var optionUser = peer.options ? peer.options : { video: false, audio: false };
  if (options)
  {
    optionUser = options;
  }
  useEffect(() => {
    // Assign stream to ref on event "stream" triggered
    peer.peer.on("stream", (stream) => {
      console.log(stream.getTracks())
      if (clientRef && clientRef.current)
        clientRef.current.srcObject = stream
      peer.stream = stream
    })

  }, [])

// Return the video or off video element on the basis of stream enabled or not
// Destroyed stream should not be re-rendered
  return peer.destroyed ? null : <>
    <div className="user-video-box" style={{ display: optionUser.video ? "block" : "none" }} id={peer.peerID + "-video_on"}>
      <UserVideo
        hostRef={clientRef}
        muted={false}
        style={style}
      />
      <div className="member-name">
        {peer.name}
      </div>
    </div>
    <div
      className="camera-off-member"
      style={{ display: !optionUser.video ? "flex" : "none" }}
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
    setName,
    socket,
    setSocket,
    userId,
  } = props;


  // Ref for the user's video (not peers)
  const hostRef = useRef()
  // List of peers
  const [peers, setPeers] = useState([]);
  // state of user video, audio option updates
  const [userUpdate, setUserUpdate] = useState();
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
  // to open chat panel
  const [openChat, setOpenChat] = useState(false);
  //set array of chats
  const [chats, setChats] = useState([])
  //set array of transcripts
  const [transcripts, setTranscripts] = useState([])
  const [FrontalTranscript,setFrontalTranscript] = useState('')
  // store transcripts
  const transcriptsRef = useRef([])
  //open transcripts panel
  const [transcriptEnabled,setTranscriptEnabled] = useState(false)
  const [openTranscripts, setOpenTranscripts] = useState(false);
  // set state of screen sharing, enabled and presenter
  const [screenSharingEnabled, setScreenSharingEnabled] = useState({ enabled: false, presenter: null })
  const screenSharingEnabledRef = useRef(false);
  //change wallpaper of meeting
  const [customBackground, setCustomBackground] = useState(false)
  // recordchunks which will be processed later on
  const [recordedChunks, setRecordedChunks] = useState({ enabled: false, chunks: [] })
  //store ref to media recording
  const mediaRecorder = useRef(null)


  //id of meeting present in url
  const roomID = props.match.params.teamId;


  // user video styling
  const style = {
    width: "100%",
    height: "100%",
    borderRadius: "27px",
    objectFit: "cover",
  }
// start streaming when join room
  useEffect(() => {
      startStream()
  }, [])


 //run when ever a new person joins and share screen if enabled for new user 
  useEffect(() => {
    var i = 0;
    screenSharesRef.current.forEach((peer) => {
      peer.peer.on("stream", (stream) => {
        userScreenStreams.current.push({ peerID: peer.peerID, stream })
        i++;
        if (i === screenSharesRef.current.length && !screenSharingEnabledRef.current) {
          socketRef.current.emit("screen streaming running for new user", { roomID })
        }
      })
    })

  }, [screenShares, screenSharesRef])


  // any kind of update from peers should be reflected by changing the video or audio over other peers
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


  // stop services before leaving the meeting if refreshing or closing tab by the user
  window.onbeforeunload = function () {
    stopMediaRecorder()
    socketRef.current.emit("disconnectMeet", { name, roomID, userId: userId })
    stopTranscripting()
    // For delay if recording is going on and user refreshes or closes tab, which will lead to saving of file
    // SetTimeout doesn't work in onBeforeUnload
    if (mediaRecorder.current)
      for (var i = 0; i < 1000; i++) {
        ;
      }
  }

  // disonnect when user leaves by explicitly clicking on leave button
  const disconnectMeet = () => {
    stopMediaRecorder()
    socketRef.current.emit("disconnectMeet", { name, roomID, userId })
    stopTranscripting()
    setTranscripts([])
    transcriptsRef.current = []
    setTimeout(() => {
      window.location = "/"
    },
      1500);
  }


  // startStream and set socket for user
  const startStream = () => {
    if (socket) {
      socketRef.current = socket
      createStream();
      startChat()
    }
    else {
      var socketNew = io.connect(`${url}`)
      socketNew.on('connect', () => {
        axios({
          url: `${url}/updateSocket`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('TeamsToken')}`
          },
          data: {
            "socketId": socketNew.id
          }
        }).then(data => {
          ;
        })
        socketRef.current = socketNew;
        setSocket(socketNew)
        createStream();
        startChat()
      })
    }

  }

  // socket to receive message enabled
  const startChat = () => {
    socketRef.current.on("receivedMessage", (message) => {
      setChatBadge(true)
      chatsRef.current = [...chatsRef.current, { name: message.name, message: message.message }];
      const chatsUpdated = chatsRef.current;
      setChats(chatsUpdated)
    })
  }

// screen sharing enabling and notifying each peer that screen shareing has started, also updating stream for each peer
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

          stopMediaRecorder()
          setScreenSharingEnabled({ enabled: false, presenter: null })
          screenSharingEnabledRef.current = false
          if (screenStreamUpdate.getAudioTracks()[0])
            screenStreamUpdate.getAudioTracks()[0].stop();
          socketRef.current.emit("screen stream update", { updateStream: false, roomID, name })

        };
      }).catch(err => {
        toast.error(`Your device doesn't support screen share`, {
          position: "top-left",
          hideProgressBar: true,
          autoClose: 1500,

        });
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

// send message to each peer via sockets
  const sendMessage = (sendMessage) => {
    const payload = { name, message: sendMessage, senderId: socketRef.current.id, userId, roomID };
    socketRef.current.emit("send message", payload);
    chatsRef.current = [...chatsRef.current, { name: "You", message: payload.message }]
    const chatsUpdated = chatsRef.current;
    setChats(chatsUpdated)

  }


// variables for transcript in each room
  var accessToken = null;
  var uniqueMeetingId;
  var symblEndpoint;
  const ws = useRef()

// loading of transcript and get access token from server
  const startLoadingTranscript = (transcriptStream) => {
    {

      setTranscriptEnabled(true)
      axios(
        {
          url: `${url}/transcriptToken`,
          method: 'GET'
        }).then(data => {
          toast.dark("Transcript is loading",{
            hideProgressBar:true,
            autoClose:1500,
            position:'top-left'
          })
          accessToken = data.data.accessToken
          uniqueMeetingId = btoa(roomID)
          symblEndpoint = `wss://api.symbl.ai/v1/realtime/insights/${uniqueMeetingId}?access_token=${accessToken}`;
          ws.current=new WebSocket(symblEndpoint)
            startTranscripting({ stream: transcriptStream, roomID, socketRef, name })
          

        })
    }
  }

//start transcripting
  const startTranscripting = ({ stream, roomID, socketRef, name }) => {
    // Fired when a message is received from the WebSocket server
    ws.current.onmessage = (event) => {
      // You can find the conversationId in event.message.data.conversationId;
      const data = JSON.parse(event.data);
      if (data.type === 'message' && data.message.hasOwnProperty('data')) {
        console.log('conversationId', data.message.data.conversationId);
      }
      if (data.type === 'message_response') {
        var messagesConcatenation = "";
        for (let message of data.messages) {
          // console.log('Transcript (more accurate): ', message.payload.content);
          messagesConcatenation = messagesConcatenation + message.payload.content;

          transcriptsRef.current = [...transcriptsRef.current, { name: message.from.userId == userId ? 'You' : message.from.name, message: message.payload.content }]
          setTranscripts(transcriptsRef.current)
        }
        setFrontalTranscript('')
      }
      if (data.type === 'topic_response') {
        for (let topic of data.topics) {
          // console.log('Topic detected: ', topic.phrases)
        }
      }
      if (data.type === 'insight_response') {
        for (let insight of data.insights) {
          // console.log('Insight detected: ', insight.payload.content);
        }
      }
      if (data.type === 'message' && data.message.hasOwnProperty('punctuated')) {
        // console.log('Live transcript (less accurate): ', data)
        setFrontalTranscript( (data.message.user.userId == userId?'You':data.message.user.name) +": " + data.message.punctuated.transcript)
      }
      console.log(`Response type: ${data.type}. Object: `, data);
    };

    // Fired when the WebSocket closes unexpectedly due to an error or lost connetion
    ws.current.onerror = (err) => {
      toast.error("Facing issue with transcript")
      console.error(err);
    };

    // Fired when the WebSocket connection has been closed
    ws.current.onclose = (event) => {
      console.info('Connection to websocket closed');
    };

    // Fired when the connection succeeds.
    ws.current.onopen = (event) => {
      toast.dark("Transcript is ON", {
        hideProgressBar: true,
        position: 'top-left',
        autoClose: 1500
      })
      ws.current.send(JSON.stringify({
        type: 'start_request',
        meetingTitle: 'Websockets How-to', // Conversation name
        insightTypes: ['question', 'action_item'], // Will enable insight generation
        config: {
          confidenceThreshold: 0.5,
          languageCode: 'en-US',
          speechRecognition: {
            encoding: 'LINEAR16',
            sampleRateHertz: 44100,
          }
        },
        speaker: {
          userId: userId,
          name: name,
        }
      }));
    };

    /**
     * The callback function which fires after a user gives the browser permission to use
     * the computer's microphone. Starts a recording session which sends the audio stream to
     * the WebSocket endpoint for processing.
     */
    const handleSuccess = (stream) => {
      const AudioContext = window.AudioContext;
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(1024, 1, 1);
      const gainNode = context.createGain();
      source.connect(gainNode);
      gainNode.connect(processor);
      processor.connect(context.destination);
      processor.onaudioprocess = (e) => {
        // convert to 16-bit payload
        const inputData = e.inputBuffer.getChannelData(0) || new Float32Array(this.bufferSize);
        const targetBuffer = new Int16Array(inputData.length);
        for (let index = inputData.length; index > 0; index--) {
          targetBuffer[index] = 32767 * Math.min(1, inputData[index]);
        }
        // Send audio stream to websocket.
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(targetBuffer.buffer);
        }
      };
    };


    handleSuccess(stream);
  }

  const stopTranscripting = () => {
    if(ws.current)
    {
      setFrontalTranscript('')
    ws.current.send(JSON.stringify({
      "type": "stop_request"
    }));
    setTranscriptEnabled(false)
      toast.dark("Transcript stopped !", {
        hideProgressBar: true,
        position: 'top-left',
        autoClose: 1500
      })
    }
  }


  //create stream os user and add already present users
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
      // join room
      socketRef.current.emit("join room", { roomID, options, name, userId: userId });
      // if transcript is enabled or disabled
      socketRef.current.on("transcript updated",payload=>{
        if(payload.enabled)
        {
          toast.dark(`Transcript enabled by ${payload.name}`,{
          position:'top-left',
          hideProgressBar:true
          })
          startLoadingTranscript(hostRef.current.srcObject)
        }
        else{
          toast.dark(`Transcript disabled by ${payload.name}`,{
            position:'top-left',
            hideProgressBar:true
            })
          stopTranscripting()
        }
      })
      // receive already present users
      socketRef.current.on("all users", (users) => {
      // add peers 
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID.id, socketRef.current.id, stream, options, name);
          peersRef.current.push({
            peerID: userID.id,
            peer,
            options: userID.options,
            name: userID.name,
            new: true,
            destroyed: false
          });
          peers.push({
            peerID: userID.id,
            peer,
            options: userID.options,
            name: userID.name
          });
          toast.dark(`${userID.name} is already present`, {
            position: "top-left",
            hideProgressBar: true,
            autoClose: 1500
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
      // add peer when a user joins
      socketRef.current.on("user joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, stream, payload.options, payload.name);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
          options: payload.options,
          name: payload.name,
          new: true,
          destroyed: false
        });
        const peerUpdate = peersRef.current.filter((p) => p.peerID !== payload.callerID);
        peerUpdate.push({
          peerID: payload.callerID,
          peer,
          options: payload.options,
          name: payload.name,

        })

        setPeers(peerUpdate)
        toast.dark(`${payload.name} has joined`, {
          position: "top-left",
          hideProgressBar: true,
          autoClose: 1500
        });
      });
      // destroy peer when user leaves
      socketRef.current.on("user left", ({ id, name }) => {
        peersRef.current.filter((p) => {
          if (p.peerID === id) {
            p.destroyed = true;
            p.peer.destroy();
            if (name === undefined)
              toast.dark(`${p.name} has left`, {
                position: "top-left",
                hideProgressBar: true,
                autoClose: 1500
              });
          }
        });
        if (name !== undefined)
          toast.dark(`${name} has left`, {
            position: "top-left",
            hideProgressBar: true,
            autoClose: 1500
          });
      });

      socketRef.current.on("receiving returned signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });
      // any kind of update by peer should be reflected for others
      socketRef.current.on("change", (payload) => {
        setUserUpdate({ id: payload.id, video: payload.video, audio: payload.audio });
      });

      // add screen streams of users
      socketRef.current.on("user added screen stream", (payload) => {

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

      // destroy screen stream if a user left
      socketRef.current.on("user left screen stream", (id) => {

        const index = screenSharesRef.current.findIndex((p) => p.peerID === id);

        if (index !== -1) {
          if (screenSharesRef.current[index]) {
            screenSharesRef.current[index].peer.destroy();
          }
        }
        const peers = screenSharesRef.current.filter((p) => p.peerID !== id);
        screenSharesRef.current = peers;

        setScreenShares(peers);
      });

      socketRef.current.on("receiving returned screen stream", (payload) => {
        const item = screenSharesRef.current.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });

      socketRef.current.on("screen share update", payload => {
        if (payload.updateStream) {
          setScreenSharingEnabled({ enabled: true, presenter: payload.id })
          screenSharingEnabledRef.current = true
          const peer = userScreenStreams.current.find((peer) => peer.peerID === payload.id + "-screen-share");
          screenStreamComponent.current.srcObject = peer.stream;
          toast.dark(`${payload.name} started screen sharing`, {
            position: "top-left",
            hideProgressBar: true,
            autoClose: 1500
          })
        }
        else {
          setScreenSharingEnabled({ enabled: false, presenter: null })
          screenSharingEnabledRef.current = false
          toast.dark(`${payload.name} stopped screen sharing`, {
            position: "top-left",
            hideProgressBar: false,
            autoClose: 1500
          })
        }
      })

      

    }).catch(err => {
      toast.error('Devices not working properly', {
        position: 'top-left',
        hideProgressBar: true,
        autoClose: 1500
      })
      console.error(err)
    })
  }


// create peer for present users
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

  // add  peer for new users joining
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

  // create peer for present users  for screen sharing
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
  // add  peer for new users joining for screen sharing
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

// toggle state when video or audio are updated
  const ToggleState = (kind, state, setState) => {
    if (hostRef.current.srcObject && hostRef.current && hostRef) {
      hostRef.current.srcObject.getTracks().forEach(function (track) {

        if (track.kind === kind) {

          socketRef.current.emit("change", {
            id: socketRef.current.id,
            video: kind === "video" ? !camera : camera,
            audio: kind === "audio" ? !mic : mic,
            roomID
          });
          track.enabled = kind === "audio" ? !mic : !camera;
        }
        Toggler(state, setState)
      })
    }

  }

  // Media Recording start
  const startMediaRecorder = () => {

    var videos = document.getElementsByTagName('video')
    // connecting screenshare audio with users audio
    const audioContext = new AudioContext();
    var audios = [];
    var dest = audioContext.createMediaStreamDestination();
    for (let video in Array.from(videos)) {
      if (videos[video].id !== 'user-own-video') {
        if (videos[video].srcObject.getAudioTracks().length != 0)
          audioContext.createMediaStreamSource(videos[video].srcObject).connect(dest)
      }
      else {
        if (hostRef.current.srcObject.getAudioTracks().length != 0)
          audioContext.createMediaStreamSource(hostRef.current.srcObject).connect(dest)
      }
    }

    var newScreenRecorderStream = new MediaStream([
      dest.stream.getAudioTracks()[0], 
    screenStreamComponent.current.srcObject.getVideoTracks()[0]])

    setRecordedChunks({ enabled: true, chunks: [...recordedChunks.chunks] })
    toast.info("Screen Recording Started", {
      position: 'top-left',
      hideProgressBar: true,
      autoClose: 1500
    })

    // add opus in mimeType so that firefox also supports
    var options = { mimeType: 'video/webm;codecs=vp8,opus' };
    mediaRecorder.current = new MediaRecorder(newScreenRecorderStream, options);

    mediaRecorder.current.ondataavailable = handleDataAvailable;
    mediaRecorder.current.start();

    function handleDataAvailable(event) {

      if (event.data.size > 0) {
        recordedChunks.chunks.push(event.data);
        setRecordedChunks({ enabled: recordedChunks.enabled, chunks: [...recordedChunks.chunks] })
        download();
      }
    }
  }
  const download = () => {

    var blob = new Blob(recordedChunks.chunks, {
      type: "video/webm"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = `Recording-${new Date()}.webm`;
    a.click();
    window.URL.revokeObjectURL(url);
    setRecordedChunks({ enabled: false, chunks: [] })
    toast.info("Screen Recording Stopped", {
      position: 'top-left',
      hideProgressBar: true,
      autoClose: 1500
    })
    mediaRecorder.current = null
  }
  const stopMediaRecorder = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop()
    }
  }


  return (
    <div className="meet-parent">

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
          />
          <div className="meet-top-option-box">
            <div className="other-options">
              <Icon icon={overflowMenuHorizontal}
                style={{ color: '#10a19f' }}
              />
              <ul className="dropdown-meet">
                <li>Change Wallpaper
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
                <li onClick={() => {
                  if (screenSharingEnabled.enabled && screenSharingEnabled.presenter !== socketRef.current.id)
                    return toast.dark("Only presenter can record screen", {
                      position: 'top-left',
                      hideProgressBar: true,
                      autoClose: 1500
                    })
                  if (screenSharingEnabled.enabled && recordedChunks.enabled) {
                    stopMediaRecorder()
                  }
                  else if (screenSharingEnabled.enabled && !recordedChunks.enabled) {
                    startMediaRecorder()
                  }
                  else {
                    toast.dark("Start Screen Sharing before Recording", {
                      position: 'top-left',
                      hideProgressBar: true,
                      autoClose: 1500
                    })
                  }
                }}>
                  {screenSharingEnabled.enabled && recordedChunks.enabled ? 'Stop Screen Recording' : 'Start Screen Recording'}
                  <Icon icon={record48Regular}
                    style={{
                      color: '#eb4a4a'

                    }}
                  /></li>
                  <li
                  >
                    <span>{transcriptEnabled?'Disable':'Enable'}<br/> Transcript</span>
                    <Switch
                    className="background-switcher"
                    uncheckedIcon={false}
                    checkedIcon={false}
                    onChange={()=>{
                      if(!transcriptEnabled)
                      {
                        
                      socketRef.current.emit("transcript enabled",{userId,name,roomID,enabled:true})
                      startLoadingTranscript(hostRef.current.srcObject)
                      }
                      else
                      {
                        socketRef.current.emit("transcript enabled",{userId,name,roomID,enabled:false})
                        stopTranscripting()                      
                      }
                    }} checked={transcriptEnabled} />
                  </li>
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
                data-tip={socketRef.current && screenSharingEnabled.presenter === socketRef.current.id
                  ?
                  'Stop Screen Share'
                  : 'Only presenter can stop screen sharing'
                }
                onClick={

                  socketRef.current && screenSharingEnabled.presenter === socketRef.current.id
                    ?
                    screenShare
                    :
                    null
                }
                className={`screen-share ${socketRef.current && screenSharingEnabled.presenter !== socketRef.current.id
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
              muted={socketRef.current && screenSharingEnabled.presenter === socketRef.current.id}
              playsInline id="share-screen-user"
              autoPlay />
          </div>

          <div className="members-with-config" style={{ width: screenSharingEnabled.enabled ? '30%' : '100%' }}>
            <div className="members-row">
              <div className="user-video-box" style={{ display: camera ? 'flex' : 'none' }}>
                <UserVideo hostRef={hostRef} id="user-own-video" muted={true} style={style} />
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
            {FrontalTranscript?<div className="Transcript-down-position">
              {FrontalTranscript}
            </div>:null}
            <div className="meet-options">
              {
                mic
                  ?
                  <Icon
                    icon={micIcon}
                    className="meet-controllers"
                    data-tip="close mic"
                    onClick={() => {

                      ToggleState("audio", mic, setMic)

                    }} />
                  :
                  <Icon
                    icon={micMute}
                    className="meet-controllers"
                    data-tip="open mic"
                    onClick={() => {

                      ToggleState("audio", mic, setMic)

                    }} />
              }
              <div className="disconnect-meet">
                <Icon
                  className="meet-controllers"
                  icon={phoneOff}
                  onClick={disconnectMeet}
                />
              </div>
              {
                camera
                  ?
                  <Icon
                    icon={cameraVideo}
                    className="meet-controllers"
                    data-tip="close camera"
                    onClick={() => {
                      ToggleState("video", camera, setCamera)

                    }} />
                  :
                  <Icon
                    icon={cameraVideoOff}
                    className="meet-controllers"
                    data-tip="open camera"
                    onClick={() => {
                      ToggleState("video", camera, setCamera)

                    }} />
              }
            </div>
          </div>


        </div>
      </div>
      <Chats chats={chats} sendMessage={sendMessage} openChat={openChat} setOpenChat={setOpenChat} />
      <ToastContainer 
      pauseOnFocusLoss={false}
      />
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
    audioDevices: state.userDetails.audioDevices,
    socket: state.userDetails.socket,
    userId: state.userDetails.userId
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setUserId: data => {
      dispatch({
        type: 'SET_USER_ID',
        userId: data,
      })
    },
    setEmail: data => {
      dispatch({
        type: 'SET_EMAIL',
        email: data,
      })
    },
    setSocket: data => {
      dispatch({
        type: 'SET_SOCKET',
        socket: data,
      })
    }
    ,
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