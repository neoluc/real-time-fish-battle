
var player;
var computers;

var game = new Phaser.Game(1024, 768, Phaser.AUTO, "", {preload: preload, create: create, update: update, render: render});

function preload(){
	game.stage.disableVisibilityChange = true;
    game.load.image('sky','/images/background.png');
	game.load.spritesheet("computerFish", "/images/computerFish.png", 32, 32);
	game.load.spritesheet("fishPlayer", "/images/player1.png", 32, 32);
}

function create(){
	//background
	game.physics.startSystem(Phaser.Physics.ARCADE);
    background = game.add.sprite(0,0,'sky');
    background.scale.setTo(1024/916, 650/416);

    player = game.add.sprite(1024/2, 768/2, "fishPlayer");
    game.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;
    player.animations.add('left', [1], 10, true);
	player.animations.add('right', [0], 10, true);
    player.visible = true;

    computers = game.add.group();
    computers.enableBody = true;


}

function update(){
	game.physics.arcade.overlap(player, computers, playerTouchComputer, null, this);

	if(game.input.keyboard.isDown(Phaser.Keyboard.LEFT)){
		player.x -= 5;
		player.animations.play("left");
	}else if(game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)){
		player.x += 5;
		player.animations.play("right");
	}

	if(game.input.keyboard.isDown(Phaser.Keyboard.UP)){
		player.y -= 5;
	}else if(game.input.keyboard.isDown(Phaser.Keyboard.DOWN)){
		player.y += 5;
	}

}

function render(){

}

function playerTouchComputer(){

}