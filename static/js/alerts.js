// Live Alerts Receiver
// Must load socket.io client script before this

document.addEventListener('DOMContentLoaded', () => {
    // Inject Overlay HTML
    const overlay = document.createElement('div');
    overlay.id = 'alert-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%; 
        pointer-events: none; /* Let clicks pass through if transparent */
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.85);
        opacity: 0;
        transition: opacity 0.3s ease;
        flex-direction: column;
    `;

    // Message container
    const msgBox = document.createElement('div');
    msgBox.id = 'alert-text';
    msgBox.style.cssText = `
        color: white;
        font-family: 'Inter', sans-serif;
        font-weight: 800;
        font-size: 12vw;
        text-align: center;
        text-transform: uppercase;
        text-shadow: 0 0 20px rgba(255,255,255,0.5);
        padding: 20px;
        border: 4px solid white;
        border-radius: 16px;
        background: rgba(0,0,0,0.5);
    `;

    overlay.appendChild(msgBox);
    document.body.appendChild(overlay);

    // Connect Socket.IO
    // Assume io is loaded globally
    if (typeof io !== 'undefined') {
        // Debug Status Bar
        const statusBar = document.createElement('div');
        statusBar.id = 'debug-status-bar';
        statusBar.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: rgba(0,0,0,0.8);
            color: white;
            font-size: 10px;
            padding: 4px;
            text-align: center;
            z-index: 10000;
            pointer-events: none;
            font-family: monospace;
        `;
        statusBar.innerText = 'Initializing...';
        document.body.appendChild(statusBar);

        const socket = io({
            transports: ['websocket', 'polling'], // Try both
            reconnection: true
        });

        socket.on('connect', () => {
            console.log('Connected to Alerts System');
            statusDot.style.background = '#00d084'; // Green
            statusDot.style.boxShadow = '0 0 10px #00d084';
        });

        socket.on('disconnect', () => {
            console.warn('Disconnected from Alerts System');
            statusDot.style.background = '#ff4d4d'; // Red
            statusDot.style.boxShadow = '0 0 5px #ff4d4d';
        });

        socket.on('connect_error', (err) => {
            console.error('Connection Error:', err);
            statusDot.style.background = 'yellow'; // Yellow for error trial
        });

        let hideTimeout;

        socket.on('alert', (data) => {
            console.log('Alert:', data);

            // Set Color Theme
            let color = data.color || 'blue';
            let borderColor = '#fff';
            let glow = 'rgba(255,255,255,0.5)';

            if (color === 'red') { borderColor = '#ff4d4d'; glow = 'rgba(255, 77, 77, 0.8)'; }
            else if (color === 'green') { borderColor = '#00d084'; glow = 'rgba(0, 208, 132, 0.8)'; }
            else if (color === 'blue') { borderColor = '#2563eb'; glow = 'rgba(37, 99, 235, 0.8)'; }
            else if (color === 'purple') { borderColor = '#a855f7'; glow = 'rgba(168, 85, 247, 0.8)'; }

            msgBox.style.borderColor = borderColor;
            msgBox.style.boxShadow = `0 0 50px ${glow}, inset 0 0 20px ${glow}`;
            msgBox.innerText = data.message;

            // Show
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto'; // Block interaction while alert is up? Maybe better not to block completely but okay for now.

            // Haptic
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

            // Hide after delay
            if (hideTimeout) clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
            }, 3500);
        });
    }
});
