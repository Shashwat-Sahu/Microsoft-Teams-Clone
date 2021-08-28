const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = mongoose.model("User")
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const crypto = require('crypto'); 
const requiredLogin = require("../middleware/requireLogin")

router.post("/signup", (req, res) => {

    const { name, email, password, rooms } = req.body
    if (!email || !password || !name) {
        return res.status(422).json({ error: "Please add all the fields" })
    }
    User.findOne({ email: email }).then((savedUser) => {
        if (savedUser) {
            return res.status(422).json({ error: "user already exists with that email" })
        }

        bcrypt.hash(password, 12).then(hashedpassword => {
            const user = new User({
                email,
                password: hashedpassword,
                name,
                rooms: rooms || []
            })
            user.save().then(user => {

                res.json({ message: "Successfully saved" })
            }).catch(err => {
                console.log(err)
            })
        })

    }).catch(err => {
        console.log(err)
    })
})

router.post("/signin", (req, res) => {
    const { email, password, rooms } = req.body
    if (!email || !password) {
        res.status(422).json({ error: "Please add email or password" })
    }
    if (rooms) {
        User.findOneAndUpdate({ email: email }, {
            $push: {
                rooms: rooms
            }
        }, {
            new: true
        }).then(savedUser => {
            if (!savedUser) {
                res.status(422).json({ error: "Invalid email or password" })
            }
            bcrypt.compare(password, savedUser.password).then(doMatch => {
                if (doMatch) {
                    //res.json({message:"Successfully signed in"})
                    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET)
                    const { _id, name, email, rooms } = savedUser
                    res.json({ token, user: { _id, name, email, rooms } })
                }
                else {
                    return res.status(422).json({ error: "Invalid Email or password" })
                }
            })
        }).catch(err => {
            console.log(err)
        })
    }
    else {
        User.findOne({ email: email }).then(savedUser => {
            if (!savedUser) {
                res.status(422).json({ error: "Invalid email or password" })
            }
            bcrypt.compare(password, savedUser.password).then(doMatch => {
                if (doMatch) {
                    // res.json({ message: "Successfully signed in" })
                    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET)
                    const { _id, name, email, rooms } = savedUser
                    res.json({ token, user: { _id, name, email, rooms } })
                }
                else {
                    return res.status(422).json({ error: "Invalid Email or password" })
                }
            })
        }).catch(err => {
            console.log(err)
        })
    }
})

router.post("/verifyotp",(req,res)=>{
    if(!req.body.email)
    return res.status(400).json({"error":"error"})
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: `teamsclonemicrosoft@gmail.com`,
        pass: process.env.emailPassword
      }
    });
    var otp = Math.floor(Math.random()*9)+""+Math.floor(Math.random()*9)+""+Math.floor(Math.random()*9)+""+Math.floor(Math.random()*9)+""+Math.floor(Math.random()*9)+""+Math.floor(Math.random()*9);
    var mailOptions = {
      from: {name:"Teams Microsoft",address:'teamsclonemicrosoft@gmail.com'},
      to: req.body.email,
      subject: 'Verify your Email ID',
      html: `<h1>Microsoft Teams Clone</h1>
      <p>Here's your One time password (otp) : ${otp}</p>
      `
    };
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        return res.json({"error":"Error occurred"})
      } else {
        console.log('Email sent: ' + info.response);
        const hash = crypto.createHash('sha256').update(otp).digest('hex'); 
        // const token=jwt.sign({hash:hash,email:req.body.email},process.env.JWT_FORGOT_PASSWORD,{expiresIn: '10min'})
        
        return res.json({hash:hash})
      }
    });
})

router.post("/forgotpassword",(req,res)=>{
    const { email, password} = req.body
    if (!email || !password) {
        res.status(422).json({ error: "Please add email or password" })
    }
    bcrypt.hash(password, 12).then(hashedpassword =>
    User.findOneAndUpdate({email},{
        password : hashedpassword
    }).then(user=>{
        if (!user) {
            return res.status(422).json({ error: "user does not exists" })
        }
        res.json({message:"Success"})
    })
    )
}
)


module.exports = router
