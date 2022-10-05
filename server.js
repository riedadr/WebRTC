const express = require("express");
var cors = require("cors");
const app = express();
app.use(cors());

const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

app.get("/", (req, res) => {
	res.send("Moin");
});

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);

	socket.emit("connection-success", {
		status: "connection-success",
		socketId: socket.id,
	});

	socket.on("sdp", (data) => {
		console.log(data);
		socket.broadcast.emit("sdp", data);
	});

	socket.on("candidate", (data) => {
		console.log(data);
		socket.broadcast.emit("candidate", data);
	});

	socket.on("disconnect", () => {
		console.log("disconnectd", socket.id);
	});
});

server.listen(8080, () => {
	console.log("listening on *:8080");
});
