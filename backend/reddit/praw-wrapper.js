// PRAW wrapper: Safe subprocess to call Python Reddit posting script

import { PythonShell } from 'python-shell';

export async function postToReddit(subreddit, title, content, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'text',
      pythonPath: process.env.PYTHON_PATH || 'python3',
      pythonOptions: ['-u'],
      scriptPath: './reddit',
      args: [
        subreddit,
        title,
        content
      ],
      timeout: timeout
    };

    let output = '';
    let error = '';

    const pyshell = new PythonShell('post_to_reddit.py', options);

    pyshell.on('message', (message) => {
      output += message;
    });

    pyshell.on('stderr', (stderr) => {
      error += stderr;
    });

    pyshell.end((err) => {
      if (err) {
        return reject({
          error: err.message,
          stderr: error,
          stdout: output
        });
      }

      try {
        // Parse output (should be JSON or post URL)
        if (output.includes('http')) {
          // It's a URL
          return resolve({
            success: true,
            url: output.trim(),
            method: 'praw'
          });
        }

        // Try to parse as JSON
        const result = JSON.parse(output);
        return resolve({
          success: true,
          ...result,
          method: 'praw'
        });
      } catch (e) {
        return reject({
          error: 'Failed to parse Python output',
          output,
          stderr: error
        });
      }
    });
  });
}

export async function getRedditUser(username, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'text',
      pythonPath: process.env.PYTHON_PATH || 'python3',
      pythonOptions: ['-u'],
      scriptPath: './reddit',
      args: ['--get-user', username],
      timeout: timeout
    };

    const pyshell = new PythonShell('post_to_reddit.py', options);
    let output = '';

    pyshell.on('message', (message) => {
      output += message;
    });

    pyshell.end((err) => {
      if (err) return reject(err);

      try {
        const userData = JSON.parse(output);
        return resolve(userData);
      } catch (e) {
        return reject({ error: 'Failed to parse user data', output });
      }
    });
  });
}

export function validateCredentials(clientId, clientSecret, username, password) {
  // Basic validation before passing to Python
  const errors = [];

  if (!clientId || clientId.length < 10) errors.push('Invalid client_id');
  if (!clientSecret || clientSecret.length < 10) errors.push('Invalid client_secret');
  if (!username || username.length < 3) errors.push('Invalid username');
  if (!password || password.length < 5) errors.push('Invalid password');

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function testConnection() {
  // Test if PRAW can connect to Reddit
  return new Promise((resolve) => {
    const options = {
      mode: 'text',
      pythonPath: process.env.PYTHON_PATH || 'python3',
      scriptPath: './reddit',
      args: ['--test'],
      timeout: 10000
    };

    let connected = false;

    const pyshell = new PythonShell('post_to_reddit.py', options);

    pyshell.on('message', (message) => {
      if (message.includes('success') || message.includes('connected')) {
        connected = true;
      }
    });

    pyshell.end(() => {
      resolve({ connected });
    });
  });
}
