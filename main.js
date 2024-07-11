class BootScene extends Phaser.Scene {
    constructor() {
	super({ key: 'BootScene' });
    }

    preload() {
	this.load.image('background', 'assets/images/background.jpg');
    }

    create() {
	this.scene.start('TitleScene');
    }
}

class TitleScene extends Phaser.Scene {
    constructor() {
	super({ key: 'TitleScene' });
    }

    create() {
	const width = this.scale.width;
	const height = this.scale.height;

	this.add.image(width / 2, height / 2, 'background').setOrigin(0.5).setDisplaySize(width, height);
	this.add.text(width / 2, height / 2 - 100, 'MelodyType', { fontSize: (height * 0.08) + 'px', fill: '#fff' }).setOrigin(0.5);
	const startButton = this.add.text(width / 2, height / 2, 'Start Playing', { fontSize: (height * 0.04) + 'px', fill: '#fff' }).setOrigin(0.5);
	startButton.setInteractive();
	startButton.on('pointerdown', () => {
	    startButton.setTint(0x808080);
	    this.scene.start('DifficultyMenuScene');
	});
    }
}

class DifficultyMenuScene extends Phaser.Scene {
    constructor() {
	super({ key: 'DifficultyMenuScene' });
    }

    create() {
	const width = this.scale.width;
	const height = this.scale.height;

	this.add.image(width / 2, height / 2, 'background').setOrigin(0.5).setDisplaySize(width, height);
	this.add.text(width / 2, height / 2 - 150, 'Choose Difficulty', { fontSize: (height * 0.06) + 'px', fill: '#fff' }).setOrigin(0.5);

	const difficulties = ['Easy', 'Medium', 'Hard'];
	difficulties.forEach((difficulty, index) => {
	    const button = this.add.text(width / 2, height / 2 - 100 + index * 50, difficulty, { fontSize: (height * 0.04) + 'px', fill: '#fff' }).setOrigin(0.5);
	    button.setInteractive();
	    button.on('pointerdown', () => {
		button.setTint(0x808080);
		this.scene.start('SongSelectionScene', { difficulty });
	    });
	});
    }
}

class SongSelectionScene extends Phaser.Scene {
    constructor() {
	super({ key: 'SongSelectionScene' });
    }

    init(data) {
	this.difficulty = data.difficulty;
    }

    create() {
	const width = this.scale.width;
	const height = this.scale.height;

	this.add.image(width / 2, height / 2, 'background').setOrigin(0.5).setDisplaySize(width, height);
	this.add.text(width / 2, height / 2 - 150, `Songs (${this.difficulty})`, { fontSize: (height * 0.06) + 'px', fill: '#fff' }).setOrigin(0.5);

	const songs = [
	    { artist: 'Passenger', title: 'Let Her Go', musicUrl: 'assets/audio/Let_her_go.mp3', difficulty: 'Easy' },
	    { artist: 'Artist2', title: 'Song2', musicUrl: 'path/to/instrumental2.mp3', difficulty: 'Medium' },
	    { artist: 'Artist3', title: 'Song3', musicUrl: 'path/to/instrumental3.mp3', difficulty: 'Hard' }
	];

	const filteredSongs = songs.filter(song => song.difficulty === this.difficulty);

	filteredSongs.forEach((song, index) => {
	    const button = this.add.text(width / 2, height / 2 - 100, `${song.artist} - ${song.title}`, { fontSize: (height * 0.04) + 'px', fill: '#fff' }).setOrigin(0.5);
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

	this.startCountdown(3);
	this.playMusic(this.song.musicUrl);
    }

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
	    }
	}, 1000);
    }

    startGame() {
	this.fetchLyrics(this.song.artist, this.song.title);
	this.input.keyboard.on('keydown', this.handleKeyPress, this);
    }

    playMusic(musicUrl) {
	music = new Howl({
	    src: [musicUrl],
	    autoplay: true,
	    loop: false,
	    volume: 0.5,
	    onend: function() {
		console.log('Finished playing!');
	    }
	});
	music.play();
    }

    fetchLyrics(artist, title) {
	fetch(`http://localhost:3000/lyrics/${artist}/${title}`)
	    .then(response => response.json())
	    .then(data => {
		this.lyrics = data.lyrics.split('\n').slice(1);
		this.displayLyrics();
	    })
	    .catch(error => console.error('Error fetching lyrics:', error));
    }

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

    handleKeyPress(event) {
	const inputChar = event.key;

	if (!this.currentText) return;

	const currentLine = this.lyrics[this.currentIndex];
	const currentTextObject = this.textObjects[this.currentIndex];

	if (inputChar === 'Enter') {
	    if (this.lyrics[this.currentIndex].length === 0) {
		this.currentIndex++;

		if (this.currentIndex < this.lyrics.length) {
		    let moveDistance = currentTextObject.height;

		    let nextIndex = this.currentIndex;
		    while (nextIndex < this.lyrics.length && this.lyrics[nextIndex].trim().length === 0) {
			nextIndex++;
		    }

		    if (nextIndex < this.lyrics.length) {
			const nextTextObject = this.textObjects[nextIndex];
			moveDistance = nextTextObject.y - currentTextObject.y; // Calculate actual move distance
		    }

		    this.tweens.add({
			targets: this.scrollBox,
			y: this.scrollBox.y - moveDistance,
			duration: 300,
			ease: 'Power2'
		    });
		    this.currentIndex = nextIndex;
		    this.currentText = this.textObjects[this.currentIndex];
		} else {
		    this.displayScore();
		}
	    }
	} else {
	    if (inputChar === currentLine.charAt(0)) {
		const newText = currentTextObject.text.substring(1);
		currentTextObject.setText(newText);
		this.lyrics[this.currentIndex] = currentLine.substring(1);
	    } else {
		score -= 1;
	    }
	}
    }

    displayScore() {
	const width = this.scale.width;
	const height = this.scale.height;

	this.scrollBox.removeAll(true);

	this.add.text(width / 2, height / 2, `Final Score: ${score}`, { fontSize: (height * 0.05) + 'px', fill: '#fff' }).setOrigin(0.5);
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
	mode: Phaser.Scale.FIT,
	autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, TitleScene, DifficultyMenuScene, SongSelectionScene, GameScene]
};

const game = new Phaser.Game(config);

let music;
let lyrics = [];
let currentIndex = 0;
let score = 100;

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
