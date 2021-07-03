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
roomSchema.path('roomUsers').validate(function (value) {
    console.log(value.length)
    if (value.length > 10) {
      throw new Error("Atmost 10 people allowed!");
    }
  })
mongoose.model("Room",roomSchema);