import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom"
import Home from "./components/Home"
import Meet from "./components/Meet"
import {prodUrl as url} from "./Config/config.json"

function App(props) {
  const [loader, setLoader] = useState(true)
  useEffect(()=>{
    fetch(url).then((data)=>{
      
      setLoader(false)
    }).catch(err=>{
      console.log(err)
    })
  },[])
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
          <Switch>
            <Route exact path="/teams/:teamId" component={Meet} />

            <Route exact path="/" component={Home} />

          </Switch>

      }
    </BrowserRouter>
  );
}



export default App;
