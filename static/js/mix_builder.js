function toggleSongMix(name, btn) {
    // Prevent default label click behavior to avoid double toggling if we move to div based
    // But since we are using checkboxes in the original HTML, let's play nice with them

    const container = document.getElementById('mix-preview-list');
    const existing = document.getElementById('mix-item-' + CSS.escape(name));

    // Checkbox state (the btn is the input itself or we find it)
    const checkbox = document.querySelector(`input[name="songs"][value="${name}"]`);

    if (existing) {
        // Remove
        existing.remove();
        if (checkbox) checkbox.checked = false;
        updateMixOrder();
    } else {
        // Add
        if (checkbox) checkbox.checked = true;

        const item = document.createElement('div');
        item.id = 'mix-item-' + name;
        item.className = 'mix-preview-item';
        item.dataset.name = name;
        item.innerHTML = `
            <span class="preview-name">${name}</span>
            <div class="preview-controls">
                <button type="button" onclick="moveMixItem('${name}', -1)">↑</button>
                <button type="button" onclick="moveMixItem('${name}', 1)">↓</button>
                <button type="button" onclick="toggleSongMix('${name}')" class="remove-btn">×</button>
            </div>
        `;
        container.appendChild(item);
        updateMixOrder();
    }
}

function moveMixItem(name, direction) {
    const item = document.getElementById('mix-item-' + name);
    if (!item) return;

    if (direction === -1 && item.previousElementSibling) {
        item.parentNode.insertBefore(item, item.previousElementSibling);
    } else if (direction === 1 && item.nextElementSibling) {
        item.parentNode.insertBefore(item.nextElementSibling, item);
    }
    updateMixOrder();
}

function updateMixOrder() {
    const container = document.getElementById('mix-preview-list');
    const items = container.querySelectorAll('.mix-preview-item');
    const names = [];

    items.forEach(item => {
        names.push(item.dataset.name);
    });

    document.getElementById('ordered_songs_input').value = names.join(',');

    // Sync Visuals in Grid
    document.querySelectorAll('.song-select-card').forEach(card => {
        const input = card.querySelector('input');
        if (names.includes(input.value)) {
            card.classList.add('selected');
            input.checked = true;
        } else {
            card.classList.remove('selected');
            input.checked = false;
        }
    });

    // Update container visibility
    if (names.length > 0) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}
