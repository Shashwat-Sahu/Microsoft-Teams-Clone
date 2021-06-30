const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
    roomID:String,
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
    }
}
]

})

mongoose.model("room",roomSchema);