// Health check script for Docker container
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Health check passed');
      }
    process.exit(0);
  } else {
    if (process.env.NODE_ENV === 'development') {
        console.log(`Health check failed with status: ${res.statusCode}`);
      }
    process.exit(1);
  }
});

request.on('error', (err) => {
  if (process.env.NODE_ENV === 'development') {
      console.log(`Health check failed: ${err.message}`);
    }
  process.exit(1);
});

request.on('timeout', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Health check timed out');
  }
  request.destroy();
  process.exit(1);
});

request.end();