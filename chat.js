// chat.js
const express = require('express');
const { spawn } = require('child_process');
const app = express();
app.use(express.json());

app.post('/chat', (req, res) => {
  const userInput = req.body.message;

  const ollama = spawn('ollama', ['run', 'gemma4:31b', '--', userInput]);

  let output = '';
  ollama.stdout.on('data', (data) => {
    output += data.toString();
  });

  ollama.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
  });

  ollama.on('close', (code) => {
    if (code === 0) {
      res.json({ response: output });
    } else {
      res.status(500).json({ error: 'Ollama process failed' });
    }
  });
});

const port = 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});