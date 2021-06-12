const app = require("express")();
const server  = require("http").createServer(app);
const cors = require("cors")
const {v4: uuidV4} = require('uuid')
const io = require("socket.io")(server,{
    cors:{
        origin:"*",
        method:["GET","POST"]
    }
})

app.get("/",(req,res) => {
    res.send(`${uuidV4()}`);
})
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)  // Join the conference
        socket.broadcast.emit('user-connected', userId) // Tell everyone else in the conference that we joined
        
        // Communicate the disconnection
        socket.on('disconnect', () => {
            socket.broadcast.emit('user-disconnected', userId)
        })
    })
})
app.use(cors)
const PORT = process.env.PORT || 8000;
server.listen(PORT,()=>{console.log(`Server is running on ${PORT}`)})