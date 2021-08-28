import React, { useEffect, useRef, useState } from "react";
import { useHistory, Link } from "react-router-dom"
import UserVideo from "./userWindow"
import "../styles/home.css"
import { Icon } from '@iconify/react';
import micMute from '@iconify/icons-bi/mic-mute';
import micIcon from '@iconify/icons-bi/mic';
import cameraVideo from '@iconify/icons-bi/camera-video';
import cameraVideoOff from '@iconify/icons-bi/camera-video-off';
import cameraVideoOffFill from '@iconify/icons-bi/camera-video-off-fill';
import documentCopy20Filled from '@iconify/icons-fluent/document-copy-20-filled';
import Mountains_background from "../assets/mountains-home.png";
import MicrosoftTeams from "../assets/microsoft-teams.svg";
import Avatar from "../assets/avatar.png";
import Group_Connect from "../assets/home-right-vector.png";
import { Toggler, MediaInit } from "../utils/utilityFunctions"
import { connect } from 'react-redux';
import { v1 as uuid } from "uuid";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Loader from "react-loader-spinner";

const Home = (props) => {
  const {
    mic,
    setMic,
    camera,
    setCamera,
    setStream,
    stream,
    setAudioDevices,
    setVideoDevices
  } = props;
  const history = useHistory();
  const hostRef = useRef();
  const link = useRef(uuid());
  const home_video_style = {
    width: "100%",
    borderRadius: "27px 27px 0 0",
    height: "100%",
    objectFit: "contain",
    display: camera ? "block" : "none"
  }
  const [modalIsOpen, setmodalIsOpen] = useState(false)
  const [stable, setStable] = useState(false)
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
  useEffect(() => {
    MediaInit({ camera, mic, hostRef, setStream, setAudioDevices, setVideoDevices }).then((stream) => {
      setStream(stream)
      toast.info('Devices are working properly')
      setStable(true)
    })
      .catch(err => {
        toast.error('Devices are not working properly')
      })
  }, [])
  useEffect(() => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = camera
      stream.getAudioTracks()[0].enabled = mic
    }

  }, [mic, camera])

  const ToggleState = (state, setState) => {
    Toggler(state, setState);
  }

  return (
    <div className="container">
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => {
          setmodalIsOpen(false)
        }}
        style={customStylesModal}
        id="modal-home"
        contentLabel="Name Modal"
      >
        <h3>Get your link</h3>
        <div className="modal-content-home">
          <Link to={`/teams/${roomID}`} style={{color:'white'}}>{window.location.href.split('/')[0]+"//"+window.location.href.split('/')[2]+"/teams/"+roomID}</Link>
          <CopyToClipboard text={window.location.href.split('/')[0]+"//"+window.location.href.split('/')[2]+"/teams/"+roomID}
          onCopy={()=>{
            toast.dark('Link copied!')
          }}>
          <Icon icon={documentCopy20Filled} 
          id="copy-to-clipboard-icon" />
          </CopyToClipboard>
        </div>
      </Modal>
      <div className="home-side-left">
        <img src={MicrosoftTeams} className="logo-home" alt="Microsoft Teams" />
        <div className="video-box">

          <div className="video">
            <UserVideo hostRef={hostRef} style={home_video_style} muted={true} />
          </div>

          {!camera
            ?
            <div className="video-off-box">
              <Icon icon={cameraVideoOffFill}
                className="video-off"
              />
              <h3>Camera is Off</h3>
            </div>
            :
            null}
          <div className="footer-options-video">
            {
              mic
                ?
                <Icon icon={micIcon}
                  className="video-set-buttons"
                  onClick={() => { ToggleState(mic, setMic) }}
                />
                :
                <Icon icon={micMute}
                  className="video-set-buttons"
                  onClick={() => { ToggleState(mic, setMic) }}
                />
            }
            {
              camera
                ?
                <Icon icon={cameraVideo}
                  className="video-set-buttons"
                  onClick={() => { ToggleState(camera, setCamera) }}
                />
                :
                <Icon icon={cameraVideoOff}
                  className="video-set-buttons"
                  onClick={() => { ToggleState(camera, setCamera) }}
                />
            }
          </div>
        </div>
        <img src={Mountains_background} className="mountainBackground" alt="Mountains" />
      </div>
      <div className="home-side-right">
        <div className="entry-box">
          <img src={Avatar} className="avatar-home" alt="Avatar" />
          <h1>Join your meeting !</h1>
          {!stable?<><Loader
          type="BallTriangle"
          color="#00BFFF"
          height={30}
          width={30} />
          <h6>Devices are loading ! Please wait</h6></>:null}
          <div className="home-entry-options">
            <button
              className={`home-entry-buttons ${!stable?"home-entry-buttons-disabled":''}`}
              onClick={() => {
                history.push(`/teams/${roomID}`)
              }}
              disabled={!stable}
            >Join Now</button>
            <button
              className="home-entry-buttons"
              onClick={() => {
                setmodalIsOpen(true)
              }}
            >
              Share Link
            </button>
          </div>
        </div>
        <img src={Group_Connect} className="home-bottom-vector" />
      </div>
      <ToastContainer />
    </div>)
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



export default connect(mapStateToProps, mapDispatchToProps)(Home)