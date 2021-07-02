
const Toggler = (state,setState) =>{
    setState(!state)
}

const MediaInit = async ({camera,mic,hostRef,setStream,setAudioDevices,setVideoDevices}) =>{

    // navigator.mediaDevices.enumerateDevices()
    // .then((devices) =>{
    //     console.log(devices)
    // })
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
        // if (!camera && !mic && hostRef && hostRef.current)
            
        // {
        //     hostRef.current.srcObject = null
        //     resolve(null)
        // }

                    
    })
}



export
{
    Toggler,
    MediaInit
}