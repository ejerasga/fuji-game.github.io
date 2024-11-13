var bird;
// bird gravity, will make bird fall if you don't flap
var birdGravity = 400; //800
// horizontal bird speed
var birdSpeed = 125;
// flap thrust
var birdFlapPower = 100; //300
// milliseconds between the creation of two pipes
var pipeInterval = 2500;
// hole between pipes, in pixels
var pipeHole = 120;
var pipeGroup;
var score = 0;
var scoreText;
var topScore;
var button;

var audioContext = null;
var meter = null;
var WIDTH = 500;
var HEIGHT = 50;
var rafID = null;
var gameOver = false;

var topScorers = [];
var topScorersText;

window.onload = function() {	
    //======microphone setup
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    try {
        navigator.getUserMedia = 
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

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
        alert('getUser Media threw exception :' + e);
    }

    //======game setup
    var game = new Phaser.Game(1000, 800, Phaser.CANVAS);

    var play = function(game) {}

    play.prototype = {
        preload: function() {
            game.load.image("bird", "assets/bird-2.png"); 
            game.load.image("pipe", "assets/pipe1.png");	
            game.load.image("button", "assets/start-1.png");	
            game.load.image("bg", "assets/game-bg2.png");

            // Add game over image
            game.load.image("gameOver", "assets/game-over.png");
            game.load.image("restartButton", "assets/retry.png");
        },

        create: function() {
            game.paused = true;
            // Use scale method to make the background fit the entire canvas
            var background = game.add.sprite(0, 0, 'bg');
            background.width = game.width;
            background.height = game.height;

            button = game.add.button(game.world.centerX - 95, 630, 'button', actionOnClick, this, 2, 1, 0);        

            pipeGroup = game.add.group();
            score = 0;
            topScore = localStorage.getItem("topFlappyScore") == null ? 0 : localStorage.getItem("topFlappyScore");
            scoreText = game.add.text(10, 10, "-", {
                font: "bold 32px Arial",
                fill: "#5ed2fd"  
            });

            updateScore();
            game.stage.backgroundColor = "#87CEEB";
            game.stage.disableVisibilityChange = true;
            game.physics.startSystem(Phaser.Physics.ARCADE);
            bird = game.add.sprite(80, 240, "bird");
            bird.anchor.set(0.5);
            game.physics.arcade.enable(bird);
            bird.body.gravity.y = birdGravity;

            game.time.events.loop(pipeInterval, addPipe); 
            addPipe();

            // Load top scorers from localStorage
            loadTopScorers();

            // Create text for top scorers
            topScorersText = game.add.text(game.width - 200, 10, "Top High Scorers", {
                font: "bold 24px Arial",
                fill: "#5ed2fd"
            });
            updateTopScorersDisplay();
        },

        update: function() {
            // Only allow game mechanics if game is not over
            if (!gameOver) {
                game.physics.arcade.collide(bird, pipeGroup, die);
                if (bird.y > game.height) {
                    die();
                }
            }
        },
    
        // Add a method to stop the game completely
        stopGame: function() {
            gameOver = true;
            // Stop pipe generation
            game.time.events.removeAll();
            // Stop bird movement
            bird.body.velocity.x = 0;
            bird.body.velocity.y = 0;
            bird.body.gravity.y = 0;
            // Stop pipes
            pipeGroup.forEach(function(pipe) {
                pipe.body.velocity.x = 0;
            }, this);
        }
    }
     
    game.state.add("Play", play);
    game.state.start("Play");
     
    function updateScore() {
        scoreText.text = "Score: " + score + "\nBest: " + topScore;	
    }

    function loadTopScorers() {
        var storedScorers = localStorage.getItem("topFlappyScorers");
        topScorers = storedScorers ? JSON.parse(storedScorers) : [];
    }

    function updateTopScorersDisplay() {
        var displayText = "Top High Scorers\n";
        topScorers.sort((a, b) => b.score - a.score);
        
        for (var i = 0; i < Math.min(5, topScorers.length); i++) {
            displayText += `${i + 1}. ${topScorers[i].name}: ${topScorers[i].score}\n`;
        }
        
        topScorersText.text = displayText;
    }
    
    function checkAndAddHighScore(newScore) {
        // Check if the new score qualifies for top 5
        if (topScorers.length < 5 || newScore > topScorers[topScorers.length - 1].score) {
            // Prompt for name
            var playerName = prompt("Enter your name:");
            
            if (playerName) {
                // If the list is full, remove the lowest score
                if (topScorers.length >= 5) {
                    topScorers.pop();
                }
                
                // Add new high score
                topScorers.push({ name: playerName, score: newScore });
                
                // Sort and save
                topScorers.sort((a, b) => b.score - a.score);
                localStorage.setItem("topFlappyScorers", JSON.stringify(topScorers));
                
                // Update display
                updateTopScorersDisplay();
            }
        }
    }

    function addPipe() {
        let currentPipeSpeed = -birdSpeed - (Math.floor(score / 10) * 20);
        let currentBirdGravity = birdGravity + (Math.floor(score / 10) * 50);
        
        var pipeHolePosition = game.rnd.between(100, 400 - pipeHole);
        var upperPipe = new Pipe(game, 340, pipeHolePosition - 620, currentPipeSpeed);
        game.add.existing(upperPipe);
        pipeGroup.add(upperPipe);
        var lowerPipe = new Pipe(game, 340, pipeHolePosition + pipeHole, currentPipeSpeed);
        game.add.existing(lowerPipe);
        pipeGroup.add(lowerPipe);

        bird.body.gravity.y = currentBirdGravity;
    }
	
    function die() {
        if (gameOver) return;
        
        gameOver = true;
        
        var currentTopScore = Math.max(score, topScore);
        localStorage.setItem("topFlappyScore", currentTopScore);
        
        // Check if this is a high score
        checkAndAddHighScore(score);

    
        
        // Call the stopGame method
        game.state.getCurrentState().stopGame();
        
        // Add game over image
        var gameOverImage = game.add.sprite(game.world.centerX, game.world.centerY, 'gameOver');
        gameOverImage.anchor.set(0.5);
        
        // Add restart button
        var restartButton = game.add.button(
            game.world.centerX, 
            game.world.centerY + 100, 
            'restartButton', 
            restartGame, 
            this, 2, 1, 0
        );
        restartButton.anchor.set(0.5);
    }

    
    function restartGame() {
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
        if (this.x + this.width < bird.x && this.giveScore) {
            score += 0.5;
            updateScore();
            this.giveScore = false;
        }
        if (this.x < -this.width) {
            this.destroy();
        }
    };	

    function actionOnClick() {
        console.log("GOT CLICKED FAM!");
        audioContext.resume();
        sleep(1000).then(() => {
            //do stuff
        });
        game.paused = false;
        button.visible = false;
    }
}

function flap() {
    if (!gameOver && bird && bird.body) {
        bird.body.velocity.y = -birdFlapPower;
    }
}

function didntGetStream() {
    alert('Stream generation failed.');
}

var mediaStreamSource = null;

function gotStream(stream) {
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);
    drawLoop();
}

function drawLoop(time) {
    // Add more robust volume checking
    if (!gameOver && meter && meter.volume * 50 > 15) {
        console.log("Flapping! Volume:", meter.volume * 50);
        flap();
    }
    rafID = window.requestAnimationFrame(drawLoop);
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}