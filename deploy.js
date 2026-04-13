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

    console.log('📤 Uploading roombook.tar...');
    await ssh.putFile(
      path.resolve(process.cwd(), 'roombook.tar'),
      '/tmp/roombook.tar'
    );
    console.log('✅ Upload complete.');

    console.log('📦 Extracting and setting up...');
    
    // Create directory if it doesn't exist, remove old code, extract new code
    const setupCommand = `
      set -e
      mkdir -p ~/roombook
      cd ~/roombook
      
      echo "Extracting files..."
      tar -xf /tmp/roombook.tar || { echo "Tar extraction failed"; exit 1; }
      
      echo "Installing Node.js 20..."
      echo "9044472544" | sudo -S bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
      echo "9044472544" | sudo -S apt-get install -y nodejs
      
      echo "9044472544" | sudo -S npm install -g pm2

      echo "Setting up environment..."
      if [ ! -f .env ]; then
        echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" > .env
        echo "PORT=3001" >> .env
        echo "NODE_ENV=production" >> .env
        echo "COOKIE_SECURE=false" >> .env # Set to true once SSL is enabled and accessing via https://
      fi

      echo "Installing project dependencies..."
      npm install
      
      echo "Fixing permissions..."
      chmod +x node_modules/.bin/* || true

      echo "Building project..."
      npm run build

      echo "Starting application..."
      pm2 delete roombook 2>/dev/null || true
      pm2 start server/index.js --name "roombook"
      pm2 save
      
      echo "Configuring automatic boot startup..."
      echo "9044472544" | sudo -S env PATH=$PATH:/usr/bin pm2 startup systemd -u mayank --hp /home/mayank | grep "sudo" | bash || true

      echo "Configuring firewall..."
      echo "9044472544" | sudo -S ufw allow 3001/tcp || true
      echo "9044472544" | sudo -S ufw allow 80/tcp || true

      echo "Setting up Nginx..."
      echo "9044472544" | sudo -S apt-get install -y nginx

      # Apply Nginx config from project
      echo "9044472544" | sudo -S cp ~/roombook/nginx.conf /etc/nginx/sites-available/roombook
      echo "9044472544" | sudo -S rm -f /etc/nginx/sites-enabled/default
      echo "9044472544" | sudo -S ln -sf /etc/nginx/sites-available/roombook /etc/nginx/sites-enabled/
      
      echo "Testing Nginx config..."
      echo "9044472544" | sudo -S nginx -t
      
      echo "Restarting Nginx..."
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
