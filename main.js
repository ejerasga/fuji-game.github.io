
var bird;
    // bird gravity, will make bird fall if you don't flap
var birdGravity = 500; //800
    // horizontal bird speed
var birdSpeed = 125;
    // flap thrust
var birdFlapPower = 100; //300
    // milliseconds between the creation of two pipes
var pipeInterval = 2000;
    // hole between pipes, in puxels
var pipeHole = 120;
var pipeGroup;
var score=0;
var scoreText;
var topScore;
var button;


var audioContext = null;
var meter = null;
// var canvasContext = null;
var WIDTH=500;
var HEIGHT=50;
var rafID = null;

window.onload = function() {	
//======microphone shit
    // monkeypatch Web Audio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
	
    // grab an audio context
    audioContext = new AudioContext();

    // Attempt to get audio input
    try {
        // monkeypatch getUserMedia
        navigator.getUserMedia = 
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;

        // ask for an audio input
        navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, didntGetStream);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }

//======game shit
    var game = new Phaser.Game(1000, 800, Phaser.CANVAS);
    var play = function(game){}
     
    play.prototype = {
		preload:function(){
			game.load.image("bird", "assets/bird-2.png"); 
			game.load.image("pipe", "assets/pipe1.png");	
            game.load.image("button", "assets/start-1.png");	
            game.load.image("bg", "assets/game-bg2.png");
            
            // sound files
            game.load.audio('backgroundMusic', 'assets/background-music.mp3');
            game.load.audio('startSound', 'assets/Sounds/game-start.mp3');
            game.load.audio('scoreSound', 'assets/score-sound.mp3');
            game.load.audio('gameOverSound', 'assets/Sounds/game-over.mp3');
        },

		create:function(){
            game.paused = true
            // Use scale method to make the background fit the entire canvas
            background = game.add.sprite(0, 0, 'bg');
            background.width = game.width;
            background.height = game.height;
            
            button = game.add.button(game.world.centerX - 95, 650, 'button', actionOnClick, this, 2, 1, 0);        

			pipeGroup = game.add.group();
			score = 0;
			topScore = localStorage.getItem("topFlappyScore")==null?0:localStorage.getItem("topFlappyScore");
			scoreText = game.add.text(10,10,"-",{
				font:"bold 32px Arial",
                fill: "#5ed2fd"  
            });

			updateScore();
			game.stage.backgroundColor = "#87CEEB";
			game.stage.disableVisibilityChange = true;
			game.physics.startSystem(Phaser.Physics.ARCADE);
			bird = game.add.sprite(80,240,"bird");
			bird.anchor.set(0.5);
			game.physics.arcade.enable(bird);
			bird.body.gravity.y = birdGravity;
            // game.input.onDown.add(flap, this);
            // game input

			game.time.events.loop(pipeInterval, addPipe); 
			addPipe();

            // Initialize sounds
            this.backgroundMusic = game.add.audio('backgroundMusic');
            this.startSound = game.add.audio('startSound');
            this.scoreSound = game.add.audio('scoreSound');
            this.gameOverSound = game.add.audio('gameOverSound');

            // Optional: Loop background music
            this.backgroundMusic.loop = true;
		},
		update:function(){
			game.physics.arcade.collide(bird, pipeGroup, die);
			if(bird.y>game.height){
				die();
			}	
		}
	}
     
    game.state.add("Play",play);
    game.state.start("Play");
     
    function updateScore(){
		scoreText.text = "Score: "+score+"\nBest: "+topScore;	
	}
     
	// function flap(){
	// 	bird.body.velocity.y = -birdFlapPower;	
	// }
	
	function addPipe(){
		var pipeHolePosition = game.rnd.between(100, 400-pipeHole);
		var upperPipe = new Pipe(game,340,pipeHolePosition-620,-birdSpeed);
		game.add.existing(upperPipe);
		pipeGroup.add(upperPipe);
		var lowerPipe = new Pipe(game,340,pipeHolePosition+pipeHole,-birdSpeed);
		game.add.existing(lowerPipe);
        pipeGroup.add(lowerPipe);

    }
	
	function die(){
		localStorage.setItem("topFlappyScore", Math.max(score, topScore));	
		location.reload();	
	}
	
	Pipe = function (game, x, y, speed) {
		Phaser.Sprite.call(this, game, x, y, "pipe");
		game.physics.enable(this, Phaser.Physics.ARCADE);
		this.body.velocity.x = speed;
		this.giveScore = true;	
	};
	
	Pipe.prototype = Object.create(Phaser.Sprite.prototype);
	Pipe.prototype.constructor = Pipe;
	
	Pipe.prototype.update = function() {
		if(this.x+this.width<bird.x && this.giveScore){
			score+=0.5;
			updateScore();
			this.giveScore = false;
		}
		if(this.x<-this.width){
			this.destroy();
		}
    };	

    function actionOnClick () {
        console.log("GOT CLICKED FAM!");
        audioContext.resume();
        sleep(1000).then(() => {
        //do stuff
        })
        game.paused = false
        button.visible = false

    }
}

function flap(){
		bird.body.velocity.y = -birdFlapPower;	
}
// function flap(){
//     // console.log("flap vol: " + -Math.floor(volume))
//     // bird.body.velocity.y = bird.body.velocity.y - Math.floor(volume);	
// }

function didntGetStream() {
    alert('Stream generation failed.');
}

var mediaStreamSource = null;

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Create a new volume meter and connect it.
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);



    // kick off the visual updating
    drawLoop();
}

function drawLoop( time ) {
    if(meter.volume* 50 > 10) {
        flap()
    }

    // set up the next visual callback
    rafID = window.requestAnimationFrame( drawLoop );
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
