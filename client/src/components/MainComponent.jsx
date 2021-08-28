import React, { useEffect, useRef, useState } from "react";
import { ProSidebar, SidebarHeader, SidebarFooter, SidebarContent } from 'react-pro-sidebar';
import { useHistory } from 'react-router-dom'
import "../styles/main-component.css"
import MicrosoftTeams from "../assets/microsoft-teams.svg";
import { connect } from 'react-redux';
import axios from 'axios';
import { v1 as uuid } from "uuid";
import { io } from "socket.io-client"
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import Switch from "react-switch";
import sendFilled from '@iconify/icons-carbon/send-filled';
import menuIcon from '@iconify/icons-carbon/menu';
import desktopArrowRight24Regular from '@iconify/icons-fluent/desktop-arrow-right-24-regular';
import bxLogOut from '@iconify/icons-bx/bx-log-out';
import ReactTooltip from 'react-tooltip';
import Loader from "react-loader-spinner";
import joinOuter from '@iconify/icons-carbon/join-outer';
import { prodUrl as url } from "../Config/config.json"
import bxsAddToQueue from '@iconify/icons-bx/bxs-add-to-queue';

const MainComponent = (props) => {
    const {
        socket,
        setSocket,
        name,
        setName,
        userId,
        setUserId,
        setAuth,
        joiningRoom,
        setJoiningRoom,
        joiningPath,
        setJoiningPath
    } = props
    // set joined rooms
    const [rooms, setRooms] = useState([])
    // set selected room
    const [room, setRoom] = useState(undefined)
    // store data of selected room
    const roomRef = useRef(undefined)
    // store data of all rooms
    const roomsRef = useRef([])
    // set chats for selected room
    const [chats, setChats] = useState([])
    // selected room's ID
    const [roomID, setRoomId] = useState('')
    // message for chat
    const [message, setMessage] = useState('')
    const [modalIsOpen, setmodalIsOpen] = useState(false)
    const [modalCreateRoomIsOpen, setmodalCreateRoomIsOpen] = useState(false)
    const [roomName, setRoomName] = useState('')
    const [roomSideBar, setRoomSideBar] = useState(window.screen.width > 660)
    // ref to scroll down whenever a message arrive
    const messagesEndRef = useRef(null)
    const history = useHistory()
    const [customBackground, setCustomBackground] = useState(false)
    const [loader, setLoader] = useState(false)

    const customStylesModal = {
        overlay: {
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 2
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

    // if socket does not exist then create one and update in database
    useEffect(() => {
        if (joiningRoom && socket != null) {
            joinRoom(joiningRoom)

        }
        if (!socket) {
            var socketNew = io.connect(`${url}`)

            socketNew.on("connect", () => {
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
                setSocket(socketNew)

            })

        }

        // get chats for all room joined
        axios({
            url: `${url}/getChats`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('TeamsToken')}`
            }
        }).then(data => {
            setName(data.data.user.name)
            setUserId(data.data.user._id)
            roomsRef.current = roomsRef.current.concat(data.data.rooms)
            setRooms(roomsRef.current)

        })
    }, [])


    useEffect(() => {
        if (socket) {
            // redirect if url says so
            if (joiningRoom) {
                joinRoom(joiningRoom)

            }
            // on receiving message
            socket.on("receivedMessage", (payload) => {

                const { name, message, userId, roomID } = payload

                if (roomRef.current && roomRef.current.roomID == roomID) {
                    var roomUpdate = roomRef.current
                    roomUpdate.chats = [...roomUpdate.chats, { name, message, userId: userId }]
                    roomRef.current = roomUpdate
                    setChats(roomUpdate.chats)
                    setRoom(roomRef.current)
                }
                for (var i = 0; i < roomsRef.current.length; i++) {
                    if (roomsRef.current[i].roomID == roomID) {
                        roomsRef.current[i].chats = [...roomsRef.current[i].chats, { name, message, userId: userId }]
                    }
                }
                // roomsRef.current = roomsUpdate
                setRooms(roomsRef.current)
                scrollToBottom()
            })
        }
    }, [socket])

    //create room
    const createRoom = () => {
        setLoader(true)
        axios({
            url: `${url}/createRoom`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('TeamsToken')}`
            },
            data: {
                roomID: uuid(),
                socketId: socket.id,
                roomName: roomName || undefined
            }
        }).then(data => {
            setLoader(false)
            const roomsUpdate = [...roomsRef.current, data.data]
            roomsRef.current = roomsUpdate
            setRooms(roomsRef.current)
            toast.info(`Created Room ${data.data.roomName}`, {
                position: 'top-left'
            })
            setmodalCreateRoomIsOpen(false)
        })
    }

    // join room , also if redirecting then do it
    const joinRoom = (RoomJoiningID) => {

        if (!RoomJoiningID)
            return toast.error("Room ID can't be empty!")
        var roomIdFormat = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/;
        if (!roomIdFormat.test(RoomJoiningID))
            return toast.error("Incorrect roomID");
        setLoader(true)
        axios({
            url: `${url}/joinRoom`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('TeamsToken')}`
            },
            data: {
                roomID: RoomJoiningID,
                socketId: socket.id
            }
        }).then(data => {
            setLoader(false)
            const roomsUpdate = [...roomsRef.current, data.data]
            roomsRef.current = roomsUpdate
            setRooms(roomsRef.current)
            setmodalIsOpen(false)
            toast.info(`Joined Room "${data.data.roomName}"`, {
                position: 'top-left'
            })
            if (joiningRoom) {
                setJoiningRoom(null)
                if (joiningPath) {
                    // redirect
                    var jp = joiningPath
                    setJoiningPath(null,()=>{
                        history.push(`${jp}/${RoomJoiningID}`)
                    })

                    
                }
            }

        }).catch(err => {
            setLoader(false)
            toast.error(err.response.data.error)
            // redirect if room exists
            if (joiningRoom && err.response.data.error != "Room doesn't exist!") {
                setJoiningRoom(null)
                if (joiningPath) {
                    var jp = joiningPath
                    setJoiningPath(null,()=>{
                        history.push(`${jp}/${RoomJoiningID}`)
                    })

                }
            }
        })
    }

    const selectRoom = (e) => {
        // select room
        var roomID = e.target.dataset.roomid;
        var room = rooms.filter(room => room.roomID == roomID)
        setChats(room[0].chats)
        setRoom(room[0])
        roomRef.current = room[0];
        if (messagesEndRef.current)
            scrollToBottom()
        if (window.screen.width <= 660)
            setRoomSideBar(false)
    }
    const sendMessage = (sendMessage) => {
        // send message to others
        const payload = { name, message: sendMessage, userId: userId, roomID: room.roomID };
        socket.emit("send message", payload);
        const roomUpdate = roomRef.current;
        const chatUpdate = chats;
        chatUpdate.push({ name, message, userId: userId })
        roomUpdate.chats = chatUpdate
        for (var i = 0; i < roomsRef.current.length; i++)
            if (roomsRef.current[i].roomID == room.roomID) {
                roomsRef.current[i].chats = chatUpdate;
            }

        roomRef.current = roomUpdate
        setChats(chatUpdate)
        setRoom(roomRef.current)
        setRooms(roomsRef.current)
        scrollToBottom()
    }
    //Automatic scroll to bottom
    useEffect(() => {
        scrollToBottom()
    })
    const scrollToBottom = () => {
        if (messagesEndRef.current)
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="main-component-parent">
            {/* Modal to join room  */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => {
                    setmodalIsOpen(false)
                }}
                style={customStylesModal}
                id="modal-main-component"
                contentLabel="Name Modal"
            >
                <h3>Join Room</h3>
                <div className="modal-content-home">
                    <input
                        type="text"
                        className="modal-input-main-component"
                        placeholder="Enter room ID"
                        value={roomID}
                        onChange={(e) => {
                            setRoomId(e.target.value)
                        }}
                    />
                </div>
                {loader && <Loader
                    type="BallTriangle"
                    color="#00BFFF"
                    height={30}
                    width={30} />}
                <button className="join-room-main-chat"
                    onClick={() => {
                        joinRoom(roomID)
                    }}>
                    Join room
                </button>
            </Modal>
            {/* Modal to create room */}
            <Modal
                isOpen={modalCreateRoomIsOpen}
                onRequestClose={() => {
                    setmodalCreateRoomIsOpen(false)
                }}
                style={customStylesModal}
                id="modal-main-component"
                contentLabel="Name Modal"
            >
                <h3>Create Room</h3>
                <div className="modal-content-home">
                    <input
                        type="text"
                        className="modal-input-main-component"
                        placeholder="Enter room name (optional)"
                        value={roomName}
                        onChange={(e) => {
                            setRoomName(e.target.value)
                        }}
                    />
                </div>
                {loader && <Loader
                    type="BallTriangle"
                    color="#00BFFF"
                    height={30}
                    width={30} />}
                <button className="join-room-main-chat"
                    onClick={() => {
                        createRoom()
                    }}>
                    Create room
                </button>
            </Modal>

            <div className="main-component-header">
                <div className="header-logo-box">
                    <Icon icon={menuIcon}
                        style={{ fontSize: '40px' }}
                        onClick={() => {
                            setRoomSideBar(!roomSideBar)
                        }}
                    />
                    <img src={MicrosoftTeams} className="logo-main-component" alt="Microsoft Teams" />
                    <h3>Microsoft Teams</h3>

                </div>
                <div className="top-header-side-options">
                    <span className="room-join-options-hover" >
                        +
                        <ul className="room-join-options">
                            <li onClick={() => {
                                setmodalCreateRoomIsOpen(true)
                            }}>
                                <Icon icon={bxsAddToQueue} /><span>Create Room</span></li>
                            <li
                                onClick={() => {
                                    setmodalIsOpen(true)
                                }}>
                                <Icon icon={joinOuter} />
                                <span>
                                    Join Room
                                </span>
                            </li>
                        </ul>

                    </span>
                    <Icon
                        data-tip="Sign Out"
                        onClick={() => {
                            setAuth(false)
                            localStorage.removeItem('TeamsToken')
                            history.push("/signin")
                        }}
                        icon={bxLogOut} />
                </div>
            </div>
            <div className="main-component-content">
                <ProSidebar collapsed={!roomSideBar} collapsedWidth="0px" className="main-chat-pro-sidebar">
                    <SidebarHeader className="main-chat-pro-header">
                        <h4>
                            Rooms
                        </h4>
                    </SidebarHeader>
                    <SidebarContent className="main-chat-pro-content">
                        {rooms.map(roomEach => {
                            return (
                                <div className="sidebar-room"
                                    data-roomid={roomEach.roomID}
                                    id={room && room.roomID == roomEach.roomID ? 'selectedRoom' : 'null'}
                                    onClick={(e) => {
                                        selectRoom(e)
                                    }}
                                >
                                    <div className="room-initial"
                                        data-roomid={roomEach.roomID}
                                        onClick={(e) => {
                                            selectRoom(e)
                                        }}
                                    >
                                        {roomEach.roomName.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="room-name"
                                        data-roomid={roomEach.roomID}
                                        onClick={(e) => {
                                            selectRoom(e)
                                        }}>
                                        {roomEach.roomName}
                                    </div>
                                </div>
                            )
                        })

                        }
                    </SidebarContent>
                </ProSidebar>
                {room ? <ProSidebar collapsed={false} collapsedWidth="0px" className="main-chat-chats-box">
                    <SidebarHeader className="main-chat-chats-box-header">
                        <div className="room-detail">
                            <div className="room-initial-chat-box-header">
                                {room.roomName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="room-name">
                                <h4>{room.roomName}</h4>
                                <h5>Room id : {room.roomID}</h5>
                            </div>
                        </div>
                        <div className="room-options-chat">
                            <Switch
                                className="background-switcher-chat"
                                uncheckedIcon={false}
                                checkedIcon={false}
                                height={20}
                                width={40}
                                data-tip="Change Wallpaper"
                                onChange={(val) => {
                                    setCustomBackground(val)
                                    if (val)
                                        document.
                                            getElementsByClassName('main-chat-chats-box-content')[0].
                                            style.backgroundImage = `url("https://picsum.photos/1920/1080")`
                                    else
                                        document.
                                            getElementsByClassName('main-chat-chats-box-content')[0].
                                            style.backgroundImage = null
                                }} checked={customBackground}
                            />
                            <div className="join-meet-outer-box"
                                data-tip="Join Meeting"
                            >
                                <div className="join-meet-outer"
                                    data-tip="Join Meeting"
                                    data-roomid={room.roomID}
                                    onClick={(e) => {
                                        history.push(`/home/${e.target.dataset.roomid}`)
                                    }}
                                ></div>
                                <Icon
                                    icon={desktopArrowRight24Regular}
                                    className="join-meet-main-chat"
                                    data-tip="Join Meeting"
                                />

                            </div>
                        </div>
                    </SidebarHeader>
                    <SidebarContent className="main-chat-chats-box-content">
                        {chats.map(chat => {
                            return (
                                <div className="sidebar-room-chat" id={chat.userId == userId ? 'shiftChat' : null}>
                                    <div className="room-initial-chat" style={{ backgroundColor: '#333' }}>
                                        {chat.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="chat-user">
                                        <h4 className="chat-user-name">
                                            {chat.userId == userId ? 'You' : chat.name}
                                        </h4>
                                        <div className="chat-user-message">
                                            {chat.message}
                                        </div>
                                    </div>
                                </div>
                            )
                        })

                        }
                        <div ref={messagesEndRef} ></div>
                    </SidebarContent>
                    <SidebarFooter className="main-chat-chats-box-footer">
                        <input
                            type="text"
                            placeholder="Type here"
                            className="chat-entry"
                            onKeyPress={(e) => {
                                e = e || window.event;
                                if (e.key == "Enter") {
                                    sendMessage(message);
                                    setMessage("")
                                }
                            }}
                            onChange={(e) => {
                                setMessage(e.target.value)
                            }}
                            value={message}
                        />
                        <Icon
                            icon={sendFilled}
                            style={{ color: '#333' }}
                            onClick={() => {
                                sendMessage(message);
                                setMessage('')
                            }} />
                    </SidebarFooter>
                </ProSidebar> :
                    <div className="no-room-selected">
                        <h1>Select Your Room !</h1>
                        <h3>OR</h3>
                        <h5>Join or Create Room by clicking on "+"</h5>
                    </div>
                }
            </div>
            <ToastContainer />
            <ReactTooltip effect="solid" place="bottom" />
        </div>
    )
}
const mapStateToProps = state => {
    return {
        name: state.userDetails.name,
        socket: state.userDetails.socket,
        userId: state.userDetails.userId,
        joiningRoom: state.userDetails.joiningRoom,
        joiningPath: state.userDetails.joiningPath,
    }
}

const mapDispatchToProps = dispatch => {
    return {

        setSocket: data => {
            dispatch({
                type: 'SET_SOCKET',
                socket: data,
            })
        },
        setName: data => {
            dispatch({
                type: 'SET_NAME',
                name: data,
            })
        },
        setUserId: data => {
            dispatch({
                type: 'SET_USER_ID',
                userId: data,
            })
        },
        setAuth: data => {
            dispatch({
                type: 'SET_AUTH',
                auth: data,
            })
        },
        setJoiningRoom: data => {
            dispatch({
                type: 'SET_JOINING_ROOM',
                joiningRoom: data,
            })
        },
        setJoiningPath: data => {
            dispatch({
                type: 'SET_JOINING_Path',
                joiningPath: data,
            })
        }
    }
}



export default connect(mapStateToProps, mapDispatchToProps)(MainComponent)