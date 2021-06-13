import React, { useEffect, useRef, useState } from "react";
import Home from "./components/Home"
function App() {
  const hostRef = useRef();
  const [mic, setMic] = useState(true); //Set Mic according to user demands
  const [camera, setCamera] = useState(true); //Set Camera according to user demands
  return (
    <div className="App">
      <Home mic={mic} setMic={setMic} camera={camera} setCamera={setCamera} hostRef={hostRef}/>
    </div>
  );
}

export default App;
