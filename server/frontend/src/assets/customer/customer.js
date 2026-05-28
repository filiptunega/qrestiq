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
        openCartBtn.classList.add('has-items');
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
        openCartBtn.classList.remove('has-items');
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

// ===== SPARK BURST =====
function fireSparks(x, y, count = 20) {
    const colors = ['#28a745', '#ffd700', '#ff6b35', '#00d4ff', '#fff', '#a8ff78'];
    for (let i = 0; i < count; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const dist = 60 + Math.random() * 120;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const size = 4 + Math.random() * 8;
        const dur = 0.5 + Math.random() * 0.6;
        const delay = Math.random() * 0.15;
        spark.style.cssText = `
            left:${x}px; top:${y}px;
            --tx:${tx}px; --ty:${ty}px;
            --size:${size}px; --color:${colors[Math.floor(Math.random() * colors.length)]};
            --dur:${dur}s; --delay:${delay}s;
        `;
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), (dur + delay) * 1000 + 100);
    }
}

// ===== CONFETTI PIECES =====
function fireConfettiPieces(x, y, count = 40) {
    const colors = ['#28a745', '#ffd700', '#ff4d4d', '#00bcd4', '#9c27b0', '#ff9800', '#ffffff'];
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        const angle = -180 + Math.random() * 360;
        const dist = 80 + Math.random() * 200;
        const tx = Math.cos(angle * Math.PI / 180) * dist;
        const ty = -(80 + Math.random() * 250);
        const w = 6 + Math.random() * 10;
        const h = 4 + Math.random() * 8;
        const dur = 0.9 + Math.random() * 0.8;
        const delay = Math.random() * 0.3;
        const rot = -720 + Math.random() * 1440;
        const radius = Math.random() > 0.5 ? '50%' : '2px';
        p.style.cssText = `
            left:${x}px; top:${y}px;
            --tx:${tx}px; --ty:${ty}px;
            --w:${w}px; --h:${h}px;
            --color:${colors[Math.floor(Math.random() * colors.length)]};
            --dur:${dur}s; --delay:${delay}s;
            --rot:${rot}deg; --radius:${radius};
        `;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), (dur + delay) * 1000 + 100);
    }
}

// ===== RECEIPT PRINT + FLY ANIMATION =====
function buildReceiptHTML(orderItems, total, table) {
    const now = new Date();
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('sk-SK');

    let rows = '';
    orderItems.forEach(item => {
        rows += `<div class="r-row"><span>${item.qty}× ${item.name}</span><span>€${(item.price * item.qty).toFixed(2)}</span></div>`;
    });

    return `
        <div class="r-logo">QRESTIQ</div>
        <div class="r-table">Table #${table}</div>
        <div style="text-align:center;font-size:9px;color:#888;">${date} · ${time}</div>
        <div class="r-divider"></div>
        ${rows}
        <div class="r-divider"></div>
        <div class="r-total"><span>TOTAL</span><span>€${total.toFixed(2)}</span></div>
        <div class="r-divider"></div>
        <div class="r-footer">Thank you! 👨‍🍳</div>
        <div class="r-footer">Sending to kitchen...</div>
    `;
}

