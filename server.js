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

    // Dynamic approach to retrieve the pod name
    exec("oc get pods -o jsonpath='{.items[?(@.status.phase==\"Running\")].metadata.name}'", (err, stdout, stderr) => {
        if (err) {
            return res.send(`Error retrieving pod name: ${stderr}`);
        }

        const podName = stdout.trim();  // Get the first running pod name
        if (!podName) {
            return res.send('Error: No running pod found.');
        }

        // Construct the command to execute
        let cmd = `oc exec ${podName} -- ollama ${command}`;

        if (args) cmd += ` ${args}`;
        if (flags) cmd += ` ${flags}`;
        if (input) cmd += ` ${input}`;

        console.log('Executing command:', cmd);

        // Execute the command
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
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
