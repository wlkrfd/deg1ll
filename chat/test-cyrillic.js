const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
    console.log('Connected to server');
    const payload = JSON.stringify({
        user: 'ТестерГеннадий',
        text: 'Привет от Gemini! Теперь кириллица должна работать.'
    });
    ws.send(payload);
    console.log('Message sent: ' + payload);
    
    setTimeout(() => {
        ws.close();
        process.exit(0);
    }, 2000);
});

ws.on('error', (err) => {
    console.error('WebSocket Error: ' + err.message);
    process.exit(1);
});
