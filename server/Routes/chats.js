const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const requiredLogin = require("../middleware/requireLogin")
const Room = mongoose.model('Room');
const User = mongoose.model('User');

router.get("/getChats",requiredLogin,(req,res)=>{
    
    const roomsID = req.user.rooms.filter(room=>{
        return room;
    })
    Room.find({roomID:{$in:roomsID}}).then(rooms=>{
        req.user.password=null;
        res.send({rooms,user:req.user})
    })
})

router.post("/createRoom",requiredLogin,(req,res)=>{
    const {roomID,roomName} = req.body;
    Room.findOneAndUpdate({ roomID: roomID }, {
        $set:{
            roomName:roomName||"Unknown Room",
            roomUsers:[],
            screenShareInRoom: {
                id:null,
                name:null
            },
            chats:[]
        },
        $push: {
            roomPresentUsers:
            {
                userId: req.user._id,
                name:req.user.name,
                socketId:req.body.socketId
            }
        }
    },
        {
            upsert: true,
            new: true
        }
    ).then(room=>{
        User.findByIdAndUpdate(req.user._id,{
            $push:{
                rooms:roomID
            }
        }).then(data=>{

        
        console.log(data)
        res.send(room)
    })
    })
})

router.post("/joinRoom",requiredLogin,(req,res)=>{
    const {roomID} = req.body;
    if(req.user.rooms.some(roomPresentID=>roomID==roomPresentID))
    return res.status(409).json({error:"You are already present in this room"})
    Room.findOneAndUpdate({ roomID: roomID }, {
        $push: {
            roomPresentUsers:
            {
                userId: req.user._id,
                name:req.user.name,
                socketId:req.body.socketId
            }
        }
    },
        {
            new: true
        }
    ).then(room=>{
        if(!room)
        res.status(422).json({error:"Room doesn't exist!"})
        User.findByIdAndUpdate(req.user._id,{
            $push:{
                rooms:roomID
            }
        }).then(data=>{

        
        console.log(data)
        res.send(room)
    })
    })
})

router.post("/updateSocket",requiredLogin,(req,res)=>{
    
    const roomsID = req.user.rooms.filter(room=>{
        return room;
    })
    console.log(req.body)
    const result = roomsID.map(roomID=>
     Room.findOneAndUpdate({roomID:roomID,'roomPresentUsers.userId':req.user._id},{
        $set:{
            'roomPresentUsers.$.socketId':req.body.socketId
        }
    },{
        new:true
    }).then(room=>{
        console.log(room)
        return room
    })

    )
    res.send(result)
})


module.exports = router