const API = '/api';

let data = {};
let cart = {};
let tableNumber = null;
let availableTables = [];

// DOM elementy
const categoriesEl = document.getElementById('categories');
const menuEl = document.getElementById('menu');
const cartEl = document.getElementById('cart');
const cartItemsEl = document.getElementById('cartItems');
const openCartBtn = document.getElementById('openCart');
const submitBtn = document.getElementById('submitBtn');
const noteEl = document.getElementById('note');
const tableInput = document.getElementById('cartTableInput');
const errorEl = document.getElementById('cartTableError');
const cartCountEl = document.getElementById('cartCount');


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
    tableInput.style.borderColor = '#ff4d4d';
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
    .catch(err => console.error('Error loading tables:', err));

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
    })
    .catch(err => console.error('Error loading menu:', err));

function renderCategories() {
    categoriesEl.innerHTML = '';

    Object.keys(data).forEach((cat, index) => {
        const c = document.createElement('div');
        c.className = 'chip' + (index === 0 ? ' active' : '');
        c.innerText = cat;
        c.onclick = () => {
            document.querySelectorAll('.chip').forEach(ch => ch.classList.remove('active'));
            c.classList.add('active');
            scrollToCategory(cat);
        };
        categoriesEl.appendChild(c);
    });
}

function scrollToCategory(cat) {
    const el = document.getElementById('cat-' + cat);
    if (el) {
        // Kompenzácia na mobiloch pre fixnú hlavičku + chipy (cca 120px)
        const offset = 120;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

function renderAllMenu() {
    menuEl.innerHTML = '';

    Object.keys(data).forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.id = 'cat-' + cat;
        section.innerHTML = `<h2>${cat}</h2>`;

        data[cat].forEach(item => {
            const div = document.createElement('div');
            div.className = 'item';

            div.innerHTML = `
                <img src="${item.img}" class="item-img" alt="${item.name}" loading="lazy" />
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

            div.querySelector('.add-btn').onclick = () => addToCart(item);
            section.appendChild(div);
        });

        menuEl.appendChild(section);
    });
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

        const minus = row.querySelector('.minus');
        const plus = row.querySelector('.plus');

        minus.onclick = () => {
            i.qty--;
            if (i.qty <= 0) delete cart[i.id];
            updateCart();
        };

        plus.onclick = () => {
            i.qty++;
            updateCart();
        };

        cartItemsEl.appendChild(row);
    });

    submitBtn.innerText = `Submit Order – €${total.toFixed(2)}`;

    if (itemCount > 0) {
        openCartBtn.style.display = 'block';
        cartCountEl.style.display = 'flex';
        cartCountEl.innerText = itemCount;
    } else {
        openCartBtn.style.display = 'none';
        cartCountEl.style.display = 'none';
        toggleCart(false);
    }
}

// Zabezpečenie zablokovania skrolovania na pozadí pre smartfóny
function toggleCart(show) {
    if (show) {
        cartEl.classList.add('open');
        document.body.classList.add('no-scroll');
    } else {
        cartEl.classList.remove('open');
        document.body.classList.remove('no-scroll');
    }
}

openCartBtn.onclick = () => toggleCart(true);


// ===== ODOSLANIE OBJEDNÁVKY =====
submitBtn.onclick = async () => {
    if (!tableNumber) {
        tableInput.focus();
        tableInput.style.borderColor = '#ff4d4d';
        errorEl.style.display = 'block';
        errorEl.innerText = 'Please enter a valid table number before submitting.';
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
    submitBtn.innerText = 'Sending…';

    try {
        const res = await fetch(`${API}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderBody),
        });

        if (!res.ok) {
            const err = await res.json();
            const msg = err.errors ? err.errors.join('\n') : 'Chyba pri odoslaní objednávky.';
            alert(msg);
            return;
        }

        const order = await res.json();

        cart = {};
        noteEl.value = '';
        updateCart();
        toggleCart(false);
        alert(`Objednávka #${order.id} bola úspešne odoslaná!`);

    } catch (err) {
        console.error('Submit error:', err);
        alert('Nepodarilo sa odoslať objednávku. Skúste znova.');
    } finally {
        submitBtn.disabled = false;
    }
};