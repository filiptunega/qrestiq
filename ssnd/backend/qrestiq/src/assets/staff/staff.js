const API = '/api';

const allTab = document.querySelector('.tab.all');
const pendingTab = document.querySelector('.tab.pending');
const preparingTab = document.querySelector('.tab.preparing');
const readyTab = document.querySelector('.tab.ready');
const deliveredTab = document.querySelector('.tab.delivered');
const clearAllBtn = document.querySelector('.btn-clear');
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const ordersContainer = document.querySelector('.orders');

// aktívny tab
allTab.classList.add('active');

// ===== TOKEN =====
function getToken() {
    return sessionStorage.getItem('token');
}

function saveToken(token) {
    sessionStorage.setItem('token', token);
}

function clearToken() {
    sessionStorage.removeItem('token');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    };
}

function logout() {
    clearToken();
    loginOverlay.style.display = 'flex';
    stopPolling();
    ordersContainer.innerHTML = '';
}


// ===== POLLING =====
let pollingInterval = null;

function startPolling() {
    stopPolling();
    pollingInterval = setInterval(() => loadAndRender(), 10_000);
}

function stopPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
}


// ===== NAČÍTANIE OBJEDNÁVOK Z API =====
async function loadOrders() {
    const res = await fetch(`${API}/orders`, {
        headers: authHeaders(),
    });
    if (res.status === 401) { logout(); return []; }
    if (!res.ok) throw new Error('Nepodarilo sa načítať objednávky');
    return await res.json();
}

async function loadAndRender() {
    try {
        const orders = await loadOrders();
        renderOrders(orders);
    } catch (err) {
        console.error(err);
    }
}


// ===== RENDER =====
function renderOrders(orders) {
    const activeStatus = document.querySelector('.tab.active')?.dataset.status ?? 'all';

    ordersContainer.innerHTML = '';

    orders.forEach(order => {
        const displayStatus = order.status === 'completed' ? 'delivered' : order.status;

        if (order.status === 'cancelled') return;

        const itemsHTML = order.items.map(item => `
            <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>€${Number(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        const statusLabel = {
            pending: '⏰ Pending',
            preparing: '📦 Preparing',
            ready: '✅ Ready',
            delivered: '🚚 Delivered',
        }[displayStatus] ?? displayStatus;

        let actionBtn = '';
        if (displayStatus === 'pending') {
            actionBtn = `<button class="btn-primary" data-status="pending" data-id="${order.id}">📦 Start Preparing</button>`;
        } else if (displayStatus === 'preparing') {
            actionBtn = `<button class="btn-primary" data-status="preparing" data-id="${order.id}">✅ Mark as ready</button>`;
        } else if (displayStatus === 'ready') {
            actionBtn = `<button class="btn-primary" data-status="ready" data-id="${order.id}">🚚 Mark as delivered</button>`;
        }

        const time = new Date(order.createdAt).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

        const noteHTML = order.note
            ? `<div class="order-note">📝 ${order.note}</div>`
            : '';

        const cardHTML = `
            <div class="order-card" data-status="${displayStatus}" data-id="${order.id}">
                <div class="order-header">
                    <div>
                        <strong>Table ${order.tableNumber}</strong>
                        <div class="order-id">#${order.id}</div>
                        <div class="time">${time}</div>
                    </div>
                    <span class="status ${displayStatus}">${statusLabel}</span>
                </div>

                <div class="order-items">
                    <p><strong>Order Items:</strong></p>
                    ${itemsHTML}
                </div>

                ${noteHTML}

                <hr>

                <div class="order-total">
                    <span>Total</span>
                    <strong>€${Number(order.total).toFixed(2)}</strong>
                </div>

                ${actionBtn}
                <button class="btn-delete" data-id="${order.id}">🗑 Delete Order</button>
            </div>
        `;

        ordersContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    updateTabCounters();

    const activeTabEl = document.querySelector(`.tab[data-status="${activeStatus}"]`);
    if (activeTabEl) statusFilter({ currentTarget: activeTabEl });
}


// ===== TAB COUNTERY =====
function updateTabCounters() {
    const all = document.querySelectorAll('.order-card').length;
    const pending = document.querySelectorAll('.order-card[data-status="pending"]').length;
    const preparing = document.querySelectorAll('.order-card[data-status="preparing"]').length;
    const ready = document.querySelectorAll('.order-card[data-status="ready"]').length;
    const delivered = document.querySelectorAll('.order-card[data-status="delivered"]').length;

    allTab.textContent = `All Orders (${all})`;
    pendingTab.textContent = `Pending (${pending})`;
    preparingTab.textContent = `Preparing (${preparing})`;
    readyTab.textContent = `Ready (${ready})`;
    deliveredTab.textContent = `Delivered (${delivered})`;
}


// ===== FILTER =====
function statusFilter(click) {
    const tabButton = click.currentTarget;
    const cards = document.querySelectorAll('.order-card');

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabButton.classList.add('active');

    const existingEmpty = document.querySelector('.empty-state');
    if (existingEmpty) existingEmpty.remove();

    if (tabButton.dataset.status === 'all') {
        cards.forEach(card => card.style.display = 'block');
        if (cards.length === 0) showEmptyState();
        return;
    }

    cards.forEach(card => card.style.display = 'none');
    const filtered = document.querySelectorAll(`.order-card[data-status="${tabButton.dataset.status}"]`);

    if (filtered.length === 0) {
        showEmptyState();
    } else {
        filtered.forEach(card => card.style.display = 'block');
    }
}

function showEmptyState() {
    const el = document.createElement('div');
    el.classList.add('empty-state');
    el.innerHTML = `
        <div class="icon">!</div>
        <h2>No orders found</h2>
        <p>No orders have been placed yet.</p>
    `;
    document.querySelector('.content').appendChild(el);
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', statusFilter);
});


// ===== ZMENA STATUSU + DELETE =====
const nextStatusMap = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'completed',
};

document.addEventListener('click', async (e) => {
    const btn = e.target;

    if (btn.classList.contains('btn-primary')) {
        const id = btn.dataset.id;
        const curStatus = btn.dataset.status;
        const backendNext = nextStatusMap[curStatus];
        if (!backendNext || !id) return;

        btn.disabled = true;

        try {
            const res = await fetch(`${API}/orders/${id}/status`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ status: backendNext }),
            });
            if (res.status === 401) { logout(); return; }
            if (!res.ok) throw new Error('Status update failed');
            await loadAndRender();
        } catch (err) {
            console.error(err);
            btn.disabled = false;
        }
    }

    if (btn.classList.contains('btn-delete')) {
        const id = btn.dataset.id;
        if (!id) return;

        btn.disabled = true;

        try {
            const res = await fetch(`${API}/orders/${id}/status`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ status: 'cancelled' }),
            });
            if (res.status === 401) { logout(); return; }
            if (!res.ok) throw new Error('Delete failed');
            await loadAndRender();
        } catch (err) {
            console.error(err);
            btn.disabled = false;
        }
    }
});


// ===== CLEAR ALL =====
clearAllBtn.addEventListener('click', () => {
    const popUp = document.createElement('div');
    popUp.classList.add('popUp-overlay');
    popUp.innerHTML = `
        <div class="popUp">
            <p>You sure you want to clear all orders?</p>
            <div class="popUp-buttons">
                <button class="popUp-yes btn">Yes</button>
                <button class="popUp-no btn">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(popUp);

    popUp.querySelector('.popUp-no').addEventListener('click', () => popUp.remove());

    popUp.querySelector('.popUp-yes').addEventListener('click', async () => {
        popUp.remove();

        const cards = document.querySelectorAll('.order-card:not([data-status="delivered"])');
        const ids = [...cards].map(c => c.dataset.id).filter(Boolean);

        await Promise.allSettled(ids.map(id =>
            fetch(`${API}/orders/${id}/status`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ status: 'cancelled' }),
            })
        ));

        await loadAndRender();
    });
});


// ===== LOGIN =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('input[type="email"]').value.trim();
    const password = passwordInput.value;
    const submitBtn = loginForm.querySelector('.btn-login');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
            const data = await res.json();
            saveToken(data.token);
            loginOverlay.style.display = 'none';
            loadAndRender();
            startPolling();
            return;
        }

        const err = await res.json().catch(() => ({}));
        alert(err.message ?? 'Nesprávne prihlasovacie údaje.');
    } catch {
        alert('Server nie je dostupný.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.textContent = isPassword ? 'hide' : 'show';
});


// ===== AUTO-LOGIN ak má token =====
if (getToken()) {
    loginOverlay.style.display = 'none';
    loadAndRender();
    startPolling();
}