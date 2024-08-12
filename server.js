const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const https = require('https');

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

    // Function to get the pod name via the Kubernetes API
    const getPodName = () => {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'kubernetes.default.svc',
                port: 443,
                path: '/api/v1/namespaces/default/pods',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.TOKEN}`,  // Use service account token
                },
                rejectUnauthorized: false,  // Ignore SSL certificate validation for simplicity
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    const podList = JSON.parse(data);
                    const runningPod = podList.items.find(pod => pod.status.phase === 'Running');
                    if (runningPod) {
                        resolve(runningPod.metadata.name);
                    } else {
                        reject('No running pod found.');
                    }
                });
            });

            req.on('error', (e) => {
                reject(`Error: ${e.message}`);
            });

            req.end();
        });
    };

    getPodName()
        .then(podName => {
            let cmd = `oc exec ${podName} -- ollama ${command}`;

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
        })
        .catch(error => {
            res.send(`Error retrieving pod name: ${error}`);
        });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
