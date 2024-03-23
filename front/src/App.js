import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"

import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"
import MicIcon from "@material-ui/icons/Mic"; // Import microphone icon
import MicOffIcon from "@material-ui/icons/MicOff";
import React, { useEffect, useRef, useState } from "react";
import VideoIcon from "@material-ui/icons/VideoCall"; 
import  VideoOffIcon from "@material-ui/icons/VideoCall";

const socket = io.connect('http://localhost:5000')
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);


	const myVideo = useRef(null)
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
		  if (myVideo.current) {
            myVideo.current.srcObject = stream;
        }
		})

	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
  
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			
				userVideo.current.srcObject = stream
			
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}
  const toggleVideoStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        if (track.kind === "video") {
          track.enabled = !track.enabled;
        }
      });
      setIsVideoOn(!isVideoOn);
    }
  };
   // Function to toggle audio stream on/off
   const toggleAudioStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        if (track.kind === "audio") {
          track.enabled = !track.enabled;
        }
      });
      setIsAudioOn(!isAudioOn);
    }
  };

	return (
		<>

			<h1 style={{ textAlign: "center", color: '#fff' }}>Video Call</h1>

		<div className="container">
      
    <div className="myId">
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
				<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
					<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="secondary" onClick={leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
					{idToCall}
				</div>
        
        
        <div style={{ textAlign: "center" }}>
        {/* Toggle video icon */}
        <IconButton onClick={toggleVideoStream}>
          {isVideoOn ? (
            <VideoIcon fontSize="large" color="primary" /> // Video icon when video is on
          ) : (
            <VideoOffIcon fontSize="large" color="secondary" /> // Customized video off icon when video is off
          )}
        </IconButton>
        {/* Toggle audio icon */}
        <IconButton onClick={toggleAudioStream}>
          {isAudioOn ? (
            <MicIcon fontSize="large" color="primary" /> // Microphone icon when audio is on
          ) : (
            <MicOffIcon fontSize="large" color="secondary" /> // Customized microphone off icon when audio is off
          )}
        </IconButton>
      </div>
			</div>

			<div className="video-container">
    
				<div className="video">
					{stream &&  <video playsInline muted ref={myVideo} autoPlay style={{ width: "400px" }} />}
     
				</div>
				<div className="video">
  
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay style={{ width: "400px"}} />:
					null}
         
				</div>
			</div>

      
      <div className="form-container">
    <form className="form">
        <div className="form-group">
            <label htmlFor="patientName">Patient Name</label>
            <input type="text" id="patientName" name="patientName" />
        </div>
        <div className="form-group">
            <label htmlFor="patientId">Patient ID</label>
            <input type="text" id="patientId" name="patientId" />
        </div>
        <div className="form-group">
            <label htmlFor="prescription">Prescription</label>
            <textarea id="prescription" name="prescription"></textarea>
        </div>
        <button type="submit" className="add-prescription-btn">Add Prescription</button>
    </form>
      </div>

      
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}
			</div>
      

		</div>
 
		</>
	)
}

export default App