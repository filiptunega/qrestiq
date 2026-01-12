// hlavné dáta menu (načíta sa z JSONu)
let data = {};

// košík – ukladá položky podľa ID
let cart = {};

// aktuálne aktívna kategória (zatiaľ len info)
let activeCategory = '';

// číslo stola, z ktorého ide objednávka
let tableNumber = null;

// zoznam povolených / dostupných stolov
let availableTables = [];

// DOM elementy
const categoriesEl = document.getElementById('categories');
const menuEl = document.getElementById('menu');
const cartEl = document.getElementById('cart');
const cartItemsEl = document.getElementById('cartItems');
const openCartBtn = document.getElementById('openCart');
const submitBtn = document.getElementById('submitBtn');
const noteEl = document.getElementById('note');
const tableInput = document.querySelector('header .input input');
const errorEl = document.querySelector('.input .error');


// ===== NAČÍTANIE DOSTUPNÝCH STOLOV =====
fetch('../json/tables.json')
    .then(res => res.json())
    .then(json => {
        // uložíme si dostupné stoly
        availableTables = json.availableTables;

        // skúsime načítať stôl z URL (?table=3)
        setTableFromQuery();
    })
    .catch(err => console.error('Error loading tables:', err));


// získa parameter z URL (napr. ?table=5)
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}


// nastaví číslo stola z URL, ak je platné
function setTableFromQuery() {
    const table = parseInt(getQueryParam('table'));

    // ak je číslo a je medzi dostupnými stolmi
    if (!isNaN(table) && availableTables.includes(table)) {
        tableNumber = table;
        tableInput.value = tableNumber;
        errorEl.style.display = 'none';
        tableInput.style.borderColor = '';
    } else {
        // neplatný alebo žiadny stôl
        tableNumber = null;
        tableInput.value = '';
        errorEl.style.display = 'block';
        tableInput.style.borderColor = 'red';
    }
}


// kontrola stola pri ručnom písaní
tableInput.addEventListener('input', () => {
    let val = parseInt(tableInput.value);

    if (!isNaN(val) && availableTables.includes(val)) {
        tableNumber = val;
        errorEl.style.display = 'none';
        tableInput.style.borderColor = '';
    } else {
        tableNumber = null;
        errorEl.style.display = 'block';
        tableInput.style.borderColor = 'red';
    }
});


// ===== NAČÍTANIE MENU =====
fetch('../json/menu.json')
    .then(res => res.json())
    .then(json => {
        data = json;

        // nastavíme prvú kategóriu ako aktívnu
        activeCategory = Object.keys(data)[0];

        renderCategories();
        renderAllMenu();
    })
    .catch(err => console.error('Error loading menu:', err));


// vykreslí horné chipy s kategóriami
function renderCategories() {
    categoriesEl.innerHTML = '';

    Object.keys(data).forEach(cat => {
        const c = document.createElement('div');
        c.className = 'chip';
        c.innerText = cat;

        // po kliknutí scroll na danú kategóriu
        c.onclick = () => scrollToCategory(cat);

        categoriesEl.appendChild(c);
    });
}


// plynulé prescrollovanie na kategóriu
function scrollToCategory(cat) {
    const el = document.getElementById('cat-' + cat);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// vykreslí celé menu – všetky kategórie aj položky
function renderAllMenu() {
    menuEl.innerHTML = '';

    Object.keys(data).forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.id = 'cat-' + cat;
        section.innerHTML = `<h2>${cat}</h2>`;

        // každá položka v kategórii
        data[cat].forEach(item => {
            const div = document.createElement('div');
            div.className = 'item';

            div.innerHTML = `
                <img src="${item.img}" />
                <div class="info">
                    <h3>${item.name}</h3>
                    <p>${item.desc}</p>
                    <div class="price">$${item.price.toFixed(2)}</div>
                </div>
                <button class="add">Add</button>
            `;

            // pridanie do košíka
            div.querySelector('.add').onclick = () => addToCart(item);

            section.appendChild(div);
        });

        menuEl.appendChild(section);
    });
}


// ===== KOŠÍK =====

// pridanie položky do košíka
function addToCart(item) {
    // bez vybraného stola sa nedá objednávať
    if (!tableNumber) return;

    // ak už existuje, zvýšime množstvo
    cart[item.id] = cart[item.id]
        ? { ...cart[item.id], qty: cart[item.id].qty + 1 }
        : { ...item, qty: 1 };

    updateCart();
}


// aktualizácia košíka + ceny
function updateCart() {
    cartItemsEl.innerHTML = '';
    let total = 0;

    Object.values(cart).forEach(i => {
        total += i.price * i.qty;

        const row = document.createElement('div');
        row.className = 'cart-item';

        row.innerHTML = `
            <div>
                <strong>${i.name}</strong><br>
                <small>$${i.price.toFixed(2)} each</small>
            </div>
            <div class="qty">
                <button>-</button>
                ${i.qty}
                <button>+</button>
            </div>
        `;

        const [minus, plus] = row.querySelectorAll('button');

        // zníženie množstva
        minus.onclick = () => {
            i.qty--;
            if (i.qty <= 0) delete cart[i.id];
            updateCart();
        };

        // zvýšenie množstva
        plus.onclick = () => {
            i.qty++;
            updateCart();
        };

        cartItemsEl.appendChild(row);
    });

    // poznámka k objednávke
    const noteText = noteEl.value.trim();

    submitBtn.innerText =
        `Submit Order – $${total.toFixed(2)}` +
        (noteText ? ' (Note added)' : '');

    // tlačidlo košíka sa zobrazí len keď niečo v ňom je
    openCartBtn.style.display =
        Object.keys(cart).length > 0 ? 'block' : 'none';
}


// otvorenie / zatvorenie košíka
function toggleCart(show) {
    cartEl.style.display = show ? 'flex' : 'none';
}

openCartBtn.onclick = () => toggleCart(true);


// ===== ODOSLANIE OBJEDNÁVKY =====
submitBtn.onclick = () => {
    // ak nie je zvolený stôl, fokus na input
    if (!tableNumber) {
        tableInput.focus();
        return;
    }

    // finálny objekt objednávky
    const order = {
        table: tableNumber,
        items: cart,
        note: noteEl.value.trim(),
        total: Object.values(cart).reduce(
            (sum, i) => sum + i.price * i.qty,
            0
        )
    };

    console.log('Order submitted:', order);

    // reset po odoslaní
    cart = {};
    noteEl.value = '';
    updateCart();
    toggleCart(false);
};