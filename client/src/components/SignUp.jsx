import React, { useState } from "react";
import { useHistory } from 'react-router-dom'
import Avatar from "../assets/avatar.png";
import Group_Connect from "../assets/home-right-vector.png";
import { connect } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import "../styles/signup.css"
import MicrosoftTeams from "../assets/microsoft-teams.svg";
import axios from 'axios';
import {prodUrl as url} from "../Config/config.json"

const Signup = (props) => {
    const { email, setEmail, name, setName } = props;
    const history = useHistory()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const signup = () => {
        if (!password)
            return toast.error("Password can't be empty")
        if (!email)
            return toast.error("Email can't be empty")
        if (!name)
            return toast.error("name can't be empty")
        if (confirmPassword != password)
            return toast.error("Confirm password does'nt match with password")
        var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        var passwordformat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!mailformat.test(email))
            return toast.error("Please enter valid email !")
        if (!passwordformat.test(password))
            return toast.error("Password must contain minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character !")
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
            toast.success("Registered Successfully", {
                autoClose: 2000,
                closeOnClick: false,
                pauseOnHover: false,
            });
            setTimeout(() => {
                history.push("/signin")
            }, 2000);

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
                    <input
                        type="email"
                        placeholder="Enter Email ID"
                        className="email-input"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value) }}

                    />
                    <input
                        type="text"
                        placeholder="Enter Name"
                        className="name-input"
                        value={name}
                        onChange={(e) => { setName(e.target.value) }}

                    />
                    <input
                        type="password"
                        placeholder="Enter Password"
                        className="password-input"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value) }}

                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className="password-input"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value) }}

                    />
                    {
                        confirmPassword != password &&
                        <h5 style={{ color: 'red' }}>
                            *Confirm password does'nt match with password
                        </h5>
                    }
                    <h6 className="signup-password-format">
                        Note: Password must contain minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character
                    </h6>
                    <div className="signup-entry-options">

                        <button
                            className="signup-entry-buttons"
                            onClick={() => {
                                signup()
                            }}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
                <img src={Group_Connect} className="signup-bottom-vector" />

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