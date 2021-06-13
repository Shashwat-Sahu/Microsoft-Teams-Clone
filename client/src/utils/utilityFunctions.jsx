const Toggler = (state,setState) =>{
    setState(!state)
}

const MediaInit = (camera,mic,hostRef) =>{
        
        (camera || mic) && navigator.mediaDevices.getUserMedia({
            audio: mic,
            video: camera
        }).then(stream => {
            if (hostRef && hostRef.current)
                hostRef.current.srcObject = stream
        })
        if (!camera && !mic && hostRef && hostRef.current)
            hostRef.current.srcObject = null
        
}

export
{
    Toggler,
    MediaInit
}