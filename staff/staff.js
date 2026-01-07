const allTAb = document.querySelector(".tab.all");
const pendingTab = document.querySelector(".tab.pending");
const preparingTab = document.querySelector(".tab.preparing");
const readyTab = document.querySelector(".tab.ready");
const deliveredTab = document.querySelector(".tab.delivered");
const clearAllBtn = document.querySelector(".btn-clear");

// nastaví tab all ako aktívny po načítaní stránky
allTAb.classList.add("active");

// funkcia počíta objednávky podľa statusu a aktualizuje text tabov
function updateTabCounters() {
    const allCount = document.querySelectorAll(".order-card").length;
    const pendingCount = document.querySelectorAll('.order-card[data-status="pending"]').length;
    const preparingCount = document.querySelectorAll('.order-card[data-status="preparing"]').length;
    const readyCount = document.querySelectorAll('.order-card[data-status="ready"]').length;
    const deliveredCount = document.querySelectorAll('.order-card[data-status="delivered"]').length;

    // vypísanie do html 
    allTAb.textContent = `All Orders (${allCount})`;
    pendingTab.textContent = `Pending (${pendingCount})`;
    preparingTab.textContent = `Preparing (${preparingCount})`;
    readyTab.textContent = `Ready (${readyCount})`;
    deliveredTab.textContent = `Delivered (${deliveredCount})`;
}

// updatne counter v taboch hned po spustení
updateTabCounters();

// filtrovanie objednávok podľa kliknutého tabu
function statusFilter(click) {
    const tabButton = click.currentTarget;
    const cards = document.querySelectorAll(".order-card");

    // vytvorí empty state do premennej
    const emptyState = document.createElement("div");
    emptyState.classList.add("empty-state");
    emptyState.innerHTML = `
        <div class="icon">!</div>
        <h2>No orders found</h2>
        <p>No orders have been placed yet.</p>
    `;

    // odstráni active taby
    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });

    // kliknutý tab dá ako active
    tabButton.classList.add("active");

    // vyberie iba karty s kliknutym statusom
    const filteredCards = document.querySelectorAll(`.order-card[data-status="${tabButton.dataset.status}"]`);

    // odstráni starý empty state ak existuje
    const existingEmpty = document.querySelector(".empty-state");
    if (existingEmpty) existingEmpty.remove();

    // zobrazí všetky objednávky ak je zvolený tab all
    if (tabButton.dataset.status === "all") {
        cards.forEach(card => card.style.display = "block");
        if (cards.length === 0) document.querySelector(".content").appendChild(emptyState); //ak nie sú žiadné pridá do html empty state
        return;
    }

    // skryje všetky karty
    cards.forEach(card => card.style.display = "none");

    if (filteredCards.length === 0) {
        document.querySelector(".content").appendChild(emptyState); // zobrazí empty state ak pre určitý status neexistujú objednávky
    } else {
        filteredCards.forEach(card => card.style.display = "block"); // zobrazí iba karty z určitého statusu
    }
}

// pridá click event listener ku každému tabu
document.querySelectorAll(".tab").forEach(tabButton => {
    tabButton.addEventListener("click", statusFilter);
});

// zachytáva kliky na tlačidlá delete a zmenenie stavu objednávky
document.addEventListener("click", (c) => {
    const btn = c.target;

    // posúva objednávku do ďalšieho statusu po kliknutí na tlačidlo zmenenia stavu objednávky
    if (btn.classList.contains("btn-primary")) {
        const card = btn.closest(".order-card"); // vyberie kartu v ktorej bolo tlačidlo stlačené
        const statusText = card.querySelector(".status"); // vyberie časť karty kde je zapísaný aktuálny status karty

        let nextStatus = ""; // status v karte v html
        let nextButton = ""; // text v tlačitku
        let nextText = ""; // text kde je napisaný stav objednávky

        // určí nasledujúci stav objednávky
        switch (card.dataset.status) {
            case "pending":
                nextStatus = "preparing";
                nextButton = "✅ Mark as ready";
                nextText = "📦 Preparing";
                break;
            case "preparing":
                nextStatus = "ready";
                nextButton = "🚚 Mark as delivered";
                nextText = "✅ Ready";
                break;
            case "ready":
                nextStatus = "delivered";
                btn.remove();
                nextText = "🚚 Delivered";
                break;
        }

        // aktualizuje status objednávky karty v html
        card.dataset.status = nextStatus;

        // aktualizuje text a stav tlačidla
        if (btn && nextButton){ 
            btn.textContent = nextButton;
            btn.dataset.status = nextStatus;
        }

        // aktualizuje text a triedu statusu
        statusText.textContent = nextText;
        statusText.className = `status ${nextStatus}`;

        // aktualizuje počty v taboch
        updateTabCounters();

        // aktulizuje roztriedenie kariet
        const activeTab = document.querySelector(".tab.active") || document.querySelector(".tab.all");
        statusFilter({ currentTarget: activeTab });
    }

    // odstráni konkrétnu objednávku po kliknutí na delete tlačidlo
    if (btn.classList.contains("btn-delete")) {
        const card = btn.closest(".order-card"); // zisti aktuálnu kartu
        if (card) {
            card.remove(); // odstráni kartu

            // aktulizuje roztriedenie kariet
            const activeTab = document.querySelector(".tab.active") || document.querySelector(".tab.all");
            statusFilter({ currentTarget: activeTab });

            // aktualizuje počty v taboch
            updateTabCounters();
        }
    }
});

// zobrazí popup okno po kliknutí na clear all
clearAllBtn.addEventListener("click", () => {
    // vytvorí pop up okno
    const popUp = document.createElement("div");
    popUp.classList.add("popUp-overlay");
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

    // zatvorí popup po kliknutí na no
    popUp.querySelector(".popUp-no").addEventListener("click", () => {
        popUp.remove();
    });

    // vymaže všetky objednávky po kliknutí na yes
    popUp.querySelector(".popUp-yes").addEventListener("click", () => {
        document.querySelectorAll(".order-card").forEach(card => card.remove());
        popUp.remove();
        // aktualizuje počty v taboch
        updateTabCounters();
        // vráti do all tabu
        statusFilter({ currentTarget: document.querySelector(".tab.all") });
    });
});
