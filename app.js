
// config
var config = {};
config.sessionSecret = "akefoew";
config.dbName = "414project3";
config.game = {
	size: 10,
	life: 5,
	width: 1024,
	height: 650
};
/**
 * Module dependencies.
 */

var express = require('express');
var socketIo = require("socket.io");
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.session({
	secret: config.sessionSecret
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// homeController
var homeController = {};
homeController.getIndex = function(req, res) {
	res.redirect("/game");
};

// gameController
var gameController = {};
gameController.getIndex = function(req, res) {
	res.render("game");
};
gameController.getMultiPlayer = function(req, res) {
	res.render("multiPlayer");
};
gameController.getSingelPlayer = function(req, res) {
	res.render("singlePlayer");
};

// routes
app.get('/', homeController.getIndex);
app.get("/game", gameController.getIndex);
app.get("/game/singlePlayer", gameController.getSingelPlayer);
app.get("/game/multiPlayer/:id/:player", gameController.getMultiPlayer);


// roomHelper
var roomHelper = {};
roomHelper.rooms = {};
roomHelper.getAllRooms = function() {
	return roomHelper.rooms;
};
roomHelper.addPlayerToRoom = function(roomId, playerId, playerSocketId, callback) { //callback(isSuccess)
	if (playerId!="player1" && playerId!="player2")
		return callback(false);
	roomHelper.rooms[roomId] = roomHelper.rooms[roomId] ? roomHelper.rooms[roomId] : {};
	if (!roomHelper.rooms[roomId][playerId]) {
		roomHelper.rooms[roomId][playerId] = playerSocketId;
		return callback(true);
	} else {
		return callback(false);
	}
};
roomHelper.removePlayerFromRoom = function(socketId) {
	var rooms = roomHelper.rooms;
	for(var roomId in rooms) {
		var players = rooms[roomId];
		for(var playerId in players) {
			var playerSocketId = players[playerId];
			if (socketId == playerSocketId) {
				delete roomHelper.rooms[roomId][playerId];
				break;
			}
		}
	}
};
roomHelper.isRoomFull = function(roomId, callback) { // callback(err,isFull)
	var rooms = roomHelper.rooms;
	var players = rooms[roomId];
	if (!players) {
		return callback(true);
	} else {
		var count = 0;
		for(var playerId in players) {
			if (players[playerId]) {
				count++;
			}
		}
		if (count < 2) {
			return callback(null, false);
		} else {
			return callback(null, true);
		}
	}
};
roomHelper.returnOpponentId = function(roomId, playerId, callback) { //callback(err,opponentId)
	var rooms = roomHelper.rooms;
	var players = rooms[roomId];
	if (!players) {
		return callback(true);
	}
	var playerSocketId = playerId=="player1"?players["player2"]:players["player1"];
	if (!playerSocketId) {
		return callback(false);
	} else {
		return callback(null, playerSocketId);
	}

};


// life helper functions
var lifeHelper = {};
lifeHelper.players = {};
lifeHelper.initPlayer = function(socketId) {
	lifeHelper.players[socketId] = config.game.life;
};
lifeHelper.removePlayer = function(socketId) {
	if (lifeHelper.players[socketId])
		delete lifeHelper.players[socketId];
};
lifeHelper.minusOne = function(socketId, callback) {
	if (!lifeHelper.players[socketId])
		return callback(null);
	lifeHelper.players[socketId]--;
	return callback(lifeHelper.players[socketId]);
};

// socket helper functions
var socketHelper = {};
socketHelper.clients = {};
socketHelper.clients.addSocket = function(socket) {
	socketHelper.clients[socket.id] = socket;
};
socketHelper.clients.removeSocketById = function(socketId) {
	delete socketHelper.clients[socketId];
};
socketHelper.clients.returnSocketById = function(socketId) {
	return socketHelper.clients[socketId];
};
socketHelper.events = {};
socketHelper.events.sendRoomsInfo = function(socket) {
	if (socket)
		socket.emit("sendRoomsInfo", {size: config.game.size, rooms: roomHelper.getAllRooms()});
};
socketHelper.events.sendRoomsInfoToAllClients = function() {
	io.sockets.emit("sendRoomsInfo", {size: config.game.size, rooms: roomHelper.getAllRooms()});
};
socketHelper.events.notifyJoinFail = function(socket) {
	if (socket)
		socket.emit("notifyJoinFail");
};
socketHelper.events.notifyWaitOpponent = function(socket) {
	if (socket)
		socket.emit("notifyWaitOpponent");
};
socketHelper.events.notifyStartGame = function(socket, opponentId, player1Y, player2Y) {
	if (socket)
		socket.emit("notifyStartGame", {opponentId: opponentId, player1Y: player1Y, player2Y: player2Y});
};
socketHelper.events.notifyOpponentInfo = function(opponentId, x, y, direction, scale) {
	var soc = socketHelper.clients.returnSocketById(opponentId);
	if (soc)
		soc.emit("notifyOpponentInfo", {x: x, y: y, direction: direction, scale: scale});
};


// start socketio server
var io = socketIo.listen(8000);
io.on("connection", function(socket) {
	socketHelper.clients.addSocket(socket);
	socket.on("getRoomsInfo", function(data) {
		socketHelper.events.sendRoomsInfo(socket);
	});
	socket.on("joinRoom", function(data) {
		var roomId = data.roomId;
		var playerId = data.playerId;
		var socketId = socket.id;
		roomHelper.addPlayerToRoom(roomId, playerId, socketId, function(isSuccess) {
			if (isSuccess) {
				socketHelper.events.sendRoomsInfoToAllClients();				
				roomHelper.isRoomFull(roomId, function(err, isFull) {
					if (isFull) {
						roomHelper.returnOpponentId(roomId, playerId, function(err, opponentId) {
							if (opponentId) {
								var opponentSoc = socketHelper.clients.returnSocketById(opponentId);
								if (opponentSoc && socket) {
									var player1Y = randomNum(100, config.game.height - 100);
									var player2Y = randomNum(100, config.game.height - 100);
									socketHelper.events.notifyStartGame(opponentSoc, socketId, player1Y, player2Y);
									socketHelper.events.notifyStartGame(socket, opponentId, player2Y, player1Y);
								}
							}
						});
					} else {
						socketHelper.events.notifyWaitOpponent(socket);						
					}
				});
			} else {
				socketHelper.events.notifyJoinFail(socket);
			}
		});
	});

	socket.on("sendPlayerInfo", function(data) {
		var scale = data.scale;
		var direction = data.direction;
		var x = data.x;
		var y = data.y;
		var opponentId = data.opponentId;
		socketHelper.events.notifyOpponentInfo(opponentId, x, y, direction, scale);
	});

	socket.on("disconnect", function() {
		var socketId = socket.id;
		lifeHelper.removePlayer(socketId);
		roomHelper.removePlayerFromRoom(socketId);
		socketHelper.clients.removeSocketById(socketId);
		socketHelper.events.sendRoomsInfoToAllClients();				
	});
});

// start express server
http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});


function randomNum(min,max)
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}