function playReceiptAndFlyAnimation(orderItems, total, table, onDone) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'receipt-overlay';
    overlay.innerHTML = `
        <div class="receipt-backdrop"></div>
        <div class="receipt-printer">
            <div class="receipt-printer-light"></div>
        </div>
        <div class="receipt-paper">
            <div class="receipt-paper-inner">${buildReceiptHTML(orderItems, total, table)}</div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Calculate receipt height based on items
    const lineHeight = 18;
    const baseHeight = 170;
    const receiptHeight = baseHeight + (orderItems.length * lineHeight);
    overlay.querySelector('.receipt-paper').style.setProperty('--receipt-target-height', receiptHeight + 'px');

    // Phase 1: printer slides in + paper grows
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });

    // Phase 2: receipt paper lines print with sound-like visual pulse
    const paperInner = overlay.querySelector('.receipt-paper-inner');
    const rows = paperInner.querySelectorAll('.r-row');
    rows.forEach((row, i) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(4px)';
        setTimeout(() => {
            row.style.transition = 'opacity 0.2s ease, transform 0.2s var(--spring-ease)';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
            // Tiny paper wobble each line
            overlay.querySelector('.receipt-paper').style.transform = 'translateX(-50%) rotate(' + (Math.random() * 0.6 - 0.3) + 'deg)';
            setTimeout(() => {
                overlay.querySelector('.receipt-paper').style.transition = 'transform 0.15s var(--spring-ease)';
                overlay.querySelector('.receipt-paper').style.transform = 'translateX(-50%) rotate(0deg)';
            }, 60);
        }, 800 + i * 80);
    });

    // Phase 3: paper tears off and flies to top-right (kitchen)
    const flyDelay = 1000 + orderItems.length * 80 + 400;

    setTimeout(() => {
        const paperEl = overlay.querySelector('.receipt-paper');
        const paperRect = paperEl.getBoundingClientRect();

        // Create flying receipt
        const flyEl = document.createElement('div');
        flyEl.className = 'receipt-fly';
        flyEl.style.cssText = `
            left: ${paperRect.left + paperRect.width / 2 - 35}px;
            top: ${paperRect.top + 20}px;
        `;
        document.body.appendChild(flyEl);

        // Fade out original receipt paper
        paperEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        paperEl.style.opacity = '0';
        paperEl.style.transform = 'translateX(-50%) scale(0.9)';

        // Animate fly el to top of screen
        flyEl.style.animation = 'flyToKitchen 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';

        // Sparks at paper tear
        fireSparks(paperRect.left + paperRect.width / 2, paperRect.top, 12);

        // Kitchen flash at top
        setTimeout(() => {
            const flash = document.createElement('div');
            flash.className = 'kitchen-flash';
            document.body.appendChild(flash);
            flash.style.animation = 'kitchenFlash 0.8s ease forwards';

            // Big confetti burst!
            fireConfettiPieces(window.innerWidth / 2, 60, 60);
            fireSparks(window.innerWidth / 2, 60, 25);

            setTimeout(() => flash.remove(), 800);
            setTimeout(() => flyEl.remove(), 1200);
        }, 700);

        // Dismiss overlay
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 500);
            onDone();
        }, 1100);
    }, flyDelay);
}

submitBtn.onclick = async () => {
    if (!tableNumber) {
        tableInput.focus();
        tableInput.style.borderColor = 'var(--danger)';
        errorEl.style.display = 'block';
        errorEl.innerText = 'Please enter a valid table number before submitting.';
        cartEl.querySelector('.cart-main').scrollTo({ top: 0, behavior: 'smooth' });
        // Shake the submit button
        submitBtn.classList.remove('shake-error');
        void submitBtn.offsetWidth;
        submitBtn.classList.add('shake-error');
        setTimeout(() => submitBtn.classList.remove('shake-error'), 500);
        return;
    }

    const orderItems = Object.values(cart);
    let total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    const orderBody = {
        tableNumber: tableNumber,
        note: noteEl.value.trim(),
        items: orderItems.map(i => ({
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

        // Phase 1: loading → success circle
        submitBtn.classList.remove('is-loading');
        submitBtn.classList.add('is-success-circle');
        submitBtn.innerHTML = `
            <svg class="success-svg" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
            </svg>
        `;

        // Small spark burst on button
        const btnRect = submitBtn.getBoundingClientRect();
        fireSparks(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2, 14);
        fireConfetti(submitBtn);

        // Phase 2: success full text
        setTimeout(() => {
            submitBtn.classList.remove('is-success-circle');
            submitBtn.classList.add('is-success-full');
            submitBtn.innerHTML = `<span class="btn-text success-text">Printing receipt... 🖨️</span>`;
        }, 800);

        // Phase 3: EPIC receipt print + fly animation
        setTimeout(() => {
            playReceiptAndFlyAnimation(orderItems, total, tableNumber, () => {
                // After animation, clear cart and close
                cart = {};
                noteEl.value = '';
                toggleCart(false);

                setTimeout(() => {
                    submitBtn.classList.remove('is-success-full');
                    updateCart();
                }, 400);

                showToast(`Order #${order.id || ''} sent to kitchen! 👨‍🍳`, 'success');
            });
        }, 1000);

    } catch (err) {
        console.error('Submit error:', err);
        showToast('Nepodarilo sa odoslať objednávku.', 'error');
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
    }
};