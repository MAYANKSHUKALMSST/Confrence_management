import { NodeSSH } from 'node-ssh';

const SSH_HOST     = '10.30.80.148';
const SSH_USER     = 'mayank';
const SSH_PASSWORD = '9044472544';

async function run() {
  const ssh = new NodeSSH();
  await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD, port: 22 });

  const sudo = (cmd) => ssh.execCommand(`echo "${SSH_PASSWORD}" | sudo -S ${cmd}`);

  // ── 1. Identify who owns port 53 ────────────────────────────────────────
  console.log('🔍 Checking who owns port 53...');
  const who = await ssh.execCommand('ss -tulpn | grep :53 || true');
  console.log(who.stdout || '(nothing yet)');

  // ── 2. Disable systemd-resolved's built-in stub DNS listener ────────────
  console.log('\n⚙️  Disabling systemd-resolved stub DNS listener...');

  // Ensure the config line is present and set to no
  await sudo(`bash -c "sed -i '/DNSStubListener/d' /etc/systemd/resolved.conf && echo 'DNSStubListener=no' >> /etc/systemd/resolved.conf"`);

  // Restart systemd-resolved
  const res1 = await sudo('systemctl restart systemd-resolved');
  if (res1.stderr && !res1.stderr.includes('password')) console.log('resolved:', res1.stderr);
  console.log('✅ systemd-resolved restarted (stub listener off)');

  // ── 3. Allow Node to bind privileged port 53 ────────────────────────────
  console.log('\n🔓 Setting cap_net_bind_service on node binary...');
  const nodePath = (await ssh.execCommand('which node')).stdout.trim();
  const cap = await sudo(`setcap 'cap_net_bind_service=+ep' ${nodePath}`);
  if (cap.stderr && !cap.stderr.includes('password')) console.log('setcap:', cap.stderr);

  // ── 4. Restart dns-server PM2 process ───────────────────────────────────
  console.log('\n🔄 Restarting dns-server via PM2...');
  await ssh.execCommand('pm2 restart dns-server');

  // Wait for it to stabilise
  await new Promise(r => setTimeout(r, 4000));

  // ── 5. Check final status ────────────────────────────────────────────────
  console.log('\n📋 Final PM2 status:');
  const status = await ssh.execCommand('pm2 list');
  console.log(status.stdout);

  console.log('🔍 Port 53 listeners:');
  const port = await ssh.execCommand('ss -tulpn | grep :53 || echo "(none found)"');
  console.log(port.stdout);

  // ── 6. Quick DNS test from server itself ─────────────────────────────────
  console.log('🧪 Testing DNS resolution from server...');
  const test = await ssh.execCommand(
    'dig @127.0.0.1 conferencebooking.tp-link.com +short 2>/dev/null || nslookup conferencebooking.tp-link.com 127.0.0.1 2>/dev/null | tail -5'
  );
  console.log(test.stdout || test.stderr || '(no output)');

  ssh.dispose();
}

run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
