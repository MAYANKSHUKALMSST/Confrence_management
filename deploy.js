import { NodeSSH } from 'node-ssh';
import path from 'path';

const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('🔗 Connecting to server 172.16.100.24...');
    await ssh.connect({
      host: '172.16.100.24',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });
    console.log('✅ Connected.');

    console.log('📤 Uploading roombook.tar.gz...');
    await ssh.putFile(
      path.resolve(process.cwd(), 'roombook.tar.gz'),
      '/tmp/roombook.tar.gz'
    );
    console.log('✅ Upload complete.');

    console.log('📦 Extracting and setting up...');
    
    // Create directory if it doesn't exist, remove old code, extract new code
    const setupCommand = `
      mkdir -p ~/roombook
      cd ~/roombook
      # Extract files
      tar -xzf /tmp/roombook.tar.gz
      
      echo "Installing Node.js 20..."
      echo "9044472544" | sudo -S bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
      echo "9044472544" | sudo -S apt-get install -y nodejs
      
      echo "9044472544" | sudo -S npm install -g pm2

      echo "Setting up environment..."
      echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" > .env
      echo "PORT=3001" >> .env

      echo "Installing project dependencies..."
      npm install
      
      echo "Building project..."
      npm run build

      echo "Starting application..."
      pm2 delete roombook 2>/dev/null || true
      pm2 start server/index.js --name "roombook"
      pm2 save
      
      echo "Configuring automatic boot startup..."
      echo "9044472544" | sudo -S env PATH=$PATH:/usr/bin pm2 startup systemd -u mayank --hp /home/mayank

      echo "Configuring firewall..."
      echo "9044472544" | sudo -S ufw allow 3001/tcp
      echo "9044472544" | sudo -S ufw allow 80/tcp

      echo "Setting up Nginx..."
      echo "9044472544" | sudo -S apt-get install -y nginx

      # Configure Nginx for RoomBook
      NGINX_CONF="server {
          listen 80;
          server_name 172.16.100.24 _;

          location / {
              proxy_pass http://localhost:3001;
              proxy_http_version 1.1;
              proxy_set_header Upgrade \\$http_upgrade;
              proxy_set_header Connection 'upgrade';
              proxy_set_header Host \\$host;
              proxy_cache_bypass \\$http_upgrade;
          }
      }"

      echo "9044472544" | sudo -S bash -c "echo \\"$NGINX_CONF\\" > /etc/nginx/sites-available/roombook"
      echo "9044472544" | sudo -S rm -f /etc/nginx/sites-enabled/default
      echo "9044472544" | sudo -S ln -sf /etc/nginx/sites-available/roombook /etc/nginx/sites-enabled/
      
      echo "9044472544" | sudo -S systemctl restart nginx
      echo "Nginx configured successfully."
    `;

    const result = await ssh.execCommand(setupCommand);
    console.log('STDOUT:\n', result.stdout);
    if (result.stderr) {
      console.log('STDERR:\n', result.stderr);
    }
    
    console.log('✅ Deployment script finished.');
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  } finally {
    ssh.dispose();
  }
}

deploy();
