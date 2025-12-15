// public/js/socket.js
const socket = io();

let currentUserId = null;
let currentChatNumber = null;

// ============= INITIALIZE =============
function initializeSocket(userId) {
    currentUserId = userId;
    socket.emit('register', { userId });
    loadConversations(); // Load sidebar
}

// ============= INCOMING MESSAGE (RECEIVED) =============
socket.on('incoming_message', (msg) => {
    const from = normalize(msg.from); // Clean number
    const body = msg.body || msg.message || '';
    const time = msg.sent_at || msg.createdAt || new Date();

    // 1. Update or Create Sidebar Entry
    updateOrCreateConversation(from, body, time);

    // 2. If this chat is open → Show immediately
    if (currentChatNumber === from) {
        appendMessage({
            body,
            createdAt: time,
            sid: msg.sid || msg.id
        }, 'received');
        scrollToBottom();
        markAsRead(msg.sid); // Optional
    }
});

// ============= SENT MESSAGE (OUTGOING) =============
socket.on('new_message', (msg) => {
    const to = normalize(msg.to);
    const body = msg.body || msg.message || '';
    const time = msg.sent_at || msg.createdAt || new Date();

    // Update sidebar
    updateOrCreateConversation(to, body, time);

    // If this chat is open → Show sent message
    if (currentChatNumber === to) {
        appendMessage({
            body,
            createdAt: time,
            sid: msg.sid || msg.id
        }, 'sent');
        scrollToBottom();
    }
});

// ============= CHAT CLEARED =============
socket.on('conversation_cleared', ({ number }) => {
    const clean = normalize(number);
    removeFromSidebar(clean);

    if (currentChatNumber === clean) {
        const chatBox = document.getElementById('chat-messages');
        if (chatBox) {
            chatBox.innerHTML = '<p class="text-center text-gray-500 py-8">Chat cleared</p>';
        }
    }
});

// ============= PRESENCE & TYPING =============
socket.on('user_online', (d) => updateStatus(d.number, true));
socket.on('user_offline', (d) => updateStatus(d.number, false, d.lastSeen));
socket.on('typing', (d) => {
    if (currentChatNumber === normalize(d.number)) {
        showTyping(d.typing);
    }
});

// ============= SEND MESSAGE =============
function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text || !currentChatNumber || !currentUserId) return;

    const payload = {
        toNumber: currentChatNumber,
        message: text,
        userId: currentUserId
    };

    const url = isWhatsApp(currentChatNumber) ? '/api/whatsapp/send' : '/api/sms/send';

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Optional: optimistic UI
            appendMessage({ body: text, createdAt: new Date() }, 'sent');
            scrollToBottom();
        }
    })
    .catch(err => console.error('Send failed:', err));

    input.value = '';
    socket.emit('typing_stop', { number: currentChatNumber });
}

// ============= TYPING INDICATOR =============
const typingTimer = {};
document.getElementById('message-input')?.addEventListener('input', (e) => {
    if (!currentChatNumber) return;

    socket.emit('typing_start', { number: currentChatNumber });

    clearTimeout(typingTimer[currentChatNumber]);
    typingTimer[currentChatNumber] = setTimeout(() => {
        socket.emit('typing_stop', { number: currentChatNumber });
    }, 1000);
});

// ============= OPEN CHAT =============
function openChat(number) {
    currentChatNumber = normalize(number);
    socket.emit('presence_subscribe', { number: currentChatNumber });

    // Load old messages
    loadMessages(currentChatNumber);

    // Mark as read
    markAsReadForChat(currentChatNumber);
}

// ============= HELPERS =============
function normalize(n) {
    return String(n).replace(/^whatsapp:/i, '').replace(/^\+91/, '');
}

function isWhatsApp(n) {
    return String(n).includes('whatsapp:');
}

