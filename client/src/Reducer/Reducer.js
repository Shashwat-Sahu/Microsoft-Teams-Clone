import { combineReducers } from 'redux'
// store user details
var initState = {
    userId: null,
    name: '',
    email: '',
    mic: false,
    camera: false,
    stream: null,
    videoDevices: [],
    audioDevices: [],
    auth: false,
    socket: null,
    joiningRoom: null,
    joiningPath: null
}

const userDetailsReducer = (state = initState, action) => {
    if (action.type === 'SET_USER_ID') {
        return {
            ...state,
            userId: action.userId
        }
    }
    if (action.type === 'SET_SOCKET') {
        return {
            ...state,
            socket: action.socket
        }
    }
    if (action.type === 'SET_AUTH') {
        return {
            ...state,
            auth: action.auth
        }
    }
    if (action.type === 'SET_NAME') {
        return {
            ...state,
            name: action.name
        }
    }
    if (action.type === 'SET_EMAIL') {
        return {
            ...state,
            email: action.email
        }
    }
    if (action.type === 'SET_MIC') {
        return {
            ...state,
            mic: action.mic
        }
    }
    if (action.type === 'SET_CAMERA') {
        return {
            ...state,
            camera: action.camera
        }
    }
    if (action.type === 'SET_STREAM') {
        return {
            ...state,
            stream: action.stream
        }
    }
    if (action.type === 'SET_VIDEO_DEVICES') {
        return {
            ...state,
            videoDevices: action.videoDevices
        }
    }
    if (action.type === 'SET_AUDIO_DEVICES') {
        return {
            ...state,
            audioDevices: action.audioDevices
        }
    }
    if (action.type === 'SET_JOINING_ROOM') {
        return {
            ...state,
            joiningRoom: action.joiningRoom
        }
    }
    if (action.type === 'SET_JOINING_PATH') {
        return {
            ...state,
            joiningPath: action.joiningPath
        }
    }
    return state
}

const Reducer = combineReducers({
    userDetails: userDetailsReducer
})

export default Reducer;