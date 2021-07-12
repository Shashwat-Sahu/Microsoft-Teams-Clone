const express = require("express");
const http = require("http");
const app = express();
// const cors = require("cors");

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
app.use(express.json())
app.get("/", (req, res) => {
    res.send("Live")
});

// app.use(cors)


const server = http.createServer(app);
const socket = require("socket.io");
const request = require('request');


require('dotenv').config()
require("./Modals/room")
require("./Modals/user")

app.use(require("./Routes/auth"));
app.use(require("./Routes/chats"));

const mongoose = require('mongoose');
const Room = mongoose.model('Room');











const io = socket(server, {
    cors: {
        origin: '*',
    }
});
require("dotenv").config();
const path = require("path");
const { route } = require("./Routes/auth");

const users = {};

const socketToRoom = {};

const screenShareInRoom = {};

mongoose.connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB', process.env.MONGO);
})

mongoose.connection.on('error', (err) => {
    console.log(err);
})


io.on('connection', socket => {
    socket.on("join room", ({ roomID, options, name, userId }) => {
        Room.findOneAndUpdate({ roomID: roomID }, {
            $push: {
                MeetingUsers:
                {
                    id: socket.id,
                    name,
                    options,
                    userId
                }
            }
        },
            {
                upsert: true,
                returnOriginal: false
            }
        ).then(data => {
            console.log(data)
            if(data.transcriptEnabled.userId!=null)
            {
                io.to(socket.id).emit("transcript updated",{enabled:true,name:data.transcriptEnabled.name})
            }
            if (data == null) {
                return socket.emit("all users", []);
            }
            else {
                socketToRoom[socket.id] = roomID;
                return socket.emit("all users", data.MeetingUsers);
            }
            
        })
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, options: payload.options, name: payload.name });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id, options: payload.options, name: payload.name });
    });


    socket.on('disconnectMeet', ({ name, roomID,userId }) => {
        console.log(userId)
        Room.findOneAndUpdate({ roomID: roomID }, {
            $pull: {
                MeetingUsers:
                {
                    userId:userId
                }
            }
        },
        {
            multi:true,
            new:true
        }

        ).then(room => {
            
            console.log("After left", room)
            console.log(`User ${socket.id} left from room: ${roomID}`);

            if (room && room.MeetingUsers) {
                room.MeetingUsers.forEach(user => {
                    if (userId !== user.userId) {
                        io.to(user.id).emit('user left', { id: socket.id, name })
                        io.to(user.id).emit('user left screen stream', socket.id + "-screen-share")
                    }

                })

            }
        
            // if (room&& (room.MeetingUsers.length == 0 || (room.MeetingUsers.length == 1 && room.MeetingUsers[0].id == socket.id))) {
            //     Room.findOneAndDelete({ roomID: roomID }).then(room => {
            //         console.log("deleted room", room)
            //     })

            // }
            Room.findOne({ roomID: roomID }).then(data => {
                console.log(data)
                console.log(socket.id)
                if (data ) {
                    Room.findOneAndUpdate({ roomID: roomID }, {
                        $set: {
                            screenShareInRoom: {
                                id: data.screenShareInRoom.id == socket.id?null:data.screenShareInRoom.id,
                                name: data.screenShareInRoom.id == socket.id?null:data.screenShareInRoom.name
                            }
                            ,
                            transcriptEnabled:{
                                userId:data.MeetingUsers.length==0?null:data.transcriptEnabled.userId,
                                name:data.MeetingUsers.length==0?null:data.transcriptEnabled.name,
                            }
                        }
                    }, {
                        
                        new:true,
                        upsert: true
                    }
                    ).then(room => {
                        if (room && room.MeetingUsers&&data.screenShareInRoom.id == socket.id) {

                            room.MeetingUsers.forEach(user => {
                                if (socket.id !== user.id)
                                    io.to(user.id).emit('screen share update',
                                        {
                                            updateStream: false,
                                            id: socket.id,
                                            name: name
                                        });
                            })
                        }
                    })
                }
            })
        })
    });

    socket.on('change', (payload) => {
        Room.findOneAndUpdate({ roomID: payload.roomID, "MeetingUsers.id": socket.id }, {
            $set: {
                "MeetingUsers.$.options": {
                    video: payload.video, audio: payload.audio
                }
            }
        },
            {
                returnOriginal: false
            }
        ).then(data => {
            console.log(data)
            socket.broadcast.emit('change', payload)
        })
    });
    socket.on("send message", (payload) => {
        Room.findOneAndUpdate(
            { roomID: payload.roomID }
            ,
            {
                $push:{
                    chats:{
                        userId:payload.userId,
                        name:payload.name,
                        message:payload.message
                    }
                }
            },{
                new:true
            }).then(room => {
            if (room && room.roomPresentUsers) {
                room.roomPresentUsers.forEach(user => {
                    if (socket.id !== user.socketId)
                        io.to(user.socketId).emit('receivedMessage', payload)
                })
            }
        })
    })


    socket.on("sending screen stream", payload => {
        io.to(payload.userToSignal).emit('user added screen stream', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning screen stream", payload => {
        io.to(payload.callerID).emit('receiving returned screen stream', { signal: payload.signal, id: socket.id + "-screen-share" });
    });

    socket.on("screen stream update", (payload) => {
        console.log(`User ${socket.id} ${payload.updateStream ? 'started' : 'stopped'} screen sharing in room: ${payload.roomID}`)

        Room.findOneAndUpdate({ roomID: payload.roomID }, {
            $set: {
                screenShareInRoom: {
                    id: payload.updateStream ? socket.id : null,
                    name: payload.updateStream ? payload.name : null
                }
            }
        }, {
            upsert: true,
            returnOriginal: false
        }
        ).then(room => {
            console.log(room);
            if (room && room.MeetingUsers) {

                room.MeetingUsers.forEach(user => {
                    if (socket.id !== user.id)
                        io.to(user.id).emit('screen share update',
                            {
                                updateStream: payload.updateStream,
                                id: socket.id,
                                name: payload.name
                            });
                })
            }
        })
    })

    socket.on("transcript enabled",payload=>{
        console.log(payload)
        Room.findOneAndUpdate({ roomID: payload.roomID }, {
         $set:{
            transcriptEnabled:{
                userId:payload.enabled?payload.userId:null,
                name:payload.enabled?payload.name:null
            }
         }
        },{
            new:true,
        }).then(room=>{
            if (room && room.MeetingUsers) {

                room.MeetingUsers.forEach(user => {
                    if (socket.id !== user.id)
                        io.to(user.id).emit('transcript updated',
                            {
                                enabled:payload.enabled,
                                name: payload.name
                            });
                })
            }
        })
    })

    socket.on("screen streaming running for new user", (payload) => {

        Room.findOne({ roomID: payload.roomID }).then(data => {
            console.log("new stream", data)
            if (data.screenShareInRoom.id) {
                io.to(socket.id).emit('screen share update',
                    {
                        updateStream: true,
                        id: data.screenShareInRoom.id,
                        name: data.screenShareInRoom.name
                    })
            }
        })
    })

})




const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
}
)