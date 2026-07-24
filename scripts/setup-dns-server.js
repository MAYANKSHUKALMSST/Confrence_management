import { NodeSSH } from 'node-ssh';
import path from 'path';

const ssh = new NodeSSH();
const SSH_HOST    = '10.30.80.148';
const SSH_USER    = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD || '9044472544';
const REMOTE_DIR  = '/home/mayank/local-dns';

async function run() {
  console.log(`🔗 Connecting to primary server ${SSH_HOST}...`);
  await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD, port: 22 });

  // ── 1. Upload local-dns folder ────────────────────────────────────────────
  const localDnsDir = path.resolve(process.cwd(), 'local-dns');
  console.log(`📤 Uploading local-dns/ → ${REMOTE_DIR} ...`);
  await ssh.putDirectory(localDnsDir, REMOTE_DIR, {
    recursive: true,
    concurrency: 5,
    validate: (itemPath) => !itemPath.includes('node_modules'),
  });

  // ── 2. Install dependencies ───────────────────────────────────────────────
  console.log('📦 Installing dns2 dependency...');
  const install = await ssh.execCommand('npm install', { cwd: REMOTE_DIR });
  if (install.stderr) console.log('npm:', install.stderr);

  // ── 3. Allow Node to bind port 53 (needs cap_net_bind_service) ───────────
  console.log('🔓 Granting Node.js permission to bind port 53...');
  const nodeBin = await ssh.execCommand('which node');
  const nodePathStr = nodeBin.stdout.trim();
  if (nodePathStr) {
    const capCmd = `echo "${SSH_PASSWORD}" | sudo -S setcap 'cap_net_bind_service=+ep' ${nodePathStr}`;
    const capRes = await ssh.execCommand(capCmd);
    if (capRes.stderr && !capRes.stderr.includes('password')) console.log('setcap:', capRes.stderr);
  }

  // ── 4. Stop any existing PM2 process (ignore error if not found) ──────────
  console.log('🛑 Stopping old dns-server process (if any)...');
  await ssh.execCommand('pm2 delete dns-server 2>/dev/null || true');

  // ── 5. Start with PM2 ─────────────────────────────────────────────────────
  console.log('🚀 Starting dns-server with PM2...');
  const startRes = await ssh.execCommand(
    'pm2 start dns-server.js --name "dns-server" --restart-delay=3000',
    { cwd: REMOTE_DIR }
  );
  console.log(startRes.stdout || startRes.stderr);

  // ── 6. Save PM2 config so it survives reboots ─────────────────────────────
  console.log('💾 Saving PM2 process list for auto-restart on boot...');
  await ssh.execCommand('pm2 save');

  // ── 7. Enable PM2 startup (systemd) ──────────────────────────────────────
  console.log('⚙️  Enabling PM2 systemd startup...');
  const startupRes = await ssh.execCommand('pm2 startup systemd -u mayank --hp /home/mayank', {});
  // Extract and run the sudo command PM2 prints
  const sudoLine = (startupRes.stdout || '').split('\n').find(l => l.trim().startsWith('sudo'));
  if (sudoLine) {
    const fullSudo = `echo "${SSH_PASSWORD}" | sudo -S ${sudoLine.replace(/^sudo\s+/, '')}`;
    const sysRes = await ssh.execCommand(fullSudo);
    if (sysRes.stderr && !sysRes.stderr.includes('password')) console.log('systemd:', sysRes.stderr);
  }

  // ── 8. Verify it's running ────────────────────────────────────────────────
  console.log('\n📋 PM2 Status:');
  const statusRes = await ssh.execCommand('pm2 list');
  console.log(statusRes.stdout);

  console.log('\n✅ DNS server is live!');
  console.log(`   Domain  : conferencebooking.tp-link.com`);
  console.log(`   Resolves: 10.30.80.50 (VIP)`);
  console.log(`   Port    : 53 (UDP + TCP)`);
  console.log('\n📡 Next step: Set your router\'s Primary DNS to 10.30.80.148');

  ssh.dispose();
}

run().catch((e) => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
