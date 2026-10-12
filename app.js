// --- Стан додатку ---
let currentLang = 'ua';
let selectedCategory = null;
let selectedServiceData = null;
let selectedHaircutRef = null;
let selectedCondition = null;
let selectedSpecificService = null;
let selectedTimeSlot = null;

// --- Перемикання мов ---
const translations = {
    ua: {
        tab_book: "Запис",
        tab_works: "Приклади робіт",
        tab_loc: "Локація",
        profile_sub: "квір хейр стиліст • перукар дніпро",
        profile_bio: "не відрощуй волосся — відрощуй індивідуальність",
        step1: "1. Оберіть категорію послуг",
        cut_title: "Стрижка",
        cut_sub: "1000 ₴ • 1.5 год",
        color_title: "Фарбування",
        color_sub: "Підбір за станом",
        complex_title: "Стрижка + Фарбування коріння",
        complex_sub: "3000 ₴ • 3 год (до 2 см)",
        haircut_ref_title: "✨ Оберіть приклад стрижки (натисніть, щоб обрати як референс):",
        choose_btn: "Обрати",
        ref_selected_notice: "✓ Обрано фото-референс із портфоліо!",
        step2: "2. Оберіть ваш поточний стан волосся:",
        step3: "3. Доступні послуги та довжина:",
        length_label: "Довжина волосся:",
        len_shoulders: "До плечей",
        len_blades: "Від плечей до лопаток",
        len_below: "Нижче лопаток",
        rules_title: "📌 Важливі примітки та правила майстра:",
        rule_1: "Якщо ваше коріння більше 2 см, послуга фарбування вважається первинною.",
        rule_2: "Я не роблю блонд у техніці (AirTouch, балаяж і т. д.).",
        rule_3: "Я не роблю вихід із чорного або рудого.",
        rule_4: "Я не фарбую волосся після біозавивки, ботоксу, кератину.",
        photo_current_label: "4. Завантажте фото вашого волосся:",
        photo_ref_label: "5. Завантажте фото-референс:",
        selected_service_label: "Обрана послуга та час",
        select_service_placeholder: "Спочатку оберіть категорію вище",
        date_label: "Дата",
        name_label: "Ім'я",
        name_placeholder: "Як звертатись",
        phone_label: "Телефон",
        email_label: "Email (обов'язково)",
        social_label: "Нік / соцмережа",
        slots_label: "Доступні слоти часу",
        slot_notice_init: "⚡ <b>Слот заброньовано на:</b> оберіть послугу та час.",
        deposit_notice: "⚡ <b>Умова броні:</b> Завдаток <b>500 грн</b> підтверджує запис.",
        pay_btn: "Сплатити завдаток 500 ₴ та забронювати",
        modal_title: "Публічний договір оферти",
        modal_btn: "Зрозуміло",
        loc_info: "📍 <b>Локація:</b> м. Дніпро, вул. Володимира Вернадського, 35-Б.<br><br>Приватний простір, мінімалізм та фокус на якості.",
        map_btn: "Відкрити в Google Maps"
    },
    en: {
        tab_book: "Booking",
        tab_works: "Portfolio",
        tab_loc: "Location",
        profile_sub: "queer hair stylist • dnipro",
        profile_bio: "don't grow hair — grow individuality",
        step1: "1. Select service category",
        cut_title: "Haircut",
        cut_sub: "1000 ₴ • 1.5 hrs",
        color_title: "Coloring",
        color_sub: "Selection by condition",
        complex_title: "Haircut + Root Coloring",
        complex_sub: "3000 ₴ • 3 hrs (up to 2 cm)",
        haircut_ref_title: "✨ Choose haircut reference (click to select):",
        choose_btn: "Select",
        ref_selected_notice: "✓ Reference photo selected!",
        step2: "2. Select your current hair condition:",
        step3: "3. Available services & length:",
        length_label: "Hair length:",
        len_shoulders: "To shoulders",
        len_blades: "Shoulder to shoulder blades",
        len_below: "Below shoulder blades",
        rules_title: "📌 Important notes & master rules:",
        rule_1: "If your roots are over 2 cm, coloring is considered primary.",
        rule_2: "I do not do blonde techniques (AirTouch, balayage, etc.).",
        rule_3: "I do not do black or red color correction.",
        rule_4: "I do not dye hair after perm, botox, or keratin.",
        photo_current_label: "4. Upload your hair photo:",
        photo_ref_label: "5. Upload reference photo:",
        selected_service_label: "Selected service & time",
        select_service_placeholder: "First select a category above",
        date_label: "Date",
        name_label: "Name",
        name_placeholder: "How to address you",
        phone_label: "Phone",
        email_label: "Email (required)",
        social_label: "Nickname / social",
        slots_label: "Available time slots",
        slot_notice_init: "⚡ <b>Slot status:</b> select service and time.",
        deposit_notice: "⚡ <b>Booking term:</b> <b>500 UAH</b> deposit confirms booking.",
        pay_btn: "Pay deposit 500 ₴ & book",
        modal_title: "Public Offer Agreement",
        modal_btn: "Understood",
        loc_info: "📍 <b>Location:</b> Dnipro, 35-B Volodymyr Vernadskyi St.<br><br>Private space, minimalism and focus on quality.",
        map_btn: "Open in Google Maps"
    }
};

