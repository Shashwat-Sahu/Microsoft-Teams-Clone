import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Provider} from 'react-redux'
import Reducer from "./Reducer/Reducer"
import {createStore} from 'redux';

const store = createStore(Reducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
const token = localStorage.getItem('TeamsToken')
if (token) {
  store.dispatch({type: 'SET_AUTH', auth: true})
}
else{
  store.dispatch({type: 'SET_AUTH', auth: false})
}
const urlArray = window.location.href.split("/")
var roomIdFormat = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/;
if(roomIdFormat.test(urlArray[urlArray.length-1]))
{
  store.dispatch({type: 'SET_JOINING_ROOM', joiningRoom: urlArray[urlArray.length-1]})
}
else if(roomIdFormat.test(urlArray[urlArray.length-2]))
{
  store.dispatch({type: 'SET_JOINING_ROOM', joiningRoom: urlArray[urlArray.length-2]})
}
ReactDOM.render(
  <Provider store={store} >
    <App />
  </Provider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
