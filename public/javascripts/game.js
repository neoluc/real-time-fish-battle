
var socketHelper = {};
socketHelper.getRoomsInfo = function(){
	socket.emit("getRoomsInfo");
};

var socket = io.connect("", {port:8000});

socket.on("connect", function(data){
	socketHelper.getRoomsInfo();	
});

socket.on("sendRoomsInfo", function(data){
	var gameSize = data.size;
	var rooms = data.rooms;
	var divGameRooms = document.querySelector("#gameRooms");
	divGameRooms.innerHTML = "";

	for(var i=0; i<gameSize; i++){
		var div = document.createElement("div");
		var button1 = document.createElement("button");
		var button2 = document.createElement("button");
		button1.innerHTML = "player1";
		button2.innerHTML = "player2";
		button1.addEventListener("click", (function(roomId){
			return function(event){
				window.location = "/game/multiPlayer/"+roomId+"/player1";
			};
		})(i), false);
		button2.addEventListener("click", (function(roomId){
			return function(event){
				window.location = "/game/multiPlayer/"+roomId+"/player2";
			};
		})(i), false);
		if(rooms && rooms[i] && rooms[i]["player1"])
			button1.disabled = true;
		if(rooms && rooms[i] && rooms[i]["player2"])
			button2.disabled = true;
		div.appendChild(button1);
		div.appendChild(button2);
		divGameRooms.appendChild(div);
	}
});