// ============= SIDEBAR: Update or Create =============
function updateOrCreateConversation(num, msgText, time) {
    let el = document.querySelector(`[data-number="${num}"]`);

    if (!el) {
        el = createConvEl(num, msgText, time);
        const list = document.getElementById('conversation-list');
        if (list) list.prepend(el);
    } else {
        // Update last message & time
        el.querySelector('.last-msg').textContent = msgText.slice(0, 30) + (msgText.length > 30 ? '...' : '');
        el.querySelector('.time').textContent = formatTime(time);
        // Move to top
        el.parentNode?.prepend(el);
    }

    // Update unread badge (if needed)
    updateUnreadCount(num);
}

function createConvEl(num, msg, time) {
    const el = document.createElement('div');
    el.className = 'conv-item p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors';
    el.dataset.number = num;
    el.onclick = () => openChat(num);

    el.innerHTML = `
        <div class="flex items-center">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                ${num.slice(-2)}
            </div>
            <div class="ml-3 flex-1 min-w-0">
                <div class="font-semibold text-gray-900 truncate">${num}</div>
                <div class="text-sm text-gray-600 last-msg truncate">${msg.slice(0, 30)}${msg.length > 30 ? '...' : ''}</div>
            </div>
            <div class="text-xs text-gray-500 time whitespace-nowrap">${formatTime(time)}</div>
            <div class="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center unread-badge hidden">1</div>
        </div>
    `;
    return el;
}

function removeFromSidebar(num) {
    document.querySelector(`[data-number="${num}"]`)?.remove();
}

// ============= APPEND MESSAGE =============
function appendMessage(msg, type) {
    const chat = document.getElementById('chat-messages');
    if (!chat) return;

    const div = document.createElement('div');
    div.className = `mb-3 flex ${type === 'sent' ? 'justify-end' : 'justify-start'} animate-fade-in`;

    const bubbleClass = type === 'sent'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-900';

    div.innerHTML = `
        <div class="${bubbleClass} rounded-2xl px-4 py-2 max-w-xs shadow-sm">
            ${escape(msg.body || msg.message)}
            <div class="text-xs opacity-70 mt-1 text-right">${formatTime(msg.createdAt || msg.sent_at)}</div>
        </div>
    `;

    chat.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    const chat = document.getElementById('chat-messages');
    if (chat) chat.scrollTop = chat.scrollHeight;
}

// ============= TYPING INDICATOR =============
function showTyping(show) {
    let el = document.getElementById('typing-indicator');
    const chat = document.getElementById('chat-messages');

    if (!chat) return;

    if (show && !el) {
        el = document.createElement('div');
        el.id = 'typing-indicator';
        el.className = 'flex items-center space-x-1 p-3 animate-pulse';
        el.innerHTML = `
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
            </div>
            <span class="text-sm text-gray-600 ml-2">typing...</span>
        `;
        chat.appendChild(el);
    }

    if (el) {
        el.style.display = show ? 'flex' : 'none';
    }
}

// ============= UNREAD COUNT (Optional) =============
function updateUnreadCount(num) {
    // Implement if you have unread logic in Conversation model
    // Example: fetch from /api/conversations and update badge
}

// ============= TIME FORMAT =============
function formatTime(t) {
    const d = new Date(t);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// ============= ESCAPE HTML =============
function escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============= LOAD MESSAGES (from API) =============
async function loadMessages(number) {
    try {
        const res = await fetch(`/api/sms/messages/${number}`);
        const data = await res.json();
        if (data.success && data.messages) {
            const chat = document.getElementById('chat-messages');
            chat.innerHTML = '';
            data.messages.forEach(msg => {
                const type = msg.sender === 'self' ? 'sent' : 'received';
                appendMessage({
                    body: msg.text,
                    createdAt: msg.timestamp
                }, type);
            });
        }
    } catch (err) {
        console.error('Failed to load messages:', err);
    }
}

// ============= MARK AS READ (Optional) =============
function markAsRead(sid) {
    // Call API to mark message as read
}

function markAsReadForChat(number) {
    // Reset unread count in DB & UI
}