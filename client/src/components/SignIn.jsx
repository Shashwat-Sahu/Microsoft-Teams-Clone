import React, { useState } from "react";
import Avatar from "../assets/avatar.png";
import Group_Connect from "../assets/home-right-vector.png";
import { Link, useHistory } from 'react-router-dom'
import { connect } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import "../styles/signin.css"
import Loader from "react-loader-spinner";
import MicrosoftTeams from "../assets/microsoft-teams.svg";
import axios from 'axios';
import { prodUrl as url } from "../Config/config.json"

const SignIn = (props) => {
  // set context user data
  const { email, setEmail, setAuth } = props;
  const [loader, setLoader] = useState(false)
  // for redirecting
  const history = useHistory()
  // pasword entered
  const [password, setPassword] = useState('')
  const signin = () => {
    // Password should not be empty
    if (!password)
      return toast.error("Password can't be empty")
    // Email should not be empty
    if (!email)
      return toast.error("Email can't be empty")
    setLoader(true)

    // fetch server sign for authorization
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
      setLoader(false)
      toast.success("Signed in Successfully", {
        autoClose: 2000,
        closeOnClick: false,
        pauseOnHover: false,
      });
      setAuth(true)
      // set token at local Storage for future services check
      localStorage.setItem('TeamsToken', data.data.token)
      setTimeout(() => {
        history.push("/")
      }, 2000);

    }).catch(err => {
      // if not verified
      toast.error(err.response.data.error)
      setLoader(false)
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

        {loader && <Loader
          type="BallTriangle"
          color="#00BFFF"
          height={30}
          width={30} />}
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
        <Link to="/forgotpassword" className="forgot-password">Forgot Password?</Link>
      </div>
      <img src={Group_Connect} alt="group connect" className="signin-bottom-vector" />
    </div>
    <ToastContainer />
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