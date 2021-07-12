const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const requiredLogin = require("../middleware/requireLogin")
const Room = mongoose.model('Room');
const User = mongoose.model('User');
const request = require('request')

router.get("/transcriptToken",(req,res)=>{


const authOptions = {
  method: 'post',
  url: "https://api.symbl.ai/oauth2/token:generate",
  body: {
    type: "application",
    appId: process.env.appId,
    appSecret: process.env.appSecret
  },
  json: true
};

request(authOptions, (err, response, body) => {
  if (err) {
    console.error('error posting json: ', err);
    throw err
  }
  res.send(body)
});
})

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
            MeetingUsers:[],
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

        
        res.send(room)
    })
    })
})

router.post("/updateSocket",requiredLogin,(req,res)=>{
    
    const roomsID = req.user.rooms.filter(room=>{
        return room;
    })
    const result = roomsID.map(roomID=>
     Room.findOneAndUpdate({roomID:roomID,'roomPresentUsers.userId':req.user._id},{
        $set:{
            'roomPresentUsers.$.socketId':req.body.socketId
        }
    },{
        new:true
    }).then(room=>{
        return room
    })

    )
    res.send(result)
})


module.exports = router