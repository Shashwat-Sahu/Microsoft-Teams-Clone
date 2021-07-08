import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react';
import sendFilled from '@iconify/icons-carbon/send-filled';
import "../styles/chat.css"
import arrowRight from '@iconify/icons-akar-icons/arrow-right';
import { ProSidebar, SidebarHeader, SidebarFooter, SidebarContent } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';


const Chats = ({ chats, sendMessage, openChat, setOpenChat }) => {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)
  useEffect(() => {
    scrollToBottom()
  })
  const scrollToBottom = () => {
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }
  return (

    <ProSidebar collapsed={!openChat} rtl={true} collapsedWidth="0px" className="chat-pro-sidebar">
      <SidebarHeader>
        <div className="chat-header">
          <span
            onClick={() => { setOpenChat(!openChat) }}
          >
            <Icon icon={arrowRight} />
          </span>
          <h2>
            Chats
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="chat-pro-sidebar-content">
        {
          chats.map((chat, index) => {
            return (
              <div className={`chat-wrapper ${chat.name === "You" ? "chat-wrapper-user" : null}`}>
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
        <div ref={messagesEndRef} ></div>
      </SidebarContent>
      <SidebarFooter className="chat-pro-sidebar-footer">
        <input
          type="text"
          placeholder="Type here"
          className="chatEntry"
          onKeyPress={(e) => {
            e = e || window.event;
            if (e.key === "Enter") {
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
          onClick={() => {
            sendMessage(message);
            setMessage('')
          }} />
      </SidebarFooter>
    </ProSidebar>
  )

}


export default Chats;