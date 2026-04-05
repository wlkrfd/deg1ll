/**
 * СЕРВЕРНАЯ ЧАСТЬ ЧАТА (Node.js)
 * 
 * Требования: npm install ws
 */

const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// --- НАСТРОЙКИ ---
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1489699474740613129/cdEnNBIPrOJ6D9in9kbZ_cNlDJvVm3iu-7miODypw2KUreYwz4r-u3sFnH25n67yydmj';
const messageHistory = []; 
const PORT = 3000;

/**
 * Функция отправки сообщения в Discord
 */
function sendToDiscord(user, text) {
    try {
        const data = JSON.stringify({
            username: 'Deg1ll Hub Chat',
            content: `**[${user}]**: ${text}`
        });

        const url = new URL(DISCORD_WEBHOOK_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        };

        const req = https.request(options, (res) => {
            if (res.statusCode === 204 || res.statusCode === 200) {
                console.log(`[DISCORD]: Сообщение от "${user}" успешно отправлено.`);
            } else {
                console.error(`[DISCORD ERROR]: Код ответа ${res.statusCode}`);
            }
        });
        req.on('error', (e) => console.error('[DISCORD ERROR]:', e.message));
        req.write(data);
        req.end();
        console.log(`[DISCORD]: Попытка отправки сообщения от "${user}"...`);
    } catch (err) {
        console.error('[DISCORD SEND FAILED]:', err.message);
    }
}

try {
    // Создаем HTTP сервер для отдачи статики
    const server = http.createServer((req, res) => {
        try {
            // Разрешаем доступ ко всему проекту из корня
            let filePath = path.join(__dirname, '..', req.url);
            
            // Если путь - это корень (/), отдаем index.html из корня проекта
            if (req.url === '/' || req.url === '') {
                filePath = path.join(__dirname, '..', 'index.html');
            }

            const extname = String(path.extname(filePath)).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'text/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.png': 'image/png',
                '.jpg': 'image/jpg',
                '.mp4': 'video/mp4',
            };

            const contentType = mimeTypes[extname] || 'application/octet-stream';

            fs.readFile(filePath, (error, content) => {
                if (error) {
                    if (error.code === 'ENOENT') {
                        res.writeHead(404);
                        res.end('Файл не найден: ' + req.url);
                    } else {
                        res.writeHead(500);
                        res.end('Ошибка сервера: ' + error.code);
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                }
            });
        } catch (err) {
            console.error('[HTTP ERROR]:', err.message);
        }
    });

    // Инициализация WebSocket сервера
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        try {
            console.log('Новое подключение установлено');

            // При подключении отправляем историю сообщений новому клиенту
            ws.send(JSON.stringify({ type: 'history', data: messageHistory }));

            ws.on('message', (message) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    
                    // Формируем данные сообщения
                    const msgData = {
                        user: parsedMessage.user || 'Аноним',
                        text: parsedMessage.text || '',
                        time: new Date().toLocaleTimeString()
                    };

                    // Сохраняем в историю
                    messageHistory.push(msgData);
                    if (messageHistory.length > 100) messageHistory.shift();

                    // Отправляем в Discord
                    sendToDiscord(msgData.user, msgData.text);

                    // BROADCAST всем клиентам
                    const broadcastData = JSON.stringify({ type: 'message', data: msgData });
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(broadcastData);
                        }
                    });

                } catch (parseErr) {
                    console.error('[WS MESSAGE ERROR]:', parseErr.message);
                }
            });

            ws.on('close', () => console.log('Клиент отключился'));
            ws.on('error', (err) => console.error('[WS CLIENT ERROR]:', err.message));

        } catch (connErr) {
            console.error('[WS CONNECTION ERROR]:', connErr.message);
        }
    });

    server.listen(PORT, () => {
        console.log(`Сервер чата запущен: http://localhost:${PORT}`);
    });

} catch (globalErr) {
    console.error('[CRITICAL ERROR]:', globalErr.message);
}
