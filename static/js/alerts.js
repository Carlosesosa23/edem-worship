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
        width: 100vw;
        height: 100vh; 
        pointer-events: none; /* Let clicks pass through if transparent */
        z-index: 2147483647; /* Max z-index to cover everything */
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.85); /* Darker background for contrast */
        opacity: 0;
        transition: opacity 0.3s ease;
        flex-direction: column;
        backdrop-filter: blur(4px); /* Blur behind alert */
    `;

    // Message container
    const msgBox = document.createElement('div');
    msgBox.id = 'alert-text';
    msgBox.style.cssText = `
        color: white;
        font-family: 'Inter', sans-serif;
        font-weight: 900;
        font-size: clamp(2rem, 12vw, 6rem); /* Responsive font size */
        text-align: center;
        text-transform: uppercase;
        text-shadow: 0 0 20px rgba(0,0,0,0.8);
        padding: 2rem;
        border: 4px solid white;
        border-radius: 16px;
        background: rgba(0,0,0,0.6);
        max-width: 90%;
        line-height: 1.1;
    `;

    overlay.appendChild(msgBox);
    document.body.appendChild(overlay);

    // Connect Socket.IO
    // Assume io is loaded globally
    if (typeof io !== 'undefined') {
        // Explicitly point to current origin with robust transport
        const socket = io(window.location.origin, {
            transports: ['polling', 'websocket'],
            reconnection: true
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
            overlay.style.pointerEvents = 'auto';

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
