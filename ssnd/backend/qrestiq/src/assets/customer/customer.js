const API = '/api';

let data = {};
let cart = {};
let tableNumber = null;
let availableTables = [];

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

    // Spustiť animáciu
    setTimeout(() => toast.classList.add('show'), 10);

    // Odstrániť po 3 sekundách
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // Čas na dokončenie CSS transition
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
}

// ===== NAČÍTANIE STOLOV =====
fetch(`${API}/tables`)
    .then(res => res.json())
    .then(tables => {
        availableTables = tables.map(t => t.number);
        setTableFromQuery();
    })
    .catch(err => {
        console.error('Error loading tables:', err);
        // Fallback pre testovanie, ak API nebeží (voliteľné vymazať)
        availableTables = [1, 2, 3, 4, 5];
    });

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function setTableFromQuery() {
    const tableParam = getQueryParam('table');

    if (tableParam === null) {
        const savedTable = localStorage.getItem('qrestiq_table');
        const parsedSaved = parseInt(savedTable);

        if (savedTable && !isNaN(parsedSaved) && availableTables.includes(parsedSaved)) {
            setValidTable(parsedSaved);
        } else {
            resetTableState();
        }
        return;
    }

    const table = parseInt(tableParam);
    if (!isNaN(table) && availableTables.includes(table)) {
        setValidTable(table);
    } else {
        setInvalidTable();
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
        c.dataset.category = cat; // pre ľahšie vyhľadávanie v ScrollSpy

        c.onclick = () => {
            scrollToCategory(cat);
        };
        categoriesEl.appendChild(c);
    });
}

function scrollToCategory(cat) {
    const el = document.getElementById('cat-' + cat);
    if (el) {
        // scroll-margin-top v CSS rieši presný odskok
        el.scrollIntoView({ behavior: 'smooth' });
    }
}

function renderAllMenu() {
    menuEl.innerHTML = '';

    Object.keys(data).forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.id = 'cat-' + cat;
        section.innerHTML = `<h2>${cat}</h2>`;

        const grid = document.createElement('div');
        grid.className = 'category-items';

        data[cat].forEach(item => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <img src="${item.img || 'assets/img/placeholder.png'}" class="item-img" alt="${item.name}" loading="lazy" />
                <div class="info">
                    <div>
                        <h3>${item.name}</h3>
                        <p>${item.desc}</p>
                    </div>
                    <div class="item-footer">
                        <div class="price">€${item.price.toFixed(2)}</div>
                        <button class="add-btn">Add +</button>
                    </div>
                </div>
            `;

            const btn = div.querySelector('.add-btn');
            btn.onclick = (e) => {
                addToCart(item);

                // Vizuálny feedback "Pridané"
                const originalText = btn.innerText;
                btn.innerText = 'Added ✓';
                btn.classList.add('added');

                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.remove('added');
                }, 1000);
            };

            grid.appendChild(div);
        });

        section.appendChild(grid);
        menuEl.appendChild(section);
    });
}

// ===== SCROLL SPY (Sledovanie rolovania pre aktívnu kategóriu) =====
function initScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id.replace('cat-', '');

                document.querySelectorAll('.chip').forEach(ch => ch.classList.remove('active'));
                const activeChip = document.querySelector(`.chip[data-category="${id}"]`);

                if (activeChip) {
                    activeChip.classList.add('active');
                    // Jemne posunie zoznam s chipmi, aby bol aktívny viditeľný
                    activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }
        });
    }, {
        // Spustí sa, keď hlavička kategórie prejde hornou 1/3 obrazovky
        rootMargin: '-130px 0px -70% 0px'
    });

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
                <button class="minus" aria-label="Decrease quantity">-</button>
                <span>${i.qty}</span>
                <button class="plus" aria-label="Increase quantity">+</button>
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

    submitBtn.innerText = `Submit Order – €${total.toFixed(2)}`;
    submitBtn.disabled = itemCount === 0;

    if (itemCount > 0) {
        openCartBtn.style.display = 'block';
        cartCountEl.style.display = 'flex';
        cartCountEl.innerText = itemCount;
    } else {
        openCartBtn.style.display = 'none';
        cartCountEl.style.display = 'none';
        if (cartEl.classList.contains('open')) {
            toggleCart(false);
        }
    }
}

function toggleCart(show) {
    if (show) {
        cartEl.classList.add('open');
        cartOverlayEl.classList.add('show');
        // Vypíname no-scroll len na mobile, na desktope je to Side Drawer
        if (window.innerWidth < 768) {
            document.body.classList.add('no-scroll');
        }
    } else {
        cartEl.classList.remove('open');
        cartOverlayEl.classList.remove('show');
        document.body.classList.remove('no-scroll');
    }
}

openCartBtn.onclick = () => toggleCart(true);
closeCartBtn.onclick = () => toggleCart(false);
cartOverlayEl.onclick = () => toggleCart(false);

// ===== ODOSLANIE OBJEDNÁVKY =====
submitBtn.onclick = async () => {
    if (!tableNumber) {
        tableInput.focus();
        tableInput.style.borderColor = 'var(--danger)';
        errorEl.style.display = 'block';
        errorEl.innerText = 'Please enter a valid table number before submitting.';

        // Na mobiloch scrolneme košík úplne hore, aby videl chybu
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
    submitBtn.innerText = 'Sending...';

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
            submitBtn.disabled = false;
            submitBtn.innerText = `Submit Order – €${Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}`;
            return;
        }

        const order = await res.json();

        // Reset
        cart = {};
        noteEl.value = '';
        updateCart();
        toggleCart(false);

        showToast(`Objednávka #${order.id || ''} bola úspešne odoslaná!`, 'success');

    } catch (err) {
        console.error('Submit error:', err);
        showToast('Nepodarilo sa odoslať objednávku. Skontrolujte pripojenie.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = `Submit Order – €${Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}`;
    }
};