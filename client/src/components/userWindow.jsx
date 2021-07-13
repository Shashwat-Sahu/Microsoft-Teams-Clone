import React from "react"
import "../styles/userWindow.css"
const UserWindow = ({hostRef,style,muted,id}) => {

    return (
        // Video component
            <video ref={hostRef} style={style} muted={muted} id={id} autoPlay playsInline/>
            
        )
}

export default UserWindow