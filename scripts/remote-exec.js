const { Client } = require('ssh2');

function runRemoteCommand(cmd) {
  return new Promise((resolve, reject) => {
    const sshJump = new Client();
    sshJump.on('ready', () => {
      sshJump.forwardOut('127.0.0.1', 12345, '192.168.1.101', 22, (err, stream) => {
        if (err) {
          sshJump.end();
          return reject(err);
        }
        const sshTarget = new Client();
        sshTarget.on('ready', () => {
          sshTarget.exec(cmd, (err, execStream) => {
            if (err) {
              sshTarget.end();
              sshJump.end();
              return reject(err);
            }
            let stdout = '';
            let stderr = '';
            execStream.on('close', (code, signal) => {
              sshTarget.end();
              sshJump.end();
              resolve({ code, stdout, stderr });
            });
            execStream.on('data', (d) => {
              stdout += d;
              process.stdout.write(d);
            });
            execStream.stderr.on('data', (d) => {
              stderr += d;
              process.stderr.write(d);
            });
          });
        });
        sshTarget.on('error', (err) => {
          sshJump.end();
          reject(err);
        });
        sshTarget.connect({
          sock: stream,
          username: 'hnf',
          password: '@programmer'
        });
      });
    });
    sshJump.on('error', reject);
    sshJump.connect({
      host: '103.167.12.53',
      port: 22,
      username: 'root',
      password: '@#Tim1t42026'
    });
  });
}

module.exports = { runRemoteCommand };

if (require.main === module) {
  const command = process.argv[2] || 'pm2 list; ls -la /home/hnf/get-BPN';
  runRemoteCommand(command).catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
}
