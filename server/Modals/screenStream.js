const mongoose = require('mongoose')

const screenShareSchema = new mongoose.Schema({
    roomID: String,
    screenShareInRoom: {
        id: {
            type: String
        },
        name: {
            type: String
        }
    }
})
mongoose.model("ScreenStream", screenShareSchema);