const fs = require('fs');
const { Client } = require('ssh2');

function runRemoteCommand(cmd) {
  return new Promise((resolve, reject) => {
    const sshTarget = new Client();
    sshTarget.on('ready', () => {
      sshTarget.exec(cmd, (err, execStream) => {
        if (err) {
          sshTarget.end();
          return reject(err);
        }
        let stdout = '';
        let stderr = '';
        execStream.on('close', (code, signal) => {
          sshTarget.end();
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
    sshTarget.on('error', reject);
    sshTarget.connect({
      host: process.env.BPHTB_SSH_HOST || '100.108.177.13',
      port: parseInt(process.env.BPHTB_SSH_PORT || '2201', 10),
      username: process.env.BPHTB_SSH_USER || 'hnf',
      password: process.env.BPHTB_SSH_PASSWORD || '@programmer',
      readyTimeout: 15000,
    });
  });
}

module.exports = { runRemoteCommand };

if (require.main === module) {
  let command = process.argv[2] || 'pm2 list; ls -la /home/hnf/get-BPN';
  if (command === '--sync') {
    const bphtbB64 = fs.readFileSync('src/lib/bphtb.ts').toString('base64');
    const pageB64 = fs.readFileSync('src/app/page.tsx').toString('base64');
    const envB64 = fs.readFileSync('.env').toString('base64');
    command = [
      'cd /home/hnf/get-BPN',
      `echo '${bphtbB64}' | base64 -d > src/lib/bphtb.ts`,
      `echo '${pageB64}' | base64 -d > src/app/page.tsx`,
      `echo '${envB64}' | base64 -d > .env`,
      'npm run build',
      'pm2 restart get-bpn-api --update-env',
    ].join(' && ');
  }
  runRemoteCommand(command)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Error:', e);
      process.exit(1);
    });
}
