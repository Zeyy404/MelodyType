class BootScene extends Phaser.Scene {
    constructor() {
	super({ key: 'BootScene' });
    }

    preload() {
	this.load.image('background', 'assets/images/background.jpg');
    }

    create() {
	const width = this.scale.width;
	const height = this.scale.height;

	this.add.image(width / 2, height / 2, 'background').setOrigin(0.5).setDisplaySize(width, height);

	const titleText = this.add.text(width / 2, height / 4, 'MelodyType', { fontSize: (height * 0.08) + 'px', fill: '#fff' }).setOrigin(0.5);
	const sloganText = this.add.text(width / 2, height / 4 + 60, 'Type your way to the beat!', { fontSize: (height * 0.03) + 'px', fill: '#fff' }).setOrigin(0.5);

	const startButton = this.add.text(width / 2, height / 2, 'Start Playing', { fontSize: (height * 0.05) + 'px', fill: '#fff' }).setOrigin(0.5);
	startButton.setInteractive();
	startButton.on('pointerdown', () => {
	    this.transitionToSongSelection(titleText, sloganText);
	});
    }

    // Transition to the song selection scene
    transitionToSongSelection() {
	this.tweens.add({
	    targets: [this.titleText, this.sloganText],
	    alpha: 0,
	    duration: 500,
	    ease: 'Power2',
	    onComplete: () => {
		if (this.music) {
		    this.music.stop();
		}
		this.scene.start('SongSelectionScene');
	    }
	});
    }
}

class SongSelectionScene extends Phaser.Scene {
    constructor() {
	super({ key: 'SongSelectionScene' });
    }

    // Initialize the scene with data
    init(data) {
	this.difficulty = data.difficulty;
    }

    create() {
	const width = this.scale.width;
	const height = this.scale.height;

	this.add.image(width / 2, height / 2, 'background').setOrigin(0.5).setDisplaySize(width, height);
	this.add.text(width / 2, height / 2 - 150, `Select a Song`, { fontSize: (height * 0.06) + 'px', fill: '#fff' }).setOrigin(0.5);

	const backButton = this.add.text(20, 20, '←', { fontSize: (height * 0.06) + 'px', fill: '#fff' }).setOrigin(0.5);
	backButton.setInteractive();
	backButton.on('pointerdown', () => {
	    this.scene.start('BootScene');
	});

	const songs = [
	    { artist: 'Passenger', title: 'Let Her Go', musicUrl: 'assets/audio/Let_her_go.mp3' },
	    { artist: 'John Legend', title: 'All of Me', musicUrl: 'assets/audio/All_of_Me.mp3' },
	    { artist: 'Backstreet Boys', title: 'I Want it That Way', musicUrl: 'assets/audio/I_Want_It_That_Way.mp3' }
	];

	// Create interactive buttons for each song
	songs.forEach((song, index) => {
	    const button = this.add.text(width / 2, 250 + index * 50, `${song.artist} - ${song.title}`, { fontSize: (height * 0.04) + 'px', fill: '#fff' }).setOrigin(0.5);
	    button.setInteractive();
	    button.on('pointerdown', () => {
		this.scene.start('GameScene', song);
	    });
	});
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
	super({ key: 'GameScene' });
	this.currentIndex = 0;
	this.lyrics = [];
	this.music = null;
	this.startTime = 0;
	this.totalCharacters = 0;
	this.correctCharacters = 0;
    }

    init(data) {
	this.song = data;
    }

    preload() {
	this.load.image('background', 'assets/images/background.jpg');
    }

    create() {
	const width = this.scale.width;
	const height = this.scale.height;

	this.add.image(width / 2, height / 2, 'background').setOrigin(0.5).setDisplaySize(width, height);
	this.add.text(width / 2, 50, 'MelodyType', { fontSize: (height * 0.08) + 'px', fill: '#fff' }).setOrigin(0.5);
	this.countdownText = this.add.text(width / 2, height / 2, '', { fontSize: (height * 0.05) + 'px', fill: '#fff' }).setOrigin(0.5);

	const backButton = this.add.text(20, 20, '←', { fontSize: (height * 0.06) + 'px', fill: '#fff' }).setOrigin(0.5);
	backButton.setInteractive();
	backButton.on('pointerdown', () => {
	    this.shutdown();
	    this.scene.stop('GameScene');
	    this.scene.start('SongSelectionScene');
	});

	// Start the countdown before the game starts
	this.startCountdown(3);
	this.playMusic(this.song.musicUrl);
    }

    // Start the countdown timer
    startCountdown(timeLeft) {
	const width = this.scale.width;
	const height = this.scale.height;

	this.countdownText.setText(timeLeft);

	const countdownInterval = setInterval(() => {
	    timeLeft--;
	    this.countdownText.setText(timeLeft);

	    if (timeLeft <= 0) {
		clearInterval(countdownInterval);
		this.countdownText.destroy();
		this.startGame();
	    } else {
		this.tweens.add({
		    targets: this.countdownText,
		    scale: { from: 1.5, to: 1 },
		    duration: 1000,
		    ease: 'Cubic.easeInOut'
		});
	    }
	}, 1000);
    }

    startGame() {
	this.fetchLyrics(this.song.artist, this.song.title);
	this.input.keyboard.on('keydown', this.handleKeyPress, this);
	this.startTime = Date.now();
    }

