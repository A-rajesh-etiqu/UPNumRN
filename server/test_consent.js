const http = require('http');

const data = JSON.stringify({
    vua: "9999999999@setu",
    consentDetail: {}
});

const options = {
    hostname: 'localhost',
    port: 8085,
    path: '/api/setu/consents',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', error => console.error('Error:', error));
req.write(data);
req.end();
