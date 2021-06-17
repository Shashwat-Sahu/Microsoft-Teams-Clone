import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom"
import Home from "./components/Home"
import Meet from "./components/Meet"
function App() {

  const [mic, setMic] = useState(false); //Set Mic according to user demands
  const [camera, setCamera] = useState(false); //Set Camera according to user demands
  const [stream, setStream] = useState(null); 
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/teams/:TeamId">
          <Meet mic={mic} setMic={setMic} camera={camera} setCamera={setCamera} setStream={setStream} stream={stream}/>
        </Route>
        <Route exact path="/">
          <Home mic={mic} setMic={setMic} camera={camera} setCamera={setCamera} setStream={setStream} stream={stream}/>
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
