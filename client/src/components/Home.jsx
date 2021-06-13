import React, { useEffect, useRef, useState } from "react";
import UserVideo from "./userWindow"
import "../styles/home.css"
import { Icon } from '@iconify/react';
import micIcon from '@iconify/icons-bi/mic';
import cameraVideo from '@iconify/icons-bi/camera-video';
import cameraVideoOff from '@iconify/icons-bi/camera-video-off';
import cameraVideoOffFill from '@iconify/icons-bi/camera-video-off-fill';
import micMute from '@iconify/icons-bi/mic-mute';
import Mountains_background from "../assets/mountains-home.png";
import MicrosoftTeams from "../assets/microsoft-teams.svg";
import Avatar from "../assets/avatar.png";
import Group_Connect from "../assets/home-right-vector.png";
import { Toggler, MediaInit } from "../utils/utilityFunctions"

const Home = ({mic,setMic,camera,setCamera,hostRef}) => {

    const home_video_style = {
        width: "100%",
        borderRadius: "27px 27px 0 0",
        height: "100%",
        objectFit: "cover",
        display: camera ? "block" : "none"
    }
    useEffect(() => {
        MediaInit(camera, mic, hostRef)
    }, [mic, camera])

    const ToggleState = (state, setState) => {
        Toggler(state, setState);
    }

    return (
        <div className="container">
            <div className="home-side-left">
                <img src={MicrosoftTeams} className="logo-home" alt="Microsoft Teams" />
                <div className="video-box">

                    <div className="video">
                        <UserVideo hostRef={hostRef} style={home_video_style} />
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
                    <input type="email" placeholder="Enter Email ID" className="email-input" />
                    <input type="text" placeholder="Enter Name" className="name-input" />
                    <div className="home-entry-options">
                    <button className="home-entry-buttons">Join Now</button>
                    <button className="home-entry-buttons">Generate Link</button>
                    </div>
                </div>
                <img src={Group_Connect} className="home-bottom-vector" />
            </div>
        </div>)
}

export default Home