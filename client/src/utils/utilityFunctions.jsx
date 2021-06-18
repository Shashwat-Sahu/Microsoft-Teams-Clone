
const Toggler = (state,setState) =>{
    setState(!state)
}

const MediaInit = async ({camera,mic,hostRef,setStream}) =>{

        return await new Promise((resolve,reject) =>{

         navigator.mediaDevices.getUserMedia({
            audio: true,
            video:true
        }).then(stream => {
            if (hostRef && hostRef.current)    
            {
                hostRef.current.srcObject = stream;
                setStream(stream);
                resolve(stream);
            }
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