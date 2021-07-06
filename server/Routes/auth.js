const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = mongoose.model("User")
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")
const requiredLogin = require("../middleware/requireLogin")

router.post("/signup", (req, res) => {

    const { name, email, password, rooms } = req.body
    console.log(req.body)
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

module.exports = router
