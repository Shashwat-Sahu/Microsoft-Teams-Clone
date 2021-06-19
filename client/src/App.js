import React, { useEffect, useRef, useState  } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom"
import Home from "./components/Home"
import Meet from "./components/Meet"


function App(props) {

  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/teams/:teamId" component={Meet}/>
          
        <Route exact path="/" component={Home}/>
          
      </Switch>
    </BrowserRouter>
  );
}



export default App;
