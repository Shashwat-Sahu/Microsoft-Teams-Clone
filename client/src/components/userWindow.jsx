import React from "react"
import "../styles/userWindow.css"
const UserWindow = ({hostRef,style,muted}) => {

    return (
            <video ref={hostRef} style={style} muted={muted} autoPlay playsInline/>
        )
}

export default UserWindow