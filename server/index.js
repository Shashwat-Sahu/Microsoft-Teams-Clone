const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const cors = require("cors");
app.use(cors)
const io = socket(server,{
    cors: {
        origin: '*',
      }
});
require ("dotenv").config();
const path = require("path");

const users = {};

const socketToRoom = {};

const screenShareInRoom ={};

io.on('connection', socket => {
    socket.on("join room", ({roomID,options,name}) => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 15) {
                socket.emit("room full");
                return;
            }
            users[roomID].push({id:socket.id,options,name});
        } else {
            users[roomID] = [{id:socket.id,options,name}];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(user => user.id !== socket.id);
        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID,options:payload.options,name:payload.name });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id,options:payload.options,name:payload.name });
    });

    
    socket.on('disconnectMeet', () => {

        const roomID = socketToRoom[socket.id];
        console.log(`User ${socket.id} left from room: ${roomID}`);
        let room = users[roomID];
        if (room) {
            room = room.filter(user => user.id !== socket.id);
            users[roomID] = room;
        }
        socket.broadcast.emit('user left',socket.id)
        socket.broadcast.emit('user left screen stream',socket.id+"-screen-share")
        
    });

    socket.on('change', (payload) => {
        
        const index = users[socketToRoom[socket.id]].findIndex(user=>user.id === socket.id)
        users[socketToRoom[socket.id]][index].options={video:payload.video,audio:payload.audio};
        
        socket.broadcast.emit('change',payload)
    });
    socket.on("send message",(payload)=>{
        users[payload.roomID].forEach(user=>{
            if(socket.id!==user.id)
            io.to(user.id).emit('receivedMessage',payload)
        })

    })


    socket.on("sending screen stream", payload => {
        io.to(payload.userToSignal).emit('user added screen stream', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning screen stream", payload => {
        io.to(payload.callerID).emit('receiving returned screen stream', { signal: payload.signal, id: socket.id+"-screen-share" });
    });

    socket.on("screen stream update",(payload)=>{

        if(payload.updateStream)
        {
            screenShareInRoom[payload.roomID] = socket.id;
        }
        else
        {
            screenShareInRoom[payload.roomID] = null;
        }
        users[payload.roomID].forEach(user=>{
            if(socket.id!==user.id)
            io.to(user.id).emit('screen share update',{updateStream:payload.updateStream,id:socket.id});
        })

    })
    socket.on("screen streaming running for new user",(payload)=>{
        console.log(screenShareInRoom)
        if(screenShareInRoom[payload.roomID])
        io.to(socket.id).emit('screen share update',{updateStream:true,id:screenShareInRoom[payload.roomID]})
    })

});

app.get("/",(req,res)=>{
    res.send("Live")
});
const PORT = process.env.PORT || 8000;
// if(process.env.PROD){
//     app.use( express.static(__dirname + '/client/build'));
//     app.get('*', (request, response) => {
// 	    response.sendFile(path.join(__dirname, 'client/build/index.html'));
//     });
// }
server.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)}
    )