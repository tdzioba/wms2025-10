/**
 * SmartWMS - Główna logika panelu DEMO
 * Obsługuje: Wykresy, Tabelę Magazynową, Modal dodawania, Nawigację
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- KONFIGURACJA I SELEKTORY ---
    const STORAGE_KEY_INVENTORY = 'smartwms_inventory';
    const STORAGE_KEY_ORDERS = 'smartwms_orders';
    
    // Elementy UI
    const menuItems = document.querySelectorAll('.sidebar-menu li[data-tab]');
    const views = document.querySelectorAll('.content-view');
    const tableBody = document.getElementById('inventory-table-body');
    const searchInput = document.getElementById('search-inventory');
    const pageTitle = document.getElementById('page-header-title');
    
    // Elementy Statystyk
    const elTotalProducts = document.getElementById('total-products');
    const elLowStock = document.getElementById('low-stock-count');
    const elTotalValue = document.getElementById('total-value'); // Opcjonalne
    
    // Modal Dodawania
    const modal = document.getElementById('add-modal');
    const btnAdd = document.getElementById('btn-add-product');
    const btnCloseModal = document.querySelector('.close-modal');
    const formAdd = document.getElementById('add-product-form');

    // Zmienna na instancję wykresu (aby móc go niszczyć przy odświeżaniu)
    let categoryChart = null;

    // --- 1. FUNKCJE POMOCNICZE DANYCH ---

    // Pobieranie danych z LocalStorage
    const loadInventory = () => {
        const data = localStorage.getItem(STORAGE_KEY_INVENTORY);
        return data ? JSON.parse(data) : [];
    };

    // Zapisywanie danych do LocalStorage
    const saveInventory = (data) => {
        localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(data));
    };

    // Ustawienie dzisiejszej daty w nagłówku
    const dateElement = document.getElementById('currentDate');
    if(dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('pl-PL', options);
    }

    // --- 2. NAWIGACJA (SIDEBAR) ---

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.dataset.tab;

            // Zmień klasę active w menu
            document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');

            // Ukryj wszystkie widoki i pokaż wybrany
            views.forEach(view => {
                view.style.display = 'none';
                view.classList.remove('active-view'); // klasa animacji
                if(view.id === `view-${targetTab}`) {
                    view.style.display = 'block';
                    // Małe opóźnienie dla animacji fade-in
                    setTimeout(() => view.classList.add('active-view'), 10);
                }
            });

            // Zaktualizuj tytuł strony
            if(targetTab === 'dashboard') pageTitle.innerText = 'Przegląd magazynu';
            if(targetTab === 'inventory') pageTitle.innerText = 'Stany magazynowe';
            if(targetTab === 'orders') pageTitle.innerText = 'Zamówienia (Wkrótce)';

            // Odśwież dane dla konkretnego widoku
            if(targetTab === 'dashboard') updateDashboard();
            if(targetTab === 'inventory') renderTable(searchInput.value);
        });
    });

    // --- 3. OBSŁUGA TABELI MAGAZYNOWEJ ---

    function renderTable(filterText = '') {
        if(!tableBody) return;
        
        const inventory = loadInventory();
        tableBody.innerHTML = ''; // Wyczyść tabelę

        // Filtrowanie
        const filtered = inventory.filter(item => 
            item.name.toLowerCase().includes(filterText.toLowerCase()) || 
            item.category.toLowerCase().includes(filterText.toLowerCase()) ||
            item.location.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 30px; color: #a4b0be;">
                        <i class="fa-solid fa-magnifying-glass"></i> Nie znaleziono produktów.
                    </td>
                </tr>`;
            return;
        }

        // Generowanie wierszy
        filtered.forEach(item => {
            // Logika kolorów statusu
            let statusClass = 'status-ok';
            let statusLabel = 'Dostępny';

            if(item.quantity === 0) {
                statusClass = 'status-out';
                statusLabel = 'Brak';
            } else if(item.quantity < 10) {
                statusClass = 'status-low';
                statusLabel = 'Niski stan';
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td>${item.category}</td>
                <td><span style="background:#f1f2f6; padding:4px 10px; border-radius:8px; font-size:0.85rem;">${item.location}</span></td>
                <td><strong>${item.quantity}</strong> szt.</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <button class="action-btn delete" onclick="deleteItem(${item.id})" title="Usuń produkt">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Nasłuchiwanie wyszukiwarki
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
    }

    // Globalna funkcja usuwania (musi być przypisana do window, aby zadziałała w onlick="" w HTML)
    window.deleteItem = function(id) {
        // Używamy natywnego confirm (w pełnej wersji byłby to custom modal)
        if(confirm('Czy na pewno chcesz usunąć ten produkt z bazy?')) {
            let inventory = loadInventory();
            inventory = inventory.filter(item => item.id !== id);
            saveInventory(inventory);
            
            // Odśwież widok
            renderTable(searchInput.value);
            updateDashboard(); // Aktualizuj też dane na dashboardzie w tle
        }
    };

    // --- 4. MODAL DODAWANIA PRODUKTU ---

    if(btnAdd && modal) {
        // Otwieranie
        btnAdd.addEventListener('click', () => modal.classList.add('active'));
        
        // Zamykanie X
        btnCloseModal.addEventListener('click', () => modal.classList.remove('active'));
        
        // Zamykanie tłem
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.remove('active');
        });

        // Obsługa formularza
        formAdd.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Pobierz wartości
            const name = document.getElementById('inp-name').value;
            const category = document.getElementById('inp-category').value;
            const qty = parseInt(document.getElementById('inp-qty').value);
            const loc = document.getElementById('inp-loc').value;

            // Walidacja
            if(!name || !loc) return;

            // Nowy obiekt
            const newItem = {
                id: Date.now(), // Unikalne ID na podstawie czasu
                name: name,
                category: category,
                quantity: qty,
                location: loc,
                status: qty === 0 ? 'Brak' : (qty < 10 ? 'Niski stan' : 'Dostępny')
            };

            // Zapisz
            const inventory = loadInventory();
            inventory.push(newItem);
            saveInventory(inventory);

            // Reset formularza i zamknięcie
            formAdd.reset();
            modal.classList.remove('active');
            
            // Odśwież widoki
            renderTable();
            updateDashboard();
            
            // Proste powiadomienie
            alert(`Produkt "${name}" został dodany do bazy!`);
        });
    }

    // --- 5. LOGIKA DASHBOARDU (WYKRESY I STATYSTYKI) ---

    function updateDashboard() {
        const inventory = loadInventory();
        
        // 1. Oblicz liczniki
        const totalQty = inventory.length; // Liczba unikalnych SKU (nie suma sztuk)
        const lowStock = inventory.filter(item => item.quantity < 10).length;
        
        // Symulacja wartości magazynu (losowa średnia cena * ilość)
        let simulatedValue = 0;
        inventory.forEach(item => {
            // Przypisujemy przykładową cenę zależnie od kategorii
            let price = 50; 
            if(item.category === 'Elektronika') price = 1200;
            if(item.category === 'Akcesoria') price = 150;
            simulatedValue += (item.quantity * price);
        });

        // Aktualizacja DOM
        if(elTotalProducts) elTotalProducts.innerText = totalQty;
        if(elLowStock) elLowStock.innerText = lowStock;
        if(elTotalValue) elTotalValue.innerText = simulatedValue.toLocaleString('pl-PL') + ' PLN';

        // 2. Lista ostatnich aktywności (Dynamiczna generacja na podstawie danych)
        // W prawdziwym systemie byłaby to osobna tabela w bazie. Tutaj symulujemy:
        const activityList = document.getElementById('activity-list');
        if(activityList) {
            // Pobieramy 3 ostatnie produkty jako "ostatnio dodane"
            const recentItems = inventory.slice(-3).reverse();
            
            let html = '';
            recentItems.forEach(item => {
                html += `
                <li>
                    <i class="fa-solid fa-plus circle-icon green"></i> 
                    <div>
                        <span style="font-weight:600">Dodano: ${item.name}</span><br>
                        <span style="font-size:0.8rem; color:#aaa">Lokalizacja: ${item.location}</span>
                    </div>
                </li>
                `;
            });
            // Dodajemy jeden "fake" wpis o wydaniu dla realizmu
            html += `
                <li>
                    <i class="fa-solid fa-minus circle-icon orange"></i> 
                    <div>
                        <span style="font-weight:600">Wydanie: Zlecenie #WZ/99</span><br>
                        <span style="font-size:0.8rem; color:#aaa">Jan Kowalski</span>
                    </div>
                </li>
            `;
            activityList.innerHTML = html;
        }

        // 3. Rysowanie Wykresu (Chart.js)
        renderChart(inventory);
    }

    function renderChart(inventory) {
        const ctx = document.getElementById('categoriesChart');
        if(!ctx) return;

        // Grupuj dane po kategorii
        const categories = {};
        inventory.forEach(item => {
            categories[item.category] = (categories[item.category] || 0) + item.quantity;
        });

        const labels = Object.keys(categories);
        const data = Object.values(categories);

        // Usuń stary wykres, jeśli istnieje (zapobiega nakładaniu się)
        if (categoryChart) {
            categoryChart.destroy();
        }

        // Stwórz nowy wykres
        // Kolory spójne z CSS
        categoryChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#7158e2', // Primary Purple
                        '#ffb142', // Accent Orange
                        '#27c93f', // Green
                        '#ff5f56', // Red
                        '#17c0eb'  // Blue
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%', // Grubość pączka
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            font: { family: 'Poppins', size: 12 }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    // --- INITIALIZE ---
    // Uruchom widok startowy
    updateDashboard();
    renderTable(); // Na wypadek gdyby ktoś odświeżył będąc w zakładce Inventory (opcjonalne)
});