function toggleLang() {
    currentLang = currentLang === 'ua' ? 'en' : 'ua';
    let langBtn = document.getElementById('langToggle');
    if (langBtn) langBtn.innerText = currentLang.toUpperCase() + ' / ' + (currentLang === 'ua' ? 'EN' : 'UA');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        let key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerHTML = translations[currentLang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        let key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            el.setAttribute('placeholder', translations[currentLang][key]);
        }
    });
}

// --- Перемикання тем ---
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    let themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.innerText = newTheme === 'dark' ? '🌙 / ☀️' : '☀️ / 🌙';
}

// --- Перемикання вкладок ---
function switchTab(tabName, element) {
    document.querySelectorAll('.section-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.quick-nav .nav-chip').forEach(chip => chip.classList.remove('active'));

    if (tabName === 'book') {
        document.getElementById('paneBook').classList.add('active');
    } else if (tabName === 'works') {
        document.getElementById('paneWorks').classList.add('active');
    } else if (tabName === 'loc') {
        document.getElementById('paneLoc').classList.add('active');
    }
    if (element) element.classList.add('active');
}

// --- Вибір категорії послуг ---
function selectMainCategory(category) {
    selectedCategory = category;
    
    // Візуальне виділення карток
    document.querySelectorAll('.service-card-mini').forEach(card => card.classList.remove('selected'));
    if (category === 'cut') document.getElementById('mainCardCut').classList.add('selected');
    if (category === 'color') document.getElementById('mainCardColor').classList.add('selected');
    if (category === 'complex') document.getElementById('mainCardComplex').classList.add('selected');

    // Керування видимістю блоків
    document.getElementById('haircutExamplesSection').style.display = (category === 'cut' || category === 'complex') ? 'block' : 'none';
    document.getElementById('photoUploadSection').style.display = 'block';
    
    let subMenu = document.getElementById('categorySubmenu');
    let coloringOptions = document.getElementById('coloringSubOptions');

    if (category === 'color') {
        subMenu.style.display = 'block';
        coloringOptions.style.display = 'block';
        renderSubmenuItems();
    } else if (category === 'complex') {
        subMenu.style.display = 'none';
        coloringOptions.style.display = 'block';
        selectedServiceData = { title: "Стрижка + Фарбування коріння", price: 3000, duration: "3 год" };
        updateSelectedInput();
    } else {
        subMenu.style.display = 'none';
        coloringOptions.style.display = 'none';
        selectedServiceData = { title: "Стрижка", price: 1000, duration: "1.5 год" };
        updateSelectedInput();
    }
}

