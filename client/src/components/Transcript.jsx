import React, { useRef,useEffect } from 'react'
import { Icon } from '@iconify/react';
import "../styles/transcript.css"
import arrowLeft from '@iconify/icons-akar-icons/arrow-left';
import { ProSidebar, SidebarHeader, SidebarContent } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';



const Transcript = ({ transcriptsRef, openTranscripts, setOpenTranscripts }) => {
  const messagesEndRef = useRef(null)
  useEffect(() => {
    scrollToBottom()
  })
  const scrollToBottom = () => {
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }
  return (

    <ProSidebar collapsed={!openTranscripts} rtl={true} collapsedWidth="0px" className="transcript-pro-sidebar">
      <SidebarHeader>
        <div className="transcript-header">
          <span
            onClick={() => { setOpenTranscripts(!openTranscripts) }}
          >
            <Icon icon={arrowLeft} />
          </span>
          <h2>
            Transcript
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="transcript-pro-sidebar-content">
        {
          transcriptsRef.current.map((transcript, index) => {
            return (
              <div className={`transcript-wrapper`}>
                <span className="transcript-member-name">
                  {transcript.name} :
                </span>
                <span className="transcript-message">
                  {transcript.message}
                </span>
              </div>
            )
          })
        }
        <div ref={messagesEndRef} ></div>
      </SidebarContent>

    </ProSidebar>
  )

}


export default Transcript
