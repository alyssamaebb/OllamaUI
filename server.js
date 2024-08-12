const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/run-command', (req, res) => {
    const { args, flags, input, command } = req.body;
    console.log('Received form data:', req.body);

    if (!command) {
        return res.send('Error: Command is required.');
    }

    // Assuming `ollama` is installed and available globally
    let cmd = `ollama ${command}`;

    if (args) cmd += ` ${args}`;
    if (flags) cmd += ` ${flags}`;
    if (input) cmd += ` ${input}`;

    console.log('Executing command:', cmd);

    exec(cmd, (error, stdout, stderr) => {
        let response = `Command: ${command}\n`;
        if (args) response += `Arguments: ${args}\n`;
        if (flags) response += `Flags: ${flags}\n`;
        if (input) response += `Input: ${input}\n`;

        response += `Output:\n${stdout || 'No output'}\n`;
        if (stderr) {
            const cleanStderr = stderr.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            response += `Error:\n${cleanStderr}`;
        }

        res.send(response);
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
