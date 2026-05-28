const API = '/api';

let data = {};
let cart = {};
let tableNumber = null;
let availableTables = [];
let itemLookup = {};

// DOM elementy
const categoriesEl = document.getElementById('categories');
const menuEl = document.getElementById('menu');
const cartEl = document.getElementById('cart');
const cartOverlayEl = document.getElementById('cartOverlay');
const cartItemsEl = document.getElementById('cartItems');
const openCartBtn = document.getElementById('openCart');
const closeCartBtn = document.getElementById('closeCartBtn');
const submitBtn = document.getElementById('submitBtn');
const noteEl = document.getElementById('note');
const tableInput = document.getElementById('cartTableInput');
const errorEl = document.getElementById('cartTableError');
const cartCountEl = document.getElementById('cartCount');
const toastContainer = document.getElementById('toastContainer');

// ===== TOAST NOTIFIKÁCIE =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ===== STAV STOLA =====
function setValidTable(num) {
    tableNumber = num;
    tableInput.value = num;
    errorEl.style.display = 'none';
    tableInput.style.borderColor = '';
    localStorage.setItem('qrestiq_table', num);
}

function setInvalidTable() {
    tableNumber = null;
    errorEl.style.display = 'block';
    errorEl.innerText = 'Table not available';
    tableInput.style.borderColor = 'var(--danger)';
}

function resetTableState() {
    tableNumber = null;
    tableInput.value = '';
    errorEl.style.display = 'none';
    tableInput.style.borderColor = '';
    tableInput.disabled = false;
    tableInput.classList.remove('locked');
}

// ===== NAČÍTANIE STOLOV Z BACKENDU =====
fetch(`${API}/tables`)
    .then(res => res.json())
    .then(tables => {
        availableTables = tables.map(t => t.number);
        setTableFromQuery();
    })
    .catch(err => {
        console.error('Error loading tables:', err);
        // Fallback pre testovanie, ak API neodpovedá
        availableTables = [1, 2, 3, 4, 5, 20];
        setTableFromQuery();
    });

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function setTableFromQuery() {
    const tableParam = getQueryParam('table');

    // Prípad A: V URL NIE JE parameter stola -> umožníme zápis/načítame z cache
    if (tableParam === null) {
        tableInput.disabled = false;
        tableInput.classList.remove('locked');

        const savedTable = localStorage.getItem('qrestiq_table');
        const parsedSaved = parseInt(savedTable);

        if (savedTable && !isNaN(parsedSaved) && availableTables.includes(parsedSaved)) {
            setValidTable(parsedSaved);
        } else {
            resetTableState();
        }
        return;
    }

    // Prípad B: V URL JE parameter stola -> Vložíme ho, priradíme a napevno ZAMKNEME
    const table = parseInt(tableParam);
    if (!isNaN(table)) {
        tableNumber = table;
        tableInput.value = table; // Vloží číslo stola priamo do vizuálneho okienka
        tableInput.disabled = true; // Zablokuje zmenu zákazníkom
        tableInput.classList.add('locked'); // Aktivuje prémiový locked štýl

        if (availableTables.length > 0 && !availableTables.includes(table)) {
            errorEl.style.display = 'block';
            errorEl.innerText = 'Stôl nie je v zozname aktívnych, objednávka však odíde na stôl ' + table;
            tableInput.style.borderColor = 'var(--danger)';
        } else {
            errorEl.style.display = 'none';
            tableInput.style.borderColor = '';
        }
    } else {
        resetTableState();
        tableInput.value = tableParam;
        errorEl.style.display = 'block';
        errorEl.innerText = 'Neplatný kód stola';
        tableInput.disabled = true;
        tableInput.classList.add('locked');
    }
}

tableInput.addEventListener('input', () => {
    const val = tableInput.value.trim();
    if (val === '') {
        resetTableState();
        localStorage.removeItem('qrestiq_table');
        return;
    }
    const num = parseInt(val);
    if (!isNaN(num) && availableTables.includes(num)) {
        setValidTable(num);
    } else {
        setInvalidTable();
    }
});

// ===== NAČÍTANIE MENU =====
fetch(`${API}/menu/grouped`)
    .then(res => res.json())
    .then(grouped => {
        data = grouped;
        itemLookup = {};
        Object.values(data).flat().forEach(item => {
            itemLookup[item.id] = item;
        });

        renderCategories();
        renderAllMenu();
        initScrollSpy();
    })
    .catch(err => {
        console.error('Error loading menu:', err);
        showToast('Nepodarilo sa načítať menu.', 'error');
    });

