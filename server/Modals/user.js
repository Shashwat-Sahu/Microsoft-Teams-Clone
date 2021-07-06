const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    rooms:[{
        type:String
    }],
    socket:{
        type:Object
    }
    }
)

mongoose.model("User",userSchema);