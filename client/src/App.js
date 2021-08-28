import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom"
import Home from "./components/Home"
import Meet from "./components/Meet"
import SignIn from "./components/SignIn"
import SignUp from "./components/SignUp"
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute"
import { prodUrl as url } from "./Config/config.json"
import { useHistory } from 'react-router-dom'
import { connect } from 'react-redux';
import MainComponent from "./components/MainComponent"
import ForgotPassword from "./components/ForgotPassword";

const Routing = (props) => {
  const history = useHistory();
  const { auth, setJoiningRoom, setJoiningPath } = props

  useEffect(() => {
    const urlArray = window.location.href.split("/")
    // Redirect to meeting and join room if url was shared 
    var roomIdFormat = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/;
    if (roomIdFormat.test(urlArray[urlArray.length - 1])) {
      setJoiningRoom(urlArray[urlArray.length - 1])
      const path = urlArray.find(ele => ele === 'home' || ele === 'teams')
      if (path)
        setJoiningPath('home')
      history.push("/")
    }
    else if (roomIdFormat.test(urlArray[urlArray.length - 2])) {
      setJoiningRoom(urlArray[urlArray.length - 2])
      const path = urlArray.find(ele => ele === 'home' || ele === 'teams')
      if (path)
        setJoiningPath(path)
      history.push("/")
    }
    // if not authorized then redirect to sign in
    if (!auth)
      history.push("/signin")
  }, [])
  return (
    <>
      {
        !auth
          ? <Switch>

            <Route exact path="/signup" component={SignUp} />
            <Route path="/signin" component={SignIn} />
            <Route path="/forgotpassword" component={ForgotPassword}/>
          </Switch>
          :
          <Switch>
            <Route exact path="/teams/:teamId" component={Meet} />
            <Route exact path="/home/:teamId" component={Home} />
            <ProtectedRoute component={MainComponent} />
          </Switch>
      }
    </>
  )
}

function App(props) {
  const [loader, setLoader] = useState(true)
  const { auth, setJoiningRoom, setJoiningPath } = props


  useEffect(() => {

    fetch(url).then((data) => {

      setLoader(false)
    }).catch(err => {
      console.log(err)
    })
  }, [])
  return (
    <BrowserRouter>
      {
        loader ?

          <div class="center">
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
          </div>

          :
          <Routing auth={auth} setJoiningRoom={setJoiningRoom} setJoiningPath={setJoiningPath} />


      }
    </BrowserRouter>
  );
}



const mapStateToProps = state => {
  return {
    auth: state.userDetails.auth,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setJoiningRoom: data => {
      dispatch({
        type: 'SET_JOINING_ROOM',
        joiningRoom: data,
      })
    },
    setJoiningPath: data => {
      dispatch({
        type: 'SET_JOINING_PATH',
        joiningPath: data,
      })
    }
  }
}



export default connect(mapStateToProps, mapDispatchToProps)(App)
