const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const cors = require("cors");
const request = require('request');


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






app.use(cors)
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

io.on('connection', socket => {
    socket.on("join room", ({ roomID, options, name }) => {
        if (users[roomID]&&users[roomID].length!=0) {
            const length = users[roomID].length;
            if (length === 15) {
                socket.emit("room full");
                return;
            }
            users[roomID].push({ id: socket.id, options, name });
        } else {
            users[roomID] = [{ id: socket.id, options, name }];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(user => user.id !== socket.id);
        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, options: payload.options, name: payload.name });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id, options: payload.options, name: payload.name });
    });


    socket.on('disconnectMeet', () => {

        const roomID = socketToRoom[socket.id];
        
        console.log(`User ${socket.id} left from room: ${roomID}`);
        let room = users[roomID];
        if (room) {
            room = room.filter(user => user.id !== socket.id);
            users[roomID] = room;
        }
        if(users[roomID])
        users[roomID].forEach(user => {
            if (socket.id !== user.id) {
                io.to(user.id).emit('user left', socket.id)
                io.to(user.id).emit('user left screen stream', socket.id + "-screen-share")
            }
        })


    });

    socket.on('change', (payload) => {

        const index = users[socketToRoom[socket.id]].findIndex(user => user.id === socket.id)
        users[socketToRoom[socket.id]][index].options = { video: payload.video, audio: payload.audio };

        socket.broadcast.emit('change', payload)
    });
    socket.on("send message", (payload) => {
        if(users[payload.roomID])
        users[payload.roomID].forEach(user => {
            if (socket.id !== user.id)
                io.to(user.id).emit('receivedMessage', payload)
        })

    })


    socket.on("sending screen stream", payload => {
        io.to(payload.userToSignal).emit('user added screen stream', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning screen stream", payload => {
        io.to(payload.callerID).emit('receiving returned screen stream', { signal: payload.signal, id: socket.id + "-screen-share" });
    });

    socket.on("screen stream update", (payload) => {

        if (payload.updateStream) {
            screenShareInRoom[payload.roomID] = {id:socket.id,name:payload.name};
        }
        else {
            screenShareInRoom[payload.roomID] = null
        }
        if(users[payload.roomID])
        users[payload.roomID].forEach(user => {
            if (socket.id !== user.id)
                io.to(user.id).emit('screen share update', 
                { 
                    updateStream: payload.updateStream, 
                    id: socket.id, 
                    name: payload.name 
                });
        })

    })
    socket.on("screen streaming running for new user", (payload) => {
        console.log(screenShareInRoom)
        if (screenShareInRoom[payload.roomID])
            io.to(socket.id).emit('screen share update', 
            { 
                updateStream: true, 
                id: screenShareInRoom[payload.roomID].id,
                name: screenShareInRoom[payload.roomID].name 
            })
    })
    socket.on("transcript data send", (payload) => {
        if(users[payload.roomID])
        users[payload.roomID].forEach(user => {
            if (socket.id !== user.id)
                io.to(user.id).emit('receive transcript', payload)
        })
    })

});

app.get("/", (req, res) => {
    res.send("Live")
});
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