    // Play the selected song
    playMusic(musicUrl) {
	if (this.music) {
	    this.music.stop();
	    this.music = null;
	}

	this.music = new Howl({
	    src: [musicUrl],
	    autoplay: true,
	    loop: false,
	    volume: 0.5,
	    onend: () => {
		if (this.currentIndex < this.lyrics.length) {
		    this.displayEndMessage(false);
		}
	    }
	});
	this.music.play();
    }

    // Fetch lyrics from an API
    fetchLyrics(artist, title) {
	fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`)
	    .then(response => response.json())
	    .then(data => {
		const allLyrics = data.lyrics.split('\n');
		if (allLyrics[0].startsWith('Paroles')) {
		    this.lyrics = allLyrics.slice(1);
		} else {
		    this.lyrics = allLyrics;
		}
		this.totalCharacters = this.lyrics.join('').length;
		this.displayLyrics();
	    })
	    .catch(error => console.error('Error fetching lyrics:', error));
    }

    // Display the lyrics on the screen
    displayLyrics() {
	const width = this.scale.width;
	const height = this.scale.height;

	this.scrollBox = this.add.container(width / 2, height / 2).setSize(width * 0.8, height * 0.4);
	this.scrollBox.setInteractive();

	const maskShape = this.make.graphics();
	maskShape.fillStyle(0xffffff);
	maskShape.fillRect(this.scrollBox.x - this.scrollBox.width / 2, this.scrollBox.y - this.scrollBox.height / 2, this.scrollBox.width, this.scrollBox.height);

	const mask = maskShape.createGeometryMask();
	this.scrollBox.setMask(mask);

	let startY = 0;
	this.textObjects = this.lyrics.map((line, index) => {
	    const text = this.add.text(0, startY, line, { fontSize: (height * 0.03) + 'px', fill: '#fff' }).setOrigin(0.5, 0);
	    this.scrollBox.add(text);
	    startY += text.height;
	    return text;
	});

	this.currentText = this.textObjects[this.currentIndex];
    }

    // Handle key press events
    handleKeyPress(event) {
	const inputChar = event.key;

	if (!this.currentText) return;

	const currentLine = this.lyrics[this.currentIndex];
	const currentTextObject = this.textObjects[this.currentIndex];

	if (inputChar === 'Enter') {
	    if (currentLine.trim() === '') {
		let moveDistance = currentTextObject.height;

		let nextIndex = this.currentIndex + 1;
		while (nextIndex < this.lyrics.length && this.lyrics[nextIndex].trim().length === 0) {
		    nextIndex++;
		}

		if (nextIndex < this.lyrics.length) {
		    const nextTextObject = this.textObjects[nextIndex];
		    moveDistance = nextTextObject.y - currentTextObject.y;
		}

		this.tweens.add({
		    targets: this.scrollBox,
		    y: this.scrollBox.y - moveDistance,
		    duration: 300,
		    ease: 'Power2'
		});
		this.currentIndex = nextIndex;
		this.currentText = this.textObjects[this.currentIndex];
	    } else if (this.currentIndex >= this.lyrics.length) {
		this.displayEndMessage(true);
	    }
	} else {
	    if (inputChar === currentLine.charAt(0)) {
		const newText = currentTextObject.text.substring(1);
		currentTextObject.setText(newText);
		this.lyrics[this.currentIndex] = currentLine.substring(1);
		this.correctCharacters++;
	    }
	}
    }

    displayEndMessage(userFinishedFirst) {
	const width = this.scale.width;
	const height = this.scale.height;

	this.scrollBox.removeAll(true);

	const endTime = Date.now();
	const timeTaken = ((endTime - this.startTime) / 1000).toFixed(2);
	const accuracy = ((this.correctCharacters / this.totalCharacters) * 100).toFixed(2);

	if (userFinishedFirst) {
	    this.add.text(width / 2, height / 2 - 50, `You beat the music!`, { fontSize: (height * 0.05) + 'px', fill: '#fff' }).setOrigin(0.5);
	    this.add.text(width / 2, height / 2, `Time taken: ${timeTaken} seconds`, { fontSize: (height * 0.04) + 'px', fill: '#fff' }).setOrigin(0.5);
	    this.add.text(width / 2, height / 2 + 50, `Accuracy: ${accuracy}%`, { fontSize: (height * 0.04) + 'px', fill: '#fff' }).setOrigin(0.5);
	} else {
	    this.add.text(width / 2, height / 2 - 50, `You've been beaten by the music!`, { fontSize: (height * 0.05) + 'px', fill: '#fff' }).setOrigin(0.5);
	    this.add.text(width / 2, height / 2, `Accuracy: ${accuracy}%`, { fontSize: (height * 0.04) + 'px', fill: '#fff' }).setOrigin(0.5);
	    this.add.text(width / 2, height / 2 + 50, `Keep practicing!`, { fontSize: (height * 0.04) + 'px', fill: '#fff' }).setOrigin(0.5);
	}

	this.music.stop();
	this.input.keyboard.off('keydown', this.handleKeyPress, this);
    }

    shutdown() {
	if (this.music) {
	    this.music.stop();
	    this.music = null;
	}
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
	mode: Phaser.Scale.FIT,
	autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, SongSelectionScene, GameScene]
};

const game = new Phaser.Game(config);

let music = null;
let lyrics = [];
let currentIndex = 0;

// Handle window resize
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
