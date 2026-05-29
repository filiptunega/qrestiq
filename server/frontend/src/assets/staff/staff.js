const API = '/api';

// ===== DOM REFS =====
const clearAllBtn = document.getElementById('clearAllBtn');
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const ordersContainer = document.querySelector('.orders');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

// Tabs
const allTab = document.querySelector('.tab.all');
const pendingTab = document.querySelector('.tab.pending');
const preparingTab = document.querySelector('.tab.preparing');
const readyTab = document.querySelector('.tab.ready');
const deliveredTab = document.querySelector('.tab.delivered');

// Views
const ordersView = document.getElementById('ordersView');
const menuView = document.getElementById('menuView');
const tablesView = document.getElementById('tablesView');
const mainTabs = document.querySelectorAll('.main-tab');

// Menu manager
const menuItemsGrid = document.getElementById('menuItemsGrid');
const addMenuItemBtn = document.getElementById('addMenuItemBtn');
const menuCategoryFilter = document.getElementById('menuCategoryFilter');
const showInactiveCheck = document.getElementById('showInactive');
const categoryDatalist = document.getElementById('categoryDatalist');

// Modals
const menuModal = document.getElementById('menuModal');
const deleteModal = document.getElementById('deleteModal');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
const formError = document.getElementById('formError');

// Form fields
const editItemId = document.getElementById('editItemId');
const itemName = document.getElementById('itemName');
const itemCategory = document.getElementById('itemCategory');
const itemDescription = document.getElementById('itemDescription');
const itemPrice = document.getElementById('itemPrice');
const itemSortOrder = document.getElementById('itemSortOrder');
const itemImgUrl = document.getElementById('itemImgUrl');
const itemIsActive = document.getElementById('itemIsActive');


// ===== TOKEN =====
function getToken() { return localStorage.getItem('token'); }
function saveToken(token) { localStorage.setItem('token', token); }
function clearToken() { localStorage.removeItem('token'); }

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


// ===== VIEW SWITCHING =====
let currentView = 'orders';

mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        currentView = view;

        mainTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (view === 'orders') {
            ordersView.style.display = '';
            menuView.style.display = 'none';
            tablesView.style.display = 'none';
            clearAllBtn.style.display = '';
            pageTitle.textContent = 'Staff Dashboard';
            pageSubtitle.textContent = 'Manage and track all incoming orders';
            loadAndRender();
            startPolling();
        } else if (view === 'menu') {
            ordersView.style.display = 'none';
            menuView.style.display = '';
            tablesView.style.display = 'none';
            clearAllBtn.style.display = 'none';
            pageTitle.textContent = 'Menu Manager';
            pageSubtitle.textContent = 'Add, edit or remove menu items';
            stopPolling();
            loadMenuItems();
        } else if (view === 'tables') {
            ordersView.style.display = 'none';
            menuView.style.display = 'none';
            tablesView.style.display = '';
            clearAllBtn.style.display = 'none';
            pageTitle.textContent = 'Table Manager';
            pageSubtitle.textContent = 'Add, edit or deactivate restaurant tables';
            stopPolling();
            loadTables();
        }
    });
});


// ===== POLLING =====
let pollingInterval = null;

function startPolling() {
    stopPolling();
    pollingInterval = setInterval(() => loadAndRender(), 10_000);
}

function stopPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
}


// ===== ORDERS — NAČÍTANIE =====
async function loadOrders() {
    const res = await fetch(`${API}/orders`, { headers: authHeaders() });
    if (res.status === 401) { logout(); return []; }
    if (!res.ok) throw new Error('Nepodarilo sa načítať objednávky');
    return await res.json();
}

async function loadAndRender() {
    const cachedOrders = localStorage.getItem('ordersCache');
    if (cachedOrders && document.querySelectorAll('.order-card').length === 0) {
        renderOrders(JSON.parse(cachedOrders));
    }
    try {
        const orders = await loadOrders();
        localStorage.setItem('ordersCache', JSON.stringify(orders));
        renderOrders(orders);
    } catch (err) {
        console.error(err);
    }
}


