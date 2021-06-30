import React, { useEffect, useState,useRef } from 'react'
import { Icon } from '@iconify/react';
import sendFilled from '@iconify/icons-carbon/send-filled';
import "../styles/transcript.css"
import arrowLeft from '@iconify/icons-akar-icons/arrow-left';
import { ProSidebar, SidebarHeader, SidebarFooter, SidebarContent } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';



const Transcript = ({  transcriptsRef, openTranscripts, setOpenTranscripts }) => {
  const [message, setMessage] = useState('') 


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
            console.log(transcriptsRef.current)
          return(
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
        </SidebarContent>
        
    </ProSidebar>
  )

}


export default Transcript
