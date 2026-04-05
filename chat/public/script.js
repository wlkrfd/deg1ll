/**
 * КЛИЕНТСКАЯ ЛОГИКА ЧАТА
 */

try {
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const usernameInput = document.getElementById('username');
    const sendBtn = document.getElementById('send-btn');
    const statusLabel = document.getElementById('status');

    // Подключение к WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    // --- ОБРАБОТКА СОБЫТИЙ WEBSOCKET ---

    ws.onopen = () => {
        try {
            statusLabel.textContent = 'В сети';
            statusLabel.className = 'status online';
            console.log('[WS]: Соединение установлено');
        } catch (e) { console.error('Ошибка в onopen:', e); }
    };

    ws.onclose = () => {
        try {
            statusLabel.textContent = 'Отключено';
            statusLabel.className = 'status offline';
            console.log('[WS]: Соединение разорвано');
        } catch (e) { console.error('Ошибка в onclose:', e); }
    };

    ws.onerror = (error) => {
        console.error('[WS ERROR]: Ошибка соединения:', error);
    };

    ws.onmessage = (event) => {
        try {
            const response = JSON.parse(event.data);

            if (response.type === 'history') {
                // Отрисовка истории при входе
                response.data.forEach(msg => addMessageToUI(msg));
            } else if (response.type === 'message') {
                // Новое сообщение в реальном времени
                addMessageToUI(response.data);
            }
        } catch (err) {
            console.error('[UI ERROR]: Ошибка обработки сообщения:', err.message);
        }
    };

    // --- ФУНКЦИИ ИНТЕРФЕЙСА ---

    /**
     * Добавляет блок сообщения в окно чата
     */
    function addMessageToUI(msg) {
        try {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'msg-bubble';
            
            msgDiv.innerHTML = `
                <div class="msg-info">
                    <span class="msg-user">${escapeHTML(msg.user)}</span>
                    <span class="msg-time">${msg.time}</span>
                </div>
                <div class="msg-text">${escapeHTML(msg.text)}</div>
            `;

            chatWindow.appendChild(msgDiv);
            
            // Авто-скролл вниз
            chatWindow.scrollTop = chatWindow.scrollHeight;
        } catch (e) {
            console.error('Ошибка отрисовки сообщения:', e);
        }
    }

    /**
     * Отправка сообщения
     */
    function sendMessage() {
        try {
            const text = messageInput.value.trim();
            const user = usernameInput.value.trim() || 'Аноним';

            if (text && ws.readyState === WebSocket.OPEN) {
                const payload = {
                    user: user,
                    text: text
                };
                ws.send(JSON.stringify(payload));
                messageInput.value = ''; // Очистка поля
            }
        } catch (err) {
            console.error('[SEND ERROR]: Не удалось отправить сообщение:', err.message);
        }
    }

    // Слушатели событий
    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    /**
     * Защита от XSS (экранирование)
     */
    function escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }

} catch (initErr) {
    console.error('[CLIENT CRITICAL ERROR]: Ошибка инициализации скрипта:', initErr.message);
}
