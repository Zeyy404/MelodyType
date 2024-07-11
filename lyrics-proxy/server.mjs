import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());

app.get('/lyrics/:artist/:title', async (req, res) => {
    const { artist, title } = req.params;
    try {
	const response = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
	const data = await response.json();
	res.json(data);
    } catch (error) {
	res.status(500).json({ error: 'Error fetching lyrics' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
