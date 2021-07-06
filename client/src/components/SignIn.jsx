import React, { useState } from "react";
import Avatar from "../assets/avatar.png";
import Group_Connect from "../assets/home-right-vector.png";
import { useHistory } from 'react-router-dom'
import { connect } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import "../styles/signin.css"
import MicrosoftTeams from "../assets/microsoft-teams.svg";
import axios from 'axios';
import {prodUrl as url} from "../Config/config.json"

const SignIn = (props) => {
  const { email, setEmail, setAuth } = props;
  const history = useHistory()
  const [password, setPassword] = useState('')
  const signin = () => {
    if (!password)
      return toast.error("Password can't be empty")
    if (!email)
      return toast.error("Email can't be empty")
      axios({
        url: `${url}/signin`,
        method: 'POST',
        data: {
            email,
            password
        },
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(data => {
      console.log(data)
      setAuth(true)
        toast.success("Signed in Successfully", {
            autoClose: 2000,
            closeOnClick: false,
            pauseOnHover: false,
        });
        setAuth(true)
        localStorage.setItem('TeamsToken',data.data.token)
        setTimeout(() => {
            history.push("/")
        }, 2000);

    }).catch(err=>{
      toast.error(err.response.data.error)
    })
  }
  return (<>
    <div className="sign-in-parent">
      <div className="signin-logo-box">
        <img src={MicrosoftTeams} className="logo-signin" alt="Microsoft Teams" />
        <h2>Microsoft Teams</h2>
      </div>
      <div className="signin-entry-box">
        <img src={Avatar} className="avatar-signin" alt="Avatar" />
        <h2 className="signin-head">Sign In</h2>
        <input
          type="email"
          placeholder="Enter Email ID"
          className="email-input"
          value={email}
          onChange={(e) => { setEmail(e.target.value) }}

        />
        <input
          type="password"
          placeholder="Enter Password"
          className="password-input"
          onChange={(e) => { setPassword(e.target.value) }}

        />
        <div className="signin-entry-options">
          <button
            className="signin-entry-buttons"
            onClick={() => {
              signin()
            }}
          >Sign in</button>

          <button
            className="signin-entry-buttons"
            onClick={() => {
              history.push("/signup")
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
      <img src={Group_Connect} className="signin-bottom-vector" />
    </div>
    <ToastContainer/>
</>
  )
}
const mapStateToProps = state => {
  return {
    email: state.userDetails.email,
    auth: state.userDetails.auth
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
    setAuth: data => {
      dispatch({
        type: 'SET_AUTH',
        auth: data,
      })
    }
  }
}



export default connect(mapStateToProps, mapDispatchToProps)(SignIn)