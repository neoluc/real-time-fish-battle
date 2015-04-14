
// phaser object
var phaser = {};
player1 = null;
player2 = null;
computers = null;
music = null;
hitSound = null;
dieSound = null;
eatSound = null;
winSound = null;
tween1 = null;
tween2 = null;
stateText = null;
player1LifeText = null;
player2lifeText = null;
allowPlayerTouchText = null;

// our object
var info = {};
info.roomId = null;
info.playerId = null;
info.opponentSocketId = null;

info.player1 = {};
info.player1.x = null;
info.player1.y = null;
info.player1.direction = "left";
info.player1.visible = false;
info.player1.isWon = false;
info.player1.life = 0;
info.player1.protect = false;
info.player1.flash = false;
info.player1.flashTrigger = false;
info.player1.scale = 1;
info.player1.isBigger = false;

info.player2 = {};
info.player2.x = null;
info.player2.y = null;
info.player2.direction = "left";
info.player2.visible = false;
info.player2.isWon = false;
info.player2.life = 0;
info.player2.protect = false;
info.player2.flash = false;
info.player2.flashTrigger = false;
info.player2.scale = 1;
info.player2.isBigger = false;

info.start = false;
info.setPlayerXY = false;
info.allowPlayerTouch = false;

info.startGameTimer = {};
info.startGameTimer.waitSecond = 0;
info.startGameTimer.trigger = false;

info.releaseComputer = {};
info.releaseComputer.trigger = false;
info.releaseComputer.side = null;
info.releaseComputer.y = null;
info.releaseComputer.scale = null;
info.releaseComputer.speed = null;

info.sound = {};
info.sound.winTrigger = false;
info.sound.dieTrigger = false;

info.text = {};
info.text.stateText = {};
info.text.stateText.trigger = false;
info.text.stateText.content = null;



///////////////////////////////////

var game = new Phaser.Game(1024, 650, Phaser.AUTO, '', { preload: preload, create: create, update: update ,render:render});


function preload(){
	game.stage.disableVisibilityChange = true;
    game.load.image('sky','/images/background.png');
	game.load.spritesheet("computer", "/images/computerFish.png", 32, 32);
	game.load.spritesheet("player1", "/images/player1.png", 32, 32);
	game.load.spritesheet("player2", "/images/player2.png", 32, 32);
}

function create(){
	game.physics.startSystem(Phaser.Physics.ARCADE);
    background = game.add.sprite(0,0,'sky');
    background.scale.setTo(1024/916, 650/416);

    player1 = game.add.sprite(1024/2, 650/2, "player1");
    game.physics.arcade.enable(player1);
    player1.body.collideWorldBounds = true;
    player1.animations.add('left', [1], 10, true);
	player1.animations.add('right', [0], 10, true);
    player1.visible = false;

    computers = game.add.group();
    computers.enableBody = true;

	player2 = game.add.sprite(1024/2, 650/2, 'player2');
    game.physics.arcade.enable(player2);
    player2.body.collideWorldBounds = true;
	player2.animations.add('right', [2], 10, true);
    player2.animations.add('left', [3], 10, true);
	player2.animations.add("rightBig", [4], 10, true);
	player2.animations.add("leftBig", [5], 10, true);
    player2.animations.add('rightSmall', [0], 10, true);
    player2.animations.add('leftSmall', [1], 10, true);
	player2.visible = false;

	stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '84px Arial', fill: '#fff' });
    stateText.anchor.setTo(0.5, 0.5);
	stateText.visible = false;

}

function update(){
	game.physics.arcade.overlap(player1, computers, playerTouchComputer, null, this);


	if(info.start){
		if(info.player1.visible && info.player2.visible){
			player1.visible = true;
			player2.visible = true;
		}
		if(info.setPlayerXY){
			player1.x = info.player1.x;
			player1.y = info.player1.y;
			player2.x = info.player2.x;
			player2.y = info.player2.y;
			info.player1.setXY = false;
		}

		socketHelper.sendPlayerInfo();
		player2.x = info.player2.x;
		player2.y = info.player2.y;
		player2.animations.play(info.player2.direction);
		player2.scale.setTo(info.player2.scale, info.player2.scale);
	}
	if(info.text.stateText.visible){
		stateText.visible = true;
		stateText.text = info.text.stateText.content;
	}else{
		stateText.visible = false;
	}




	if(game.input.keyboard.isDown(Phaser.Keyboard.LEFT)){
		player1.x -= 5;
		player1.animations.play("left");
		info.player1.direction = "left";
	}else if(game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)){
		player1.x += 5;
		player1.animations.play("right");
		info.player1.direction = "right";
	}

	if(game.input.keyboard.isDown(Phaser.Keyboard.UP)){
		player1.y -= 5;
	}else if(game.input.keyboard.isDown(Phaser.Keyboard.DOWN)){
		player1.y += 5;
	}
	info.player1.x = player1.x;
	info.player1.y = player1.y;




}

function render(){

}

function playerTouchComputer(player, computers){

}

function playerTouchPlayer(){

}

///////////////////////////////////////////////

info.initializeGameId = function(){
	var pathName = window.location.pathname;
	var array = pathName.split("/");
	info.roomId = array[array.length-2];
	info.playerId = array[array.length-1];
};


var socketHelper = {};
socketHelper.joinRoom = function(){
	var roomId = info.roomId;
	var playerId = info.playerId;
	socket.emit("joinRoom", {roomId: roomId, playerId: playerId});
};
socketHelper.sendPlayerInfo = function(){
	var x = info.player1.x;
	var y = info.player1.y;
	var direction = info.player1.direction;
	var scale = info.player1.scale;
	var opponentId = info.opponentSocketId;
	socket.emit("sendPlayerInfo", {x: x, y: y, direction: direction, scale: scale, opponentId: opponentId});
};


var socket = io.connect("", {port:8000});

socket.on("connect", function(data){
	info.initializeGameId();
	socketHelper.joinRoom();
});

socket.on("notifyStartGame", function(data){
	info.text.stateText.visible = false;
	info.player1.visible = true;
	info.player2.visible = true;
	info.opponentSocketId = data.opponentId;
	info.player1.x = 1024/2;
	info.player1.y = data.player1Y;
	info.player2.x = 1024/2;
	info.player2.y = data.player2Y;
	info.setPlayerXY = true;
	info.start = true;
});

socket.on("notifyJoinFail", function(data){
	info.text.stateText.content = "join room failed\nplayer has been taken\nplease leave the room";
	info.text.stateText.visible = true;
});

socket.on("notifyWaitOpponent", function(data){
	info.text.stateText.content = "waiting opponent to join";
	info.text.stateText.visible = true;
});

socket.on("notifyOpponentInfo", function(data){
	info.player2.x = data.x;
	info.player2.y = data.y;
	info.player2.direction = data.direction;
	info.player2.scale = data.scale;
});