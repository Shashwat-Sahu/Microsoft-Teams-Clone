const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const User = mongoose.model("User")

module.exports=(req,res,next)=>{

    const {authorization} = req.headers
    //authorisatin ===Bearer djbdbdjbdbd
    if(!authorization){
        res.status(401).json({error:"You must be logged in"})
    }
    const token = authorization.replace("Bearer ","")
    jwt.verify(token,process.env.JWT_SECRET,(err,payload)=>{
        if(err){
        return res.status(401).json({error:"You must be logged in"})
        }
        const {id} = payload
        User.findById(id).then(userdata=>{
            
            req.user = userdata
            next()
        })
        
    })
}