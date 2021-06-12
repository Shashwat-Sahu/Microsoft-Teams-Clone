import React from "react"
import "../styles/userWindow.css"
const UserWindow = ({hostRef,style}) => {

    return (
            <video ref={hostRef} style={style} muted autoPlay playsInline />
        )
}

export default UserWindow