const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/run-command', (req, res) => {
    const { containerId, args, flags, input, command } = req.body;
    console.log('Received form data:', req.body);

    if (!containerId || !command) {
        return res.send('Error: Container ID and command are required.');
    }

    // Define the base command with the full path to the ollama binary
    let cmd = `docker exec ${containerId} /usr/bin/ollama ${command}`;

    // Append arguments, flags, and input if they are provided
    if (args) cmd += ` ${args}`;
    if (flags) cmd += ` ${flags}`;
    if (input) cmd += ` ${input}`;

    // Log the command for debugging
    console.log('Executing command:', cmd);

    exec(cmd, (error, stdout, stderr) => {
        let response = `Command: ${command}\n`;
        if (args) response += `Arguments: ${args}\n`;
        if (flags) response += `Flags: ${flags}\n`;
        if (input) response += `Input: ${input}\n`;

        response += `Output:\n${stdout || 'No output'}\n`;
        if (stderr) {
            // Remove all non-printable characters
            const cleanStderr = stderr.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            response += `Error:\n${cleanStderr}`;
        }

        res.send(response);
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});