function renderCategories() {
    categoriesEl.innerHTML = '';
    Object.keys(data).forEach((cat, index) => {
        const c = document.createElement('div');
        c.className = 'chip' + (index === 0 ? ' active' : '');
        c.innerText = cat;
        c.dataset.category = cat;
        c.onclick = () => scrollToCategory(cat);
        categoriesEl.appendChild(c);
    });
}

function scrollToCategory(cat) {
    const el = document.getElementById('cat-' + cat);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function renderAllMenu() {
    menuEl.innerHTML = '';
    let globalItemIndex = 0;

    Object.keys(data).forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.id = 'cat-' + cat;
        section.innerHTML = `<h2>${cat}</h2>`;

        const grid = document.createElement('div');
        grid.className = 'category-items';

        data[cat].forEach(item => {
            const div = document.createElement('div');
            div.className = 'item animate-fade-in';
            div.style.animationDelay = `${globalItemIndex * 0.05}s`;
            globalItemIndex++;

            div.innerHTML = `
                <div class="item-img-wrapper">
                    <img src="${item.imgUrl || 'assets/img/placeholder.png'}" class="item-img" alt="${item.name}" loading="lazy" />
                </div>
                <div class="info">
                    <div>
                        <h3>${item.name}</h3>
                        <p>${item.description}</p>
                    </div>
                    <div class="item-footer">
                        <div class="price">€${item.price.toFixed(2)}</div>
                        <div class="item-action" data-id="${item.id}"></div>
                    </div>
                </div>
            `;
            grid.appendChild(div);
        });

        section.appendChild(grid);
        menuEl.appendChild(section);
    });

    updateMenuActions();
}

function updateMenuActions() {
    document.querySelectorAll('.item-action').forEach(container => {
        const itemId = container.dataset.id;
        const cartItem = cart[itemId];
        const currentInner = container.firstElementChild;

        if (cartItem && cartItem.qty > 0) {
            if (currentInner && currentInner.classList.contains('menu-qty-selector')) {
                const numEl = currentInner.querySelector('.menu-qty-num');
                if (numEl && numEl.innerText !== String(cartItem.qty)) {
                    numEl.innerText = cartItem.qty;
                    numEl.classList.remove('pop-bounce');
                    void numEl.offsetWidth;
                    numEl.classList.add('pop-bounce');
                }
                return;
            }

            container.innerHTML = `
                <div class="menu-qty-selector pop-in">
                    <button class="menu-minus">-</button>
                    <span class="menu-qty-num pop-bounce">${cartItem.qty}</span>
                    <button class="menu-plus">+</button>
                </div>
            `;

            container.querySelector('.menu-minus').onclick = (e) => {
                e.stopPropagation();
                cart[itemId].qty--;
                if (cart[itemId].qty <= 0) delete cart[itemId];
                updateCart();
            };

            container.querySelector('.menu-plus').onclick = (e) => {
                e.stopPropagation();
                cart[itemId].qty++;
                updateCart();
            };
        } else {
            if (currentInner && currentInner.classList.contains('menu-qty-selector')) {
                container.innerHTML = `<button class="add-btn pop-in">Add +</button>`;
            } else if (!currentInner || !currentInner.classList.contains('add-btn')) {
                container.innerHTML = `<button class="add-btn">Add +</button>`;
            }

            const btn = container.querySelector('.add-btn');
            if (btn) {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const item = itemLookup[itemId];
                    if (item) addToCart(item);
                };
            }
        }
    });
}

function initScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id.replace('cat-', '');
                document.querySelectorAll('.chip').forEach(ch => ch.classList.remove('active'));
                const activeChip = document.querySelector(`.chip[data-category="${id}"]`);
                if (activeChip) {
                    activeChip.classList.add('active');
                    activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }
        });
    }, { rootMargin: '-130px 0px -70% 0px' });

    document.querySelectorAll('.category-section').forEach(sec => observer.observe(sec));
}

// ===== KOŠÍK LOGIKA =====
function addToCart(item) {
    cart[item.id] = cart[item.id]
        ? { ...cart[item.id], qty: cart[item.id].qty + 1 }
        : { ...item, qty: 1 };
    updateCart();
}

