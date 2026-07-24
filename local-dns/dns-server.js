const dns2 = require('dns2');
const dgram = require('dgram');

const { Packet } = dns2;
const CUSTOM_DOMAIN = 'conferencebooking.tp-link.com';
const TARGET_IP = '10.30.80.50'; // Always point to VIP for HA failover

// Helper to proxy requests to Google DNS (8.8.8.8)
const proxyToGoogle = (buffer) => {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    socket.on('message', (msg) => {
      resolve(msg);
      socket.close();
    });
    socket.on('error', (err) => {
      reject(err);
      socket.close();
    });
    socket.send(buffer, 0, buffer.length, 53, '8.8.8.8');
    
    // 2-second timeout for external DNS queries
    setTimeout(() => { 
      socket.close(); 
      reject(new Error('DNS Timeout')); 
    }, 2000);
  });
};

const server = dns2.createServer({
  udp: true,
  tcp: true,
  handle: async (request, send, rinfo) => {
    try {
      const [question] = request.questions;
      
      // 1. Intercept custom local domain
      if (question && question.name.toLowerCase() === CUSTOM_DOMAIN) {
        console.log(`[LOCAL DNS] Routing ${CUSTOM_DOMAIN} for ${rinfo.address}`);
        const response = Packet.createResponseFromRequest(request);
        response.answers.push({
          name: question.name,
          type: Packet.TYPE.A,
          class: Packet.CLASS.IN,
          ttl: 300,
          address: TARGET_IP
        });
        return send(response);
      }

      // 2. Proxy everything else to the real internet
      const responseBuffer = await proxyToGoogle(request.toBuffer());
      return send(responseBuffer);
      
    } catch (err) {
      if (err.message !== 'DNS Timeout') {
        const fallbackResponse = Packet.createResponseFromRequest(request);
        fallbackResponse.header.rcode = Packet.RESULTCODE.SERVFAIL;
        send(fallbackResponse);
      }
    }
  }
});

server.on('listening', () => {
  console.log('===========================================================');
  console.log(`🚀 Office DNS Proxy is actively running!`);
  console.log(`Listening on Port 53 (UDP/TCP)`);
  console.log(`Routing -> ${CUSTOM_DOMAIN} to ${TARGET_IP}`);
  console.log(`Proxying -> All other queries to 8.8.8.8`);
  console.log('===========================================================');
});

// Run server on 0.0.0.0 (all interfaces)
server.listen({
  udp: { port: 53, address: '0.0.0.0', type: 'udp4' },
  tcp: { port: 53, address: '0.0.0.0' }
});
