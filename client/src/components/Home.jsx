import React, { useEffect, useRef, useState } from "react";
import UserVideo from "./userWindow"
import "../styles/home.css"
import { Icon, InlineIcon } from '@iconify/react';
import micIcon from '@iconify/icons-bi/mic';
import cameraVideo from '@iconify/icons-bi/camera-video';
import cameraVideoOff from '@iconify/icons-bi/camera-video-off';
import micMute from '@iconify/icons-bi/mic-mute';
import Mountains_background from "../assets/mountains-home.png";


const Home = () => {
    const hostRef = useRef();
    const [mic, setMic] = useState(true); //Set Mic according to user demands
    const [camera, setCamera] = useState(true); //Set Camera according to user demands
    const home_video_style = {
        width: "100%",
        borderRadius: "27px 27px 0 0"
    }
    useEffect(() => {
        (camera || mic) && navigator.mediaDevices.getUserMedia({
            audio: mic,
            video: camera
        }).then(stream => {
            hostRef.current.srcObject = stream
        })
        if (!camera && !mic)
            hostRef.current.srcObject = null
    }, [mic, camera])
    return (
        <div className="container">
            <div className="home-side-left">
                <div className="video-box">
                    <UserVideo hostRef={hostRef} style={home_video_style} />
                    <div className="footer-options">
                        {
                            mic
                                ?
                                <Icon icon={micIcon} style={{
                                    color: '#fff',
                                    filter: "drop-shadow(0px 4px 5px #000000)",
                                    fontSize: "25px"
                                }}
                                />
                                :
                                <Icon icon={micIcon} style={{
                                    color: '#fff',
                                    filter: "drop-shadow(0px 4px 5px #000000)",
                                    fontSize: "25px"
                                }}
                                />
                        }
                        <Icon icon={cameraVideo} style={{
                            color: '#fff',
                            filter: "drop-shadow(0px 4px 5px #000000)",
                            fontSize: "25px"
                        }}
                        />
                    </div>
                </div>
                <img src={Mountains_background} className="mountainBackground" />
            </div>
            <div className="home-side-right">
                <h2>Hol'a Amigo</h2>
            </div>
        </div>)
}

export default Home