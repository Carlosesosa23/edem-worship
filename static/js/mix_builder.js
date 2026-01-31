function toggleSongMix(name) {
    const container = document.getElementById('mix-preview-list');

    // 1. Robust find using data attribute manually to avoid selector/ID issues
    let existing = null;
    for (const child of container.children) {
        if (child.dataset.name === name) {
            existing = child;
            break;
        }
    }

    // 2. Robust checkbox finding
    // Escape double quotes for the attribute selector
    const safeNameSelector = name.replace(/"/g, '\\"');
    const checkbox = document.querySelector(`input[name="songs"][value="${safeNameSelector}"]`);

    if (existing) {
        // Remove
        existing.remove();
        if (checkbox) checkbox.checked = false;
    } else {
        // Add
        if (checkbox) checkbox.checked = true;

        const item = document.createElement('div');
        item.className = 'mix-preview-item';
        item.dataset.name = name; // Store raw name safely in DOM

        // Escape single quotes for the inline onclick handler string
        const escapedName = name.replace(/'/g, "\\'");

        // Note: passing 'this' to move functions avoids looking up by name again
        item.innerHTML = `
            <span class="preview-name">${name}</span>
            <div class="preview-controls">
                <button type="button" onclick="moveMixItem(this, -1)">↑</button>
                <button type="button" onclick="moveMixItem(this, 1)">↓</button>
                <button type="button" onclick="toggleSongMix('${escapedName}')" class="remove-btn">×</button>
            </div>
        `;
        container.appendChild(item);
    }
    updateMixOrder();
}

function moveMixItem(btn, direction) {
    // Find the parent item relative to the button clicked
    const item = btn.closest('.mix-preview-item');
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

    const input = document.getElementById('ordered_songs_input');
    if (input) input.value = names.join(',');

    // Sync Visuals in Grid
    document.querySelectorAll('.song-select-card').forEach(card => {
        const checkbox = card.querySelector('input');
        if (names.includes(checkbox.value)) {
            card.classList.add('selected');
            checkbox.checked = true;
        } else {
            card.classList.remove('selected');
            checkbox.checked = false;
        }
    });

    // Update container visibility
    if (names.length > 0) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}
