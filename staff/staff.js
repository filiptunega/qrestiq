const allTAb = document.querySelector(".tab.all");
const pendingTab = document.querySelector(".tab.pending");
const preparingTab = document.querySelector(".tab.preparing");
const readyTab = document.querySelector(".tab.ready");
const deliveredTab = document.querySelector(".tab.delivered");
const clearAllBtn = document.querySelector(".btn-clear");
allTAb.classList.add("active");

function updateTabCounters() {
    const allCount = document.querySelectorAll(".order-card").length;
    const pendingCount = document.querySelectorAll('.order-card[data-status="pending"]').length;
    const preparingCount = document.querySelectorAll('.order-card[data-status="preparing"]').length;
    const readyCount = document.querySelectorAll('.order-card[data-status="ready"]').length;
    const deliveredCount = document.querySelectorAll('.order-card[data-status="delivered"]').length;

    allTAb.textContent = `All Orders (${allCount})`;
    pendingTab.textContent = `Pending (${pendingCount})`;
    preparingTab.textContent = `Preparing (${preparingCount})`;
    readyTab.textContent = `Ready (${readyCount})`;
    deliveredTab.textContent = `Delivered (${deliveredCount})`;
}


updateTabCounters();


function statusFilter(click) {
    const tabButton = click.currentTarget;
    const cards = document.querySelectorAll(".order-card");
    const emptyState = document.createElement("div");
        emptyState.classList.add("empty-state");
        emptyState.innerHTML =`
            <div class="icon">!</div>
            <h2>No orders found</h2>
            <p>No orders have been placed yet.</p>
        `;

    // odstráni active zo všetkých tabov
    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });

    // pridá active na kliknutý tab
    tabButton.classList.add("active");

    const filteredCards = document.querySelectorAll(`.order-card[data-status="${tabButton.dataset.status}"]`);
    // Odstráni starý empty-state, ak existuje
    const existingEmpty = document.querySelector(".empty-state");
    if (existingEmpty) existingEmpty.remove();

    if (tabButton.dataset.status === "all") {
        cards.forEach(card => card.style.display = "block");
        if(document.querySelectorAll(".order-card").length === 0) document.querySelector(".content").appendChild(emptyState);
        return;
    }

    cards.forEach(card => card.style.display = "none");

    

    if(filteredCards.length === 0){
        document.querySelector(".content").appendChild(emptyState); 
    } else {
        filteredCards.forEach(card => card.style.display = "block");
    }
}


// pridaj event listener ku všetkým tabom
document.querySelectorAll(".tab").forEach(tabButton => {
    tabButton.addEventListener("click", statusFilter);
});


document.addEventListener("click", (c) => {
    const btn = c.target;

    if (btn.classList.contains("btn-primary")) {
        const card = btn.closest(".order-card"); //najde najblizsi kartu(order-card) toho tlacidla(primary button)
        const statusText = card.querySelector(".status"); //v karte hlada element kde je status

        let nextStatus = "";
        let nextButton = "";
        let nextText = "";

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

        // update card status
        card.dataset.status = nextStatus;

        // update button
        if (btn) btn.dataset.status = nextStatus;
        if (btn && nextButton) btn.textContent = nextButton;

        // update status text
        statusText.textContent = nextText;
        statusText.className = `status ${nextStatus}`;

        updateTabCounters();
        const activeTab = document.querySelector(".tab.active") || document.querySelector(".tab.all");
        statusFilter({ currentTarget: activeTab });
 
    }

    
    if (btn.classList.contains("btn-delete")) {
        const card = btn.closest(".order-card");
        if (card) { 
            card.remove();
            const activeTab = document.querySelector(".tab.active") || document.querySelector(".tab.all");
            statusFilter({ currentTarget: activeTab });
            updateTabCounters(); 
        }    
    }

});


clearAllBtn.addEventListener("click", () => {
    // Vytvor pop up okno
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

    popUp.querySelector(".popUp-no").addEventListener("click", () => {
        popUp.remove(); // zatvor pop up okno
    });

    popUp.querySelector(".popUp-yes").addEventListener("click", () => {
        document.querySelectorAll(".order-card").forEach(card => card.remove()); // Odstráni všetky order cards
        popUp.remove(); // zatvor pop up okno
        updateTabCounters(); 
        const activeTab = document.querySelector(".tab.all");
        statusFilter({ currentTarget: activeTab });
    });
});
