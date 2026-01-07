let data = {};
let cart = {};
let activeCategory = '';
let tableNumber = null;
let availableTables = [];

const categoriesEl = document.getElementById('categories');
const menuEl = document.getElementById('menu');
const cartEl = document.getElementById('cart');
const cartItemsEl = document.getElementById('cartItems');
const openCartBtn = document.getElementById('openCart');
const submitBtn = document.getElementById('submitBtn');
const noteEl = document.getElementById('note');
const tableInput = document.querySelector('header .input input');
const errorEl = document.querySelector('.input .error');

// načítanie dostupných stolov
fetch('../json/tables.json')
    .then(res => res.json())
    .then(json => {
        availableTables = json.availableTables;
        setTableFromQuery();
    })
    .catch(err => console.error('Error loading tables:', err));

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function setTableFromQuery() {
    const table = parseInt(getQueryParam('table'));
    if (!isNaN(table) && availableTables.includes(table)) {
        tableNumber = table;
        tableInput.value = tableNumber;
        errorEl.style.display = 'none';
        tableInput.style.borderColor = '';
    } else {
        tableNumber = null;
        tableInput.value = '';
        errorEl.style.display = 'block';
        tableInput.style.borderColor = 'red';
    }
}

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

// načítanie menu
fetch('../json/menu.json')
    .then(res => res.json())
    .then(json => {
        data = json;
        activeCategory = Object.keys(data)[0];
        renderCategories();
        renderAllMenu();
    })
    .catch(err => console.error('Error loading menu:', err));

function renderCategories() {
    categoriesEl.innerHTML = '';
    Object.keys(data).forEach(cat => {
        const c = document.createElement('div');
        c.className = 'chip';
        c.innerText = cat;
        c.onclick = () => scrollToCategory(cat);
        categoriesEl.appendChild(c);
    });
}

function scrollToCategory(cat) {
    const el = document.getElementById('cat-' + cat);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <img src="${item.img}" />
            <div class="info">
              <h3>${item.name}</h3>
              <p>${item.desc}</p>
              <div class="price">$${item.price.toFixed(2)}</div>
            </div>
            <button class="add">Add</button>
          `;
            div.querySelector('.add').onclick = () => addToCart(item);
            section.appendChild(div);
        });

        menuEl.appendChild(section);
    });
}

function addToCart(item) {
    if (!tableNumber) return;
    cart[item.id] = cart[item.id] ? { ...cart[item.id], qty: cart[item.id].qty + 1 } : { ...item, qty: 1 };
    updateCart();
}

function updateCart() {
    cartItemsEl.innerHTML = '';
    let total = 0;
    Object.values(cart).forEach(i => {
        total += i.price * i.qty;
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <div><strong>${i.name}</strong><br><small>$${i.price.toFixed(2)} each</small></div>
          <div class="qty">
            <button>-</button>${i.qty}<button>+</button>
          </div>`;
        const [minus, plus] = row.querySelectorAll('button');
        minus.onclick = () => { i.qty--; if (i.qty <= 0) delete cart[i.id]; updateCart(); };
        plus.onclick = () => { i.qty++; updateCart(); };
        cartItemsEl.appendChild(row);
    });

    const noteText = noteEl.value.trim();
    submitBtn.innerText = `Submit Order – $${total.toFixed(2)}` + (noteText ? " (Note added)" : "");
    openCartBtn.style.display = Object.keys(cart).length > 0 ? 'block' : 'none';
}

function toggleCart(show) { cartEl.style.display = show ? 'flex' : 'none'; }
openCartBtn.onclick = () => toggleCart(true);

submitBtn.onclick = () => {
    if (!tableNumber) {
        tableInput.focus();
        return;
    }
    const order = {
        table: tableNumber,
        items: cart,
        note: noteEl.value.trim(),
        total: Object.values(cart).reduce((sum, i) => sum + i.price * i.qty, 0)
    };
    console.log("Order submitted:", order);
    cart = {};
    noteEl.value = '';
    updateCart();
    toggleCart(false);
};