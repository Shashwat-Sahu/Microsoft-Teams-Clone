const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const roomSchema = new mongoose.Schema({
    roomID:{
        type:String,
        unique:true
    },
    roomName:{
        type:String,
        default:"Unknown Room"
    },
    roomUsers:[{
    id:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    options:{
        video:Boolean,
        audio:Boolean
    },
    userId:{
        type:String,
        required:true
    },
}
]
,
roomPresentUsers:[{
    userId:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    socketId:{
        type:String,
    }
}
]
,
screenShareInRoom: {
    id: {
        type: String
    },
    name: {
        type: String
    }
},
chats:[
    {
        userId:{
            type:ObjectId,
            ref:'User'
        },
        message:String,
        name:String
    }
]
})
roomSchema.path('roomUsers').validate(function (value) {
    console.log(value.length)
    if (value.length > 10) {
      throw new Error("Atmost 10 people allowed!");
    }
  })
mongoose.model("Room",roomSchema);