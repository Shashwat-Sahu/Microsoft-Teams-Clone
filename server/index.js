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

// const authOptions = {
//   method: 'post',
//   url: "https://api.symbl.ai/oauth2/token:generate",
//   body: {
//     type: "application",
//     appId: "4b396a706c444e70726972486772396c656756357a6a63667034416f54474555",
//     appSecret: "77556671304d516d623053654c626673624d4e526a4d684a42413154516f5a666c4d444b686e4e34725a6341585778723673555a325877576f73353967726661"
//   },
//   json: true
// };

// request(authOptions, (err, res, body) => {
//   if (err) {
//     console.error('error posting json: ', err);
//     throw err
//   }

//   console.log(JSON.stringify(body, null, 2));
// });







const io = socket(server, {
    cors: {
        origin: '*',
    }
});
require("dotenv").config();
const path = require("path");

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
    socket.on("join room", ({ roomID, options, name }) => {
        Room.findOneAndUpdate({ roomID: roomID }, {
            $push: {
                roomUsers:
                {
                    id: socket.id,
                    name,
                    options
                }
            }
        },
            {
                upsert: true,
                returnOriginal: false
            }
        ).then(data => {

            if (data == null) {
                return socket.emit("all users", []);
            }
            else {
                socketToRoom[socket.id] = roomID;
                return socket.emit("all users", data.roomUsers);
            }

        })
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, options: payload.options, name: payload.name });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id, options: payload.options, name: payload.name });
    });


    socket.on('disconnectMeet', ({ name, roomID }) => {

        Room.findOneAndUpdate({ roomID: roomID }, {
            $pull: {
                roomUsers:
                {
                    "id": socket.id
                }
            }
        },
            {
                returnOriginal:false
            }
        ).then(room => {
            console.log("After left", room)
            console.log(`User ${socket.id} left from room: ${roomID}`);

            if (room && room.roomUsers) {
                room.roomUsers.forEach(user => {
                    if (socket.id !== user.id) {
                        io.to(user.id).emit('user left', { id: socket.id, name })
                        io.to(user.id).emit('user left screen stream', socket.id + "-screen-share")
                    }

                })

            }

            // if (room&& (room.roomUsers.length == 0 || (room.roomUsers.length == 1 && room.roomUsers[0].id == socket.id))) {
            //     Room.findOneAndDelete({ roomID: roomID }).then(room => {
            //         console.log("deleted room", room)
            //     })

            // }
            Room.findOne({ roomID: roomID }).then(data => {
                console.log(data)
                console.log(socket.id)
                if (data && data.screenShareInRoom.id == socket.id) {
                    Room.findOneAndUpdate({ roomID: roomID }, {
                        $set: {
                            screenShareInRoom: {
                                id: null,
                                name: null
                            }
                        }
                    }, {
                        
                        new:true,
                        upsert: true
                    }
                    ).then(room => {
                        console.log(room);
                        if (room && room.roomUsers) {

                            room.roomUsers.forEach(user => {
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
        Room.findOneAndUpdate({ roomID: payload.roomID, "roomUsers.id": socket.id }, {
            $set: {
                "roomUsers.$.options": {
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
                        userId:payload.id,
                        name:payload.name,
                        message:payload.message
                    }
                }
            },{
                new:true
            }).then(room => {
            console.log(room)
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
            if (room && room.roomUsers) {

                room.roomUsers.forEach(user => {
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
    socket.on("transcript data send", (payload) => {
        Room.findOne({ roomID: payload.roomID }).then(room => {
            console.log(room)
            if (room && room.roomUsers) {
                room.roomUsers.forEach(user => {
                    if (socket.id !== user.id)
                        io.to(user.id).emit('receive transcript', payload)
                })
            }
        })
    })
})




const PORT = process.env.PORT || 8000;
// if(process.env.PROD){
//     app.use( express.static(__dirname + '/client/build'));
//     app.get('*', (request, response) => {
// 	    response.sendFile(path.join(__dirname, 'client/build/index.html'));
//     });
// }
server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
}
)