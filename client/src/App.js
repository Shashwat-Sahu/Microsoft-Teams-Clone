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

const Routing = (props) =>{
  const history = useHistory();
  const {auth} = props

  useEffect(()=>{
    if(!auth)
    history.push("/signin")
  },[])
  return (
    <>
    {
      !auth
    ? <Switch>

      <Route exact path="/signup" component={SignUp} />
      <Route  path="/signin" component={SignIn} />

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
  const { auth } = props

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
        <Routing auth={auth}/>
        

      }
    </BrowserRouter>
  );
}



const mapStateToProps = state => {
  return {
    auth: state.userDetails.auth,
  }
}





export default connect(mapStateToProps, undefined)(App)
