import React, { useState } from "react";
import { Link, useHistory } from 'react-router-dom'
import Avatar from "../assets/avatar.png";
import Group_Connect from "../assets/home-right-vector.png";
import { connect } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import "../styles/signup.css"
import MicrosoftTeams from "../assets/microsoft-teams.svg";
import axios from 'axios';
import Loader from "react-loader-spinner";
import { sha256 } from "js-sha256";
import { prodUrl as url } from "../Config/config.json"

const Signup = (props) => {
    // set context user data
    const { email, setEmail, name, setName } = props;
    // for redirect
    const history = useHistory()
    const [loader,setLoader] = useState(false)
    // pasword entered
    const [password, setPassword] = useState('')
    // confirm pasword entered
    const [confirmPassword, setConfirmPassword] = useState('')
    // otp verified or not
    const [otpVerified, SetOtpVerified] = useState(false)
    // otp sent to mail or not
    const [otpSent, setOtpSent] = useState(false)
    // received sha256 hashed otp
    const [receivedOtp,setReceivedOtp] = useState('')
    const [clientOtp,setClientOtp] = useState('')

    // otp hashed receive and email id sent
    const sentOtp = () =>{
        setLoader(true)
        axios({
            url:`${url}/verifyotp`,
            data:{
                email
            },
            method:'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(data=>{
            if(data.data.hash)
            {
            setReceivedOtp(data.data.hash)
            setOtpSent(true)
            toast.info(`OTP Sent to ${email}`)
            }
            else
            {
                toast.error(data.data.error)
            }
            setLoader(false)
        })
    }

    // verification of otp 
    const verifyotp = () =>{
        if(sha256(clientOtp)==receivedOtp)
        {
            toast.info("OTP Verified Successfully")
            SetOtpVerified(true)
        }
        else{
            toast.error("Wrong OTP")
        }
    }
    const signup = () => {
        if(!otpVerified)
        return
        // Password should not be empty    
        if (!password)
            return toast.error("Password can't be empty")
        // email should not be empty
        if (!email)
            return toast.error("Email can't be empty")
        if (!name)
            return toast.error("name can't be empty")
        if (confirmPassword !== password)
            return toast.error("Confirm password does'nt match with password")
        var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        var passwordformat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        // Validate email id
        if (!mailformat.test(email))
            return toast.error("Please enter valid email !")
        // Validate password 
        if (!passwordformat.test(password))
            return toast.error("Password must contain minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character !")
        setLoader(true)
        //signup via server
            axios({
            url: `${url}/signup`,
            method: 'POST',
            data: {
                name,
                email,
                password
            },
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(data => {
            setLoader(false)
            toast.success("Registered Successfully", {
                autoClose: 2000,
                closeOnClick: false,
                pauseOnHover: false,
            });
            setTimeout(() => {
                history.push("/signin")
            }, 2000);

        }).catch(data=>{
            toast.error(data.response.data.error)
            setLoader(false)
        })
    }
    return (
        <>
            <div className="sign-up-parent">
                <div className="signup-logo-box">
                    <img src={MicrosoftTeams} className="logo-signup" alt="Microsoft Teams" />
                    <h2>Microsoft Teams</h2>
                </div>
                <div className="signup-entry-box">
                    <img src={Avatar} className="avatar-signup" alt="Avatar" />
                    <h2 className="signup-head">Sign Up</h2>
                    {!otpVerified && <h4>OTP Verification</h4>}
                    {!otpVerified && !otpSent&&<input
                        type="email"
                        placeholder="Enter Email ID"
                        className="email-input"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value) }}

                    />}
                    {
                        otpSent&&!otpVerified&&<h6>OTP sent to {email}</h6>
                    }
                    {
                        otpSent &&!otpVerified&& <input
                        type="password"
                        placeholder="Enter OTP"
                        className="name-input"
                        value={clientOtp}
                        onChange={(e) => { setClientOtp(e.target.value) }}

                    />
                    }
                    {
                        otpSent &&!otpVerified&&
                        <h6>Please check spams, if email not found !</h6>
                    }
                    {otpVerified && <input
                        type="text"
                        placeholder="Enter Name"
                        className="name-input"
                        value={name}
                        onChange={(e) => { setName(e.target.value) }}

                    />}
                    {otpVerified && <input
                        type="password"
                        placeholder="Enter Password"
                        className="password-input"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value) }}

                    />}
                    {otpVerified && <input
                        type="password"
                        placeholder="Confirm Password"
                        className="password-input"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value) }}

                    />}
                    {
                        confirmPassword !== password &&
                        <h5 style={{ color: 'red' }}>
                            *Confirm password does'nt match with password
                        </h5>
                    }
                    {otpVerified && <h6 className="signup-password-format">
                        Note: Password must contain minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character
                    </h6>}
                    {loader&&<Loader 
                        type="BallTriangle" 
                        color="#00BFFF" 
                        height={30} 
                        width={30} />}
                    <div className="signup-entry-options">
                        
                        {!otpSent &&
                            <button
                                className="signup-entry-buttons"
                                onClick={() => {
                                    sentOtp()
                                }}
                            >
                                Send OTP
                            </button>
                        }
                        {
                            otpSent&&!otpVerified&&<button
                            className="signup-entry-buttons"
                            onClick={() => {
                                verifyotp()
                            }}
                        >
                            Verify OTP
                        </button>
                        }
                        {otpVerified && <button
                            className="signup-entry-buttons"
                            onClick={() => {
                                signup()
                            }}
                        >
                            Sign Up
                        </button>}
                    </div>
                    <h5>If already have account, <Link to={"/signin"}>Sign In</Link></h5>
                </div>
                <img src={Group_Connect} alt="group connect" className="signup-bottom-vector" />

            </div>
            <ToastContainer />
        </>

    )
}
const mapStateToProps = state => {
    return {
        email: state.userDetails.email,
        name: state.userDetails.name
    }
}

const mapDispatchToProps = dispatch => {
    return {

        setEmail: data => {
            dispatch({
                type: 'SET_EMAIL',
                email: data,
            })
        },
        setName: data => {
            dispatch({
                type: 'SET_NAME',
                name: data,
            })
        }
    }
}



export default connect(mapStateToProps, mapDispatchToProps)(Signup)