function updateCart() {
    cartItemsEl.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    Object.values(cart).forEach(i => {
        total += i.price * i.qty;
        itemCount += i.qty;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div class="cart-item-details">
                <strong>${i.name}</strong>
                <small>€${i.price.toFixed(2)} each</small>
            </div>
            <div class="qty">
                <button class="minus">-</button>
                <span class="cart-qty-num">${i.qty}</span>
                <button class="plus">+</button>
            </div>
        `;

        row.querySelector('.minus').onclick = () => {
            i.qty--;
            if (i.qty <= 0) delete cart[i.id];
            updateCart();
        };

        row.querySelector('.plus').onclick = () => {
            i.qty++;
            updateCart();
        };
        cartItemsEl.appendChild(row);
    });

    submitBtn.innerHTML = `
        <span class="btn-text">Submit Order – €${total.toFixed(2)}</span>
        <div class="submit-spinner"></div>
    `;
    submitBtn.disabled = itemCount === 0;

    if (itemCount > 0) {
        openCartBtn.style.display = 'block';
        cartCountEl.style.display = 'flex';

        if (cartCountEl.innerText !== String(itemCount)) {
            cartCountEl.innerText = itemCount;
            cartCountEl.classList.remove('pop-bounce');
            void cartCountEl.offsetWidth;
            cartCountEl.classList.add('pop-bounce');

            openCartBtn.classList.remove('jello-click');
            void openCartBtn.offsetWidth;
            openCartBtn.classList.add('jello-click');
        }
    } else {
        openCartBtn.style.display = 'none';
        cartCountEl.style.display = 'none';
        cartCountEl.innerText = '0';
        if (cartEl.classList.contains('open')) toggleCart(false);
    }

    updateMenuActions();
}

function toggleCart(show) {
    if (show) {
        cartEl.classList.add('open');
        cartOverlayEl.classList.add('show');
        if (window.innerWidth < 768) document.body.classList.add('no-scroll');
    } else {
        cartEl.classList.remove('open');
        cartOverlayEl.classList.remove('show');
        document.body.classList.remove('no-scroll');
    }
}

openCartBtn.onclick = () => toggleCart(true);
closeCartBtn.onclick = () => toggleCart(false);
cartOverlayEl.onclick = () => toggleCart(false);

// ===== FLUID ANIMÁCIA KONFETÍ =====
function fireConfetti(button) {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
        let dot = document.createElement('div');
        dot.className = 'confetti-dot';
        document.body.appendChild(dot);

        let angle = (i * 45) * Math.PI / 180;
        let distance = 50;
        let tx = Math.cos(angle) * distance;
        let ty = Math.sin(angle) * distance;

        dot.style.left = centerX + 'px';
        dot.style.top = centerY + 'px';
        dot.style.setProperty('--tx', `${tx}px`);
        dot.style.setProperty('--ty', `${ty}px`);

        setTimeout(() => dot.remove(), 600);
    }
}

submitBtn.onclick = async () => {
    if (!tableNumber) {
        tableInput.focus();
        tableInput.style.borderColor = 'var(--danger)';
        errorEl.style.display = 'block';
        errorEl.innerText = 'Please enter a valid table number before submitting.';
        cartEl.querySelector('.cart-main').scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const orderBody = {
        tableNumber: tableNumber,
        note: noteEl.value.trim(),
        items: Object.values(cart).map(i => ({
            menuItemId: i.id,
            quantity: i.qty,
        })),
    };

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');

    try {
        const res = await fetch(`${API}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderBody),
        });

        if (!res.ok) {
            const err = await res.json();
            const msg = err.errors ? err.errors.join('\n') : 'Error sending order.';
            showToast(msg, 'error');
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
            return;
        }

        const order = await res.json();

        submitBtn.classList.remove('is-loading');
        submitBtn.classList.add('is-success-circle');
        submitBtn.innerHTML = `
            <svg class="success-svg" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
            </svg>
        `;

        fireConfetti(submitBtn);

        setTimeout(() => {
            submitBtn.classList.remove('is-success-circle');
            submitBtn.classList.add('is-success-full');
            submitBtn.innerHTML = `<span class="btn-text success-text">Sent to Kitchen! 👨‍🍳</span>`;
        }, 800);

        setTimeout(() => {
            cart = {};
            noteEl.value = '';
            toggleCart(false);

            setTimeout(() => {
                submitBtn.classList.remove('is-success-full');
                updateCart();
            }, 400);

            showToast(`Objednávka #${order.id || ''} bola odoslaná!`, 'success');
        }, 2200);

    } catch (err) {
        console.error('Submit error:', err);
        showToast('Nepodarilo sa odoslať objednávku.', 'error');
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
    }
};