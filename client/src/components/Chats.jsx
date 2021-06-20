import React,{useEffect, useState} from 'react'
import { Icon } from '@iconify/react';
import sendFilled from '@iconify/icons-carbon/send-filled';
import "../styles/chat.css"
import arrowDown from '@iconify/icons-akar-icons/arrow-down';
import arrowRight from '@iconify/icons-akar-icons/arrow-right';



const Chats = ({chats,sendMessage,openChat,setOpenChat}) =>{
    const [message, setMessage] = useState('')
    
    useEffect(()=>{
        var ele = document.getElementById("chat-section");
        if(!openChat)
        {
            ele.style.animation="slide-left 1s ease-in-out forwards"
            document.getElementsByClassName('members-with-config')[0].style.animation="meet-slide-right 1s ease-in-out forwards"
        }
        else
        {
            ele.style.animation="slide-right 1s ease-in-out forwards"
            document.getElementsByClassName('members-with-config')[0].style.animation="meet-slide-left 1s ease-in-out forwards"   
        }
        
    },[openChat])
    return(
        <div className="chat-section" id="chat-section">
          <div className="chat-header"><span onClick={()=>{setOpenChat(!openChat)}}><Icon icon={arrowRight}/></span><h2>Chats</h2></div>
          <div className="chat-outer-wrapper">
          {
            chats.map((chat, index) => {
              return(
              <div className="chat-wrapper">
                <div className="chat-member-name">
                  {chat.name}
                </div>
                <div className="chat-message">
                  {chat.message}
                </div>
              </div>
              )
            })
          }
          </div>
          <div className="chat-bottom-options">
            <input
              type="text"
              placeholder="Type here"
              className="chatEntry"
              onKeyPress={(e)=>{
                e = e || window.event;
                if(e.key=="Enter")
                {
                    sendMessage(message);
                    setMessage("")
                }
              }}
              onChange={(e) => {
                setMessage(e.target.value)
              }}
              value={message}
            />
            <Icon 
            icon={sendFilled} 
            onClick={()=>{
            sendMessage(message);
            setMessage('')
            }} />
          </div>
        </div>
    )

}


export default Chats;