// ===== ORDERS — RENDER =====
const savedTab = localStorage.getItem('activeTab') || 'all';
document.querySelector(`.tab[data-status="${savedTab}"]`)?.classList.add('active');

function renderOrders(orders) {
    const activeStatus = document.querySelector('.tab.active')?.dataset.status ?? savedTab;
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
        const noteHTML = order.note ? `<div class="order-note">📝 ${order.note}</div>` : '';

        ordersContainer.insertAdjacentHTML('beforeend', `
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
        `);
    });

    updateTabCounters();
    const activeTabEl = document.querySelector(`.tab[data-status="${activeStatus}"]`);
    if (activeTabEl) statusFilter({ currentTarget: activeTabEl });
}


// ===== TAB COUNTERY =====
function updateTabCounters() {
    allTab.textContent = `All Orders (${document.querySelectorAll('.order-card').length})`;
    pendingTab.textContent = `Pending (${document.querySelectorAll('.order-card[data-status="pending"]').length})`;
    preparingTab.textContent = `Preparing (${document.querySelectorAll('.order-card[data-status="preparing"]').length})`;
    readyTab.textContent = `Ready (${document.querySelectorAll('.order-card[data-status="ready"]').length})`;
    deliveredTab.textContent = `Delivered (${document.querySelectorAll('.order-card[data-status="delivered"]').length})`;
}


// ===== FILTER =====
function statusFilter(click) {
    const tabButton = click.currentTarget;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabButton.classList.add('active');
    localStorage.setItem('activeTab', tabButton.dataset.status);

    document.querySelector('.empty-state')?.remove();
    const cards = document.querySelectorAll('.order-card');

    if (tabButton.dataset.status === 'all') {
        cards.forEach(card => card.style.display = 'block');
        if (cards.length === 0) showEmptyState();
        return;
    }

    cards.forEach(card => card.style.display = 'none');
    const filtered = document.querySelectorAll(`.order-card[data-status="${tabButton.dataset.status}"]`);
    if (filtered.length === 0) showEmptyState();
    else filtered.forEach(card => card.style.display = 'block');
}

function showEmptyState() {
    const el = document.createElement('div');
    el.classList.add('empty-state');
    el.innerHTML = `
        <div class="icon">!</div>
        <h2>No orders found</h2>
        <p>No orders have been placed yet.</p>
    `;
    document.querySelector('.content')?.appendChild(el);
}

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', statusFilter));


// ===== ORDER ACTIONS =====
const nextStatusMap = { pending: 'preparing', preparing: 'ready', ready: 'completed' };

document.addEventListener('click', async (e) => {
    const btn = e.target;

    if (btn.classList.contains('btn-primary')) {
        const id = btn.dataset.id;
        const backendNext = nextStatusMap[btn.dataset.status];
        if (!backendNext || !id) return;
        btn.disabled = true;
        try {
            const res = await fetch(`${API}/orders/${id}/status`, {
                method: 'PATCH', headers: authHeaders(),
                body: JSON.stringify({ status: backendNext }),
            });
            if (res.status === 401) { logout(); return; }
            if (!res.ok) throw new Error('Status update failed');
            await loadAndRender();
        } catch (err) { console.error(err); btn.disabled = false; }
    }

    if (btn.classList.contains('btn-delete')) {
        const id = btn.dataset.id;
        if (!id) return;
        btn.disabled = true;
        try {
            const res = await fetch(`${API}/orders/${id}/status`, {
                method: 'PATCH', headers: authHeaders(),
                body: JSON.stringify({ status: 'cancelled' }),
            });
            if (res.status === 401) { logout(); return; }
            if (!res.ok) throw new Error('Delete failed');
            await loadAndRender();
        } catch (err) { console.error(err); btn.disabled = false; }
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
        const ids = [...document.querySelectorAll('.order-card:not([data-status="delivered"])')].map(c => c.dataset.id).filter(Boolean);
        await Promise.allSettled(ids.map(id =>
            fetch(`${API}/orders/${id}/status`, {
                method: 'PATCH', headers: authHeaders(),
                body: JSON.stringify({ status: 'cancelled' }),
            })
        ));
        await loadAndRender();
    });
});


// ===== LOGIN =====
document.getElementById('logoutBtn').addEventListener('click', () => {
    logout();
});

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

if (getToken()) {
    loginOverlay.style.display = 'none';
    loadAndRender();
    startPolling();
}


// ============================================================
// ===== MENU CARD EVENT DELEGATION =====
// Jeden listener prežije každý re-render menuItemsGrid
menuItemsGrid.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-danger-sm');

    if (editBtn) {
        openEditModal(Number(editBtn.dataset.id));
    } else if (deleteBtn) {
        openDeleteConfirm(Number(deleteBtn.dataset.id), deleteBtn.dataset.name);
    }
});
// ============================================================

let allMenuItems = [];
let pendingDeleteId = null;

async function loadMenuItems() {
    try {
        const res = await fetch(`${API}/menu/admin/all`, { headers: authHeaders() });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load menu');
        allMenuItems = await res.json();
        await refreshCategoryOptions();
        renderMenuItems();
    } catch (err) {
        console.error(err);
        menuItemsGrid.innerHTML = `<p style="color:#dc2626; padding:16px;">Nepodarilo sa načítať menu.</p>`;
    }
}

async function refreshCategoryOptions() {
    try {
        const res = await fetch(`${API}/menu/admin/categories`, { headers: authHeaders() });
        if (!res.ok) return;
        const cats = await res.json();

        // Category filter dropdown
        const currentFilter = menuCategoryFilter.value;
        menuCategoryFilter.innerHTML = '<option value="">All Categories</option>';
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = c;
            menuCategoryFilter.appendChild(opt);
        });
        if (currentFilter) menuCategoryFilter.value = currentFilter;

        // Datalist for form
        categoryDatalist.innerHTML = '';
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            categoryDatalist.appendChild(opt);
        });
    } catch { }
}

// ===== DRAG & DROP STATE =====
let dragSrcCard = null;
let dragSrcId = null;

function renderMenuItems() {
    const filterCat = menuCategoryFilter.value;
    const showInactive = showInactiveCheck.checked;

    let items = allMenuItems;
    if (!showInactive) items = items.filter(i => i.isActive);
    if (filterCat) items = items.filter(i => i.category === filterCat);

    menuItemsGrid.innerHTML = '';

    if (items.length === 0) {
        menuItemsGrid.innerHTML = `
            <div class="menu-empty">
                <div class="icon">!</div>
                <h2>No items found</h2>
                <p>Try changing the filter or add a new item.</p>
            </div>`;
        return;
    }

    // Group by category
    const groups = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).forEach(([cat, catItems]) => {
        const section = document.createElement('div');
        section.className = 'menu-category-section';
        section.innerHTML = `<h3 class="menu-category-title">${cat} <span class="drag-hint">drag to reorder</span></h3>`;

        const grid = document.createElement('div');
        grid.className = 'menu-cards';

        catItems.forEach(item => {
            const card = document.createElement('div');
            card.className = `menu-card${item.isActive ? '' : ' menu-card--inactive'}`;
            card.draggable = true;
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="drag-handle" title="Drag to reorder">⠿</div>
                ${item.imgUrl ? `<img class="menu-card-img" src="${escapeHtml(item.imgUrl)}" alt="${escapeHtml(item.name)}" onerror="this.style.display='none'">` : ''}
                <div class="menu-card-body">
                    <div class="menu-card-header">
                        <span class="menu-card-name">${escapeHtml(item.name)}</span>
                        <span class="menu-card-price">€${Number(item.price).toFixed(2)}</span>
                    </div>
                    ${item.description ? `<p class="menu-card-desc">${escapeHtml(item.description)}</p>` : ''}
                    <div class="menu-card-meta">
                        <span class="menu-badge ${item.isActive ? 'badge-active' : 'badge-inactive'}">${item.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div class="menu-card-actions">
                        <button class="btn btn-edit" data-id="${item.id}">✏️ Edit</button>
                        <button class="btn btn-danger-sm" data-id="${item.id}" data-name="${escapeHtml(item.name)}">🗑</button>
                    </div>
                </div>
            `;

            // Drag events
            card.addEventListener('dragstart', (e) => {
                dragSrcCard = card;
                dragSrcId = item.id;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.id);
                setTimeout(() => card.classList.add('dragging'), 0);
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                grid.querySelectorAll('.menu-card').forEach(c => c.classList.remove('drag-over'));
                dragSrcCard = null;
                dragSrcId = null;
            });
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (card !== dragSrcCard) {
                    grid.querySelectorAll('.menu-card').forEach(c => c.classList.remove('drag-over'));
                    card.classList.add('drag-over');
                }
            });
            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                if (!dragSrcCard || dragSrcCard === card) return;

                // Reorder in DOM
                const cards = [...grid.querySelectorAll('.menu-card')];
                const srcIdx = cards.indexOf(dragSrcCard);
                const destIdx = cards.indexOf(card);

                if (srcIdx < destIdx) {
                    grid.insertBefore(dragSrcCard, card.nextSibling);
                } else {
                    grid.insertBefore(dragSrcCard, card);
                }

                // Persist new order
                saveMenuOrder(grid);
            });

            grid.appendChild(card);
        });

        section.appendChild(grid);
        menuItemsGrid.appendChild(section);
    });
}

async function saveMenuOrder(grid) {
    const cards = [...grid.querySelectorAll('.menu-card')];
    const items = cards.map((card, idx) => ({ id: Number(card.dataset.id), sortOrder: idx }));

    // Update in-memory allMenuItems so filter/re-render keeps order
    items.forEach(({ id, sortOrder }) => {
        const m = allMenuItems.find(i => Number(i.id) === id);
        if (m) m.sortOrder = sortOrder;
    });

    try {
        const res = await fetch(`${API}/menu/reorder`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ items }),
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Reorder failed');
    } catch (err) {
        console.error('Failed to save order:', err);
    }
}


function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


// ===== MENU MODAL — OPEN/CLOSE =====
function openAddModal() {
    editItemId.value = '';
    itemName.value = '';
    itemCategory.value = '';
    itemDescription.value = '';
    itemPrice.value = '';
    itemSortOrder.value = '0';
    itemImgUrl.value = '';
    itemIsActive.checked = true;
    formError.textContent = '';
    modalTitle.textContent = 'Add Menu Item';
    menuModal.style.display = 'flex';
}

function openEditModal(id) {
    const item = allMenuItems.find(i => Number(i.id) === Number(id));
    if (!item) return;

    editItemId.value = item.id;
    itemName.value = item.name;
    itemCategory.value = item.category;
    itemDescription.value = item.description ?? '';
    itemPrice.value = Number(item.price).toFixed(2);
    itemSortOrder.value = item.sortOrder ?? 0;
    itemImgUrl.value = item.imgUrl ?? '';
    itemIsActive.checked = item.isActive;
    formError.textContent = '';
    modalTitle.textContent = 'Edit Menu Item';
    menuModal.style.display = 'flex';
}

function closeModal() {
    menuModal.style.display = 'none';
}

addMenuItemBtn.addEventListener('click', openAddModal);
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
menuModal.addEventListener('click', e => { if (e.target === menuModal) closeModal(); });


// ===== MENU MODAL — SAVE =====
modalSave.addEventListener('click', async () => {
    const id = editItemId.value ? Number(editItemId.value) : null;
    const name = itemName.value.trim();
    const cat = itemCategory.value.trim();
    const price = parseFloat(itemPrice.value);

    formError.textContent = '';

    if (!name) { formError.textContent = 'Name is required.'; return; }
    if (!cat) { formError.textContent = 'Category is required.'; return; }
    if (isNaN(price) || price < 0) { formError.textContent = 'Valid price required.'; return; }

    const payload = {
        name,
        category: cat,
        description: itemDescription.value.trim(),
        price,
        imgUrl: itemImgUrl.value.trim(),
        isActive: itemIsActive.checked,
        sortOrder: parseInt(itemSortOrder.value) || 0,
    };

    modalSave.disabled = true;
    try {
        const url = id ? `${API}/menu/${id}` : `${API}/menu`;
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });

        if (res.status === 401) { logout(); return; }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            formError.textContent = err.message ?? 'Save failed.';
            return;
        }

        closeModal();
        await loadMenuItems();
    } catch (err) {
        formError.textContent = 'Network error.';
        console.error(err);
    } finally {
        modalSave.disabled = false;
    }
});


// ===== DELETE CONFIRM =====
function openDeleteConfirm(id, name) {
    pendingDeleteId = Number(id);
    deleteModal.style.display = 'flex';
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    pendingDeleteId = null;
}

deleteCancelBtn.addEventListener('click', closeDeleteModal);
deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

deleteConfirmBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    deleteConfirmBtn.disabled = true;
    try {
        const res = await fetch(`${API}/menu/${pendingDeleteId}`, {
            method: 'DELETE', headers: authHeaders(),
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Delete failed');
        closeDeleteModal();
        await loadMenuItems();
    } catch (err) {
        console.error(err);
        alert('Delete failed. Please try again.');
    } finally {
        deleteConfirmBtn.disabled = false;
    }
});


// ===== MENU FILTERS =====
menuCategoryFilter.addEventListener('change', renderMenuItems);
showInactiveCheck.addEventListener('change', renderMenuItems);


// ============================================================
// ===== TABLES MANAGER =====
// ============================================================

// DOM refs — tables
const tablesGrid = document.getElementById('tablesGrid');
const addTableBtn = document.getElementById('addTableBtn');
const showInactiveTablesChk = document.getElementById('showInactiveTables');

// Table modal
const tableModal = document.getElementById('tableModal');
const tableModalTitle = document.getElementById('tableModalTitle');
const tableModalClose = document.getElementById('tableModalClose');
const tableModalCancel = document.getElementById('tableModalCancel');
const tableModalSave = document.getElementById('tableModalSave');
const tableFormError = document.getElementById('tableFormError');
const editTableId = document.getElementById('editTableId');
const tableNumber = document.getElementById('tableNumber');
const tableIsActive = document.getElementById('tableIsActive');
const tableActiveGroup = document.getElementById('tableActiveGroup');

// Delete modal
const deleteTableModal = document.getElementById('deleteTableModal');
const deleteTableCancelBtn = document.getElementById('deleteTableCancelBtn');
const deleteTableConfirmBtn = document.getElementById('deleteTableConfirmBtn');

let allTables = [];
let pendingDeleteTableId = null;

async function loadTables() {
    try {
        const res = await fetch(`${API}/tables/all`, { headers: authHeaders() });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load tables');
        allTables = await res.json();
        renderTables();
    } catch (err) {
        console.error(err);
        tablesGrid.innerHTML = `<p style="color:#dc2626; padding:16px;">Nepodarilo sa načítať stoly.</p>`;
    }
}

function renderTables() {
    const showInactive = showInactiveTablesChk.checked;
    const items = showInactive ? allTables : allTables.filter(t => t.isActive);

    tablesGrid.innerHTML = '';

    if (items.length === 0) {
        tablesGrid.innerHTML = `
            <div class="menu-empty">
                <div class="icon">🪑</div>
                <h2>No tables found</h2>
                <p>Try enabling "Show inactive" or add a new table.</p>
            </div>`;
        return;
    }

    items.forEach(table => {
        const card = document.createElement('div');
        card.className = `table-card${table.isActive ? '' : ' table-card--inactive'}`;
        card.innerHTML = `
            <div class="table-card-number">🪑 Table ${table.number}</div>
            <div class="table-card-meta">
                <span class="menu-badge ${table.isActive ? 'badge-active' : 'badge-inactive'}">
                    ${table.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="table-card-actions">
                <button class="btn btn-edit" data-table-id="${table.id}">✏️ Edit</button>
                <button class="btn btn-toggle ${table.isActive ? 'btn-deactivate' : 'btn-activate'}"
                        data-table-id="${table.id}" data-active="${table.isActive}">
                    ${table.isActive ? '🔴 Deactivate' : '🟢 Activate'}
                </button>
                <button class="btn btn-danger-sm" data-table-delete-id="${table.id}">🗑</button>
            </div>
        `;
        tablesGrid.appendChild(card);
    });
}

// Event delegation on tablesGrid
tablesGrid.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-table-id].btn-edit');
    const toggleBtn = e.target.closest('.btn-toggle[data-table-id]');
    const deleteBtn = e.target.closest('[data-table-delete-id]');

    if (editBtn) {
        openEditTableModal(Number(editBtn.dataset.tableId));
    } else if (toggleBtn) {
        const id = Number(toggleBtn.dataset.tableId);
        const isActive = toggleBtn.dataset.active === 'true';
        await quickToggleTable(id, !isActive);
    } else if (deleteBtn) {
        openDeleteTableConfirm(Number(deleteBtn.dataset.tableDeleteId));
    }
});

async function quickToggleTable(id, isActive) {
    try {
        const res = await fetch(`${API}/tables/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ isActive }),
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Toggle failed');
        await loadTables();
    } catch (err) {
        console.error(err);
        alert('Nepodarilo sa zmeniť stav stola.');
    }
}

// ===== TABLE MODAL =====
function openAddTableModal() {
    editTableId.value = '';
    tableNumber.value = '';
    tableIsActive.checked = true;
    tableActiveGroup.style.display = 'none';
    tableFormError.textContent = '';
    tableModalTitle.textContent = 'Add Table';
    tableModal.style.display = 'flex';
    tableNumber.focus();
}

function openEditTableModal(id) {
    const table = allTables.find(t => Number(t.id) === id);
    if (!table) return;
    editTableId.value = table.id;
    tableNumber.value = table.number;
    tableIsActive.checked = table.isActive;
    tableActiveGroup.style.display = '';
    tableFormError.textContent = '';
    tableModalTitle.textContent = 'Edit Table';
    tableModal.style.display = 'flex';
    tableNumber.focus();
}

function closeTableModal() {
    tableModal.style.display = 'none';
}

addTableBtn.addEventListener('click', openAddTableModal);
tableModalClose.addEventListener('click', closeTableModal);
tableModalCancel.addEventListener('click', closeTableModal);
tableModal.addEventListener('click', e => { if (e.target === tableModal) closeTableModal(); });

tableModalSave.addEventListener('click', async () => {
    const id = editTableId.value ? Number(editTableId.value) : null;
    const num = parseInt(tableNumber.value);

    tableFormError.textContent = '';
    if (!num || num < 1) { tableFormError.textContent = 'Table number must be a positive integer.'; return; }

    const payload = id
        ? { number: num, isActive: tableIsActive.checked }
        : { number: num };

    tableModalSave.disabled = true;
    try {
        const url = id ? `${API}/tables/${id}` : `${API}/tables`;
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });

        if (res.status === 401) { logout(); return; }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            tableFormError.textContent = err.message ?? 'Save failed.';
            return;
        }
        closeTableModal();
        await loadTables();
    } catch {
        tableFormError.textContent = 'Network error.';
    } finally {
        tableModalSave.disabled = false;
    }
});

// ===== DELETE TABLE =====
function openDeleteTableConfirm(id) {
    pendingDeleteTableId = id;
    deleteTableModal.style.display = 'flex';
}

function closeDeleteTableModal() {
    deleteTableModal.style.display = 'none';
    pendingDeleteTableId = null;
}

deleteTableCancelBtn.addEventListener('click', closeDeleteTableModal);
deleteTableModal.addEventListener('click', e => { if (e.target === deleteTableModal) closeDeleteTableModal(); });

deleteTableConfirmBtn.addEventListener('click', async () => {
    if (!pendingDeleteTableId) return;
    deleteTableConfirmBtn.disabled = true;
    try {
        const res = await fetch(`${API}/tables/${pendingDeleteTableId}`, {
            method: 'DELETE', headers: authHeaders(),
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Delete failed');
        closeDeleteTableModal();
        await loadTables();
    } catch {
        alert('Delete failed. Please try again.');
    } finally {
        deleteTableConfirmBtn.disabled = false;
    }
});

showInactiveTablesChk.addEventListener('change', renderTables);