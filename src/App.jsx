import { useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("ws://localhost:8080");

function App() {
	const localVideoRef = useRef();
	const remoteVideoRef = useRef();
	const pc = useRef();
	const textRef = useRef();
	const candidatesRef = useRef([]);

	const createOffer = () => {
		pc.current
			.createOffer({
				offerToReceiveAudio: 1,
				offerToReceiveVideo: 1,
			})
			.then((sdp) => {
				console.log(JSON.stringify(sdp));
				pc.current.setLocalDescription(sdp);

				socket.emit("sdp", {sdp})
			})
			.catch((e) => console.log(e));
	};

	const createAnswer = () => {
		pc.current
			.createAnswer({
				offerToReceiveAudio: 1,
				offerToReceiveVideo: 1,
			})
			.then((sdp) => {
				console.log(JSON.stringify(sdp));
				pc.current.setLocalDescription(sdp);

				socket.emit("sdp", {sdp})
			})
			.catch((e) => console.log(e));
	};

	const setRemoteDescription = () => {
		const sdp = JSON.parse(textRef.current.value);
		console.log(sdp);

		pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
		addCandidate();
	};

	const addCandidate = () => {
		candidatesRef.current.forEach(candidate => {
			console.log(candidate);
			pc.current.addIceCandidate(new RTCIceCandidate(candidate));
		})
	};

	useEffect(() => {
		socket.on("connection-success", success => {
			console.log(success);
		})

		socket.on("sdp", data => {
			console.log(data);
			textRef.current.value = JSON.stringify(data.sdp)
		})

		socket.on("candidate", candidate => {
			console.log("candidate", candidate);
			try {
				candidatesRef.current = [...candidatesRef.current, candidate]
			} catch (error) {
				console.log("kaputt", error);
			}
			console.log("candRef", candidatesRef.current);
		})

		const _pc = new RTCPeerConnection(null);
		const constraints = {
			audio: false,
			video: true,
		};

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then((stream) => {
				localVideoRef.current.srcObject = stream;
				stream.getTracks().forEach((track) => {
					_pc.addTrack(track, stream);
				});
			})
			.catch((e) => console.log(e));

		_pc.onicecandidate = (e) => {
			if (e.candidate) {
				console.log(JSON.stringify(e.candidate));
				socket.emit("candidate", e.candidate)
			}
		};

		_pc.oniceconnectionstatechange = (e) => {
			console.log(e);
		};

		_pc.ontrack = (e) => {
			remoteVideoRef.current.srcObject = e.streams[0];
		};

		pc.current = _pc;
	}, []);

	return (
		<div style={{ padding: 16 }}>
			<div>
				<video
					style={{
						width: 240,
						height: 240,
						margin: 5,
						backgroundColor: "black",
					}}
					ref={localVideoRef}
					autoPlay
				></video>
				<video
					style={{
						width: 240,
						height: 240,
						margin: 5,
						backgroundColor: "black",
					}}
					ref={remoteVideoRef}
					autoPlay
				></video>
			</div>
			<div>
				<h3>How to connect to other peer:</h3>
				<ol>
					<li>"Create Offer" on peer A</li>
					<li>"Set Remote Description" on peer B</li>
					<li>"Create Answer" on peer B</li>
					<li>"Set Remote Description" on peer A</li>
				</ol>
				<hr />
				<button onClick={createOffer}>Create Offer</button>
				<button onClick={setRemoteDescription}>
					Set Remote Description
				</button>
				<button onClick={createAnswer}>Create Answer</button>
				<button disabled onClick={addCandidate}>Add Candidates</button>
				<br />
				<textarea style={{width: "100%"}} disabled ref={textRef} />
			</div>
		</div>
	);
}

export default App;
