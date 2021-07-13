
const Toggler = (state,setState) =>{
    setState(!state)
}

// Initialise media
const MediaInit = async ({camera,mic,hostRef,setStream,setAudioDevices,setVideoDevices}) =>{

        return await new Promise((resolve,reject) =>{

         navigator.mediaDevices.getUserMedia({
            audio: true,
            video:true
        }).then(stream => {
            if (hostRef && hostRef.current)    
            {
                hostRef.current.srcObject = stream;
                
                resolve(stream);
            }
        }).catch(error=>{
            reject(error);
        })

                    
    })
}



export
{
    Toggler,
    MediaInit
}