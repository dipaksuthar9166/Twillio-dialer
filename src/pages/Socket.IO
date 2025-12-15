// Socket.IO से इनकमिंग कॉल का नोटिफिकेशन
io.on('connection', (socket) => {
    // ... existing code

    // Simulate or push incoming call event
    socket.on('incoming_call', (data) => {
        io.emit('incoming_call_alert', data); // frontend को भेजें
    });
});