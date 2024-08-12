// Import the express module
const express = require('express');

// Create an instance of an express application
const app = express();

// Import the path module for handling file paths
const path = require('path');

// Import the body-parser module to parse request bodies
const bodyParser = require('body-parser');

// Import the exec function from the child_process module to execute shell commands
const { exec } = require('child_process');

// Use body-parser middleware to parse URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Use body-parser middleware to parse JSON data
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define the route for the root URL, sending the index.html file as a response
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Define the route for handling POST requests to /run-command
app.post('/run-command', (req, res) => {
    // Destructure form data from the request body
    const { containerId, args, flags, input, command } = req.body;
    
    // Log the received form data for debugging purposes
    console.log('Received form data:', req.body);

    // Check if containerId and command are provided, if not, send an error response
    if (!containerId || !command) {
        return res.send('Error: Container ID and command are required.');
    }

    // Define the base command with the full path to the ollama binary
    let cmd = `docker exec ${containerId} /usr/bin/ollama ${command}`;

    // Append arguments, flags, and input if they are provided
    if (args) cmd += ` ${args}`;
    if (flags) cmd += ` ${flags}`;
    if (input) cmd += ` ${input}`;

    // Log the command for debugging purposes
    console.log('Executing command:', cmd);

    // Execute the command using exec
    exec(cmd, (error, stdout, stderr) => {
        // Initialize the response string with the command details
        let response = `Command: ${command}\n`;
        if (args) response += `Arguments: ${args}\n`;
        if (flags) response += `Flags: ${flags}\n`;
        if (input) response += `Input: ${input}\n`;

        // Append the command output to the response
        response += `Output:\n${stdout || 'No output'}\n`;
        if (stderr) {
            // Remove all non-printable characters from the error output
            const cleanStderr = stderr.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            response += `Error:\n${cleanStderr}`;
        }

        // Send the response back to the client
        res.send(response);
    });
});

// Start the server on port 3000 and log a message indicating the server is running
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