// --- Вибір референсу стрижки ---
function selectHaircutReference(imgName, element) {
    document.querySelectorAll('.haircut-carousel-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
    selectedHaircutRef = imgName;
    document.getElementById('selectedRefNotice').style.display = 'block';
}

// --- Рендеринг стану волосся для фарбування ---
function renderSubmenuItems() {
    let container = document.getElementById('submenuItems');
    container.innerHTML = `
        <div class="sub-service-card" onclick="selectHairCondition('natural', 'Натуральне волосся (не фарбоване)', this)">
            <div>
                <div class="s-title">Натуральне волосся</div>
                <div class="s-sub">Рівномірний тон або первинне фарбування</div>
            </div>
        </div>
        <div class="sub-service-card" onclick="selectHairCondition('colored', 'Фарбоване раніше волосся', this)">
            <div>
                <div class="s-title">Фарбоване волосся</div>
                <div class="s-sub">Потребує оновлення або вирівнювання кольору</div>
            </div>
        </div>
    `;
}

function selectHairCondition(conditionKey, conditionTitle, element) {
    document.querySelectorAll('.sub-service-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    selectedCondition = conditionTitle;
    
    // Показуємо доступні послуги фарбування
    let specList = document.getElementById('specificServicesList');
    specList.innerHTML = `
        <div class="sub-service-card selected" onclick="selectSpecificColorService('Фарбування в один тон', 2200, this)">
            <div>
                <div class="s-title">Фарбування в один тон</div>
                <div class="s-sub">2200 ₴ • 2 год</div>
            </div>
        </div>
    `;
    selectedServiceData = { title: `Фарбування (${conditionTitle})`, price: 2200, duration: "2 год" };
    updateSelectedInput();
}

function selectSpecificColorService(title, price, element) {
    document.querySelectorAll('#specificServicesList .sub-service-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    selectedServiceData = { title: title, price: price, duration: "2 год" };
    updateSelectedInput();
}

function updateServiceDetails() {
    let lengthSelect = document.getElementById('hairLengthSelect');
    if (selectedServiceData && lengthSelect) {
        let lengthText = lengthSelect.options[lengthSelect.selectedIndex].text;
        updateSelectedInput(lengthText);
    }
}

function updateSelectedInput(extraInfo = "") {
    let input = document.getElementById('selectedServiceInput');
    if (input && selectedServiceData) {
        let text = `${selectedServiceData.title} — ${selectedServiceData.price} ₴ (${selectedServiceData.duration})`;
        if (extraInfo) text += ` [Довжина: ${extraInfo}]`;
        if (selectedHaircutRef) text += ` + Референс обрано`;
        input.value = text;
    }
}

// --- Таймслоти та дати ---
function renderTimeSlots() {
    let dateInput = document.getElementById('clientDate').value;
    let grid = document.getElementById('timeSlotsGrid');
    grid.innerHTML = '';

    if (!dateInput) {
        grid.innerHTML = '<span style="font-size:9px; color:var(--text-muted);">Спочатку оберіть дату вище</span>';
        return;
    }

    const slots = ["10:00", "12:00", "14:00", "16:00", "18:00"];
    slots.forEach(time => {
        let cell = document.createElement('div');
        cell.className = 'time-cell';
        cell.innerText = time;
        cell.onclick = () => selectTimeSlot(time, cell);
        grid.appendChild(cell);
    });
}

function selectTimeSlot(time, element) {
    document.querySelectorAll('.time-cell').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    selectedTimeSlot = time;
    
    let notice = document.getElementById('slotNotice');
    let dateInput = document.getElementById('clientDate').value;
    notice.innerHTML = `⚡ <b>Слот заброньовано на:</b> ${dateInput} о ${time}`;
}

// --- Модальні вікна (Оферта та Lightbox) ---
function openOffer() {
    let modal = document.getElementById('offerModal');
    if (modal) modal.style.display = 'flex';
}

function closeOffer() {
    let modal = document.getElementById('offerModal');
    if (modal) modal.style.display = 'none';
}

function openLightbox(imgSrc) {
    let lightbox = document.getElementById('imageLightboxModal');
    let img = document.getElementById('lightboxImage');
    if (lightbox && img) {
        img.src = imgSrc;
        lightbox.style.display = 'flex';
    }
}

function closeLightbox() {
    let lightbox = document.getElementById('imageLightboxModal');
    if (lightbox) lightbox.style.display = 'none';
}

// --- Відправка запису та створення платежу ---
async function submitBooking() {
    let name = document.getElementById('clientName').value;
    let phone = document.getElementById('clientPhone').value;
    let email = document.getElementById('clientEmail').value;
    let date = document.getElementById('clientDate').value;

    if (!selectedCategory) {
        alert("Будь ласка, оберіть категорію послуг!");
        return;
    }
    if (!date || !selectedTimeSlot) {
        alert("Будь ласка, оберіть дату та час візиту!");
        return;
    }
    if (!name || !phone || !email) {
        alert("Будь ласка, заповніть ім'я, телефон та email!");
        return;
    }

    // Запит на створення інвойсу в Monobank через сервер
    try {
        let response = await fetch('/api/create-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, date, time: selectedTimeSlot })
        });
        let data = await response.json();
        
        if (data.pageUrl) {
            window.location.href = data.pageUrl; // Перенаправлення на оплату Mono
        } else {
            alert("Запис успішно сформовано! Очікуємо підтвердження оплати.");
        }
    } catch (err) {
        console.error(err);
        alert("Помилка при створенні платежу. Спробуйте ще раз пізніше.");
    }
}
