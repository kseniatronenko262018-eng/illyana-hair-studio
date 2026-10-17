let currentLang = 'ua';
let selectedCategory = null;
let selectedServiceData = null;
let selectedHaircutRef = null;
let selectedCondition = null;
let selectedDate = null;
let selectedTimeSlot = null;
let bookedSlotsCache = {};

// Ваш інтегрований Telegram-бот
const TELEGRAM_BOT_URL = 'https://t.me/illianahair_bot';

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
        haircut_ref_title: "✨ Оберіть референс стрижки:",
        choose_btn: "Обрати",
        ref_selected_notice: "✓ Обрано",
        step2: "2. Оберіть ваш поточний стан волосся:",
        step3: "3. Доступні послуги та довжина:",
        length_label: "Довжина волосся:",
        len_shoulders: "До плечей",
        len_blades: "Від плечей до лопаток",
        len_below: "Нижче лопаток",
        rules_title: "📌 Важливі примітки та правила майстра",
        rule_1: "Якщо ваше коріння більше 2 см, послуга фарбування вважається первинною відповідно до довжини.",
        rule_2: "Я не роблю блонд у техніці (AirTouch, балаяж і т. д.).",
        rule_3: "Я не роблю вихід із чорного або рудого.",
        rule_4: "Я не фарбую волосся після біозавивки, ботоксу, кератину.",
        photo_current_label: "4. Завантажте фото вашого волосся:",
        photo_ref_label: "5. Завантажте фото-референс:",
        selected_service_label: "Обрана послуга та час",
        select_service_placeholder: "Спочатку оберіть категорію вище",
        date_label: "Дата візиту",
        name_label: "Ім'я",
        name_placeholder: "Як звертатись",
        phone_label: "Телефон",
        email_label: "Email (обов'язково)",
        social_label: "Нік / соцмережа",
        slots_label: "Доступні слоти часу (студія працює до 19:00)",
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
        haircut_ref_title: "✨ Choose haircut reference:",
        choose_btn: "Select",
        ref_selected_notice: "✓ Selected",
        step2: "2. Select your current hair condition:",
        step3: "3. Available services & length:",
        length_label: "Hair length:",
        len_shoulders: "To shoulders",
        len_blades: "Shoulder to shoulder blades",
        len_below: "Below shoulder blades",
        rules_title: "📌 Important notes & master rules",
        rule_1: "If roots are over 2 cm, coloring is considered primary based on length.",
        rule_2: "I do not do blonde techniques (AirTouch, balayage, etc.).",
        rule_3: "I do not do black or red color correction.",
        rule_4: "I do not dye hair after perm, botox, or keratin.",
        photo_current_label: "4. Upload your hair photo:",
        photo_ref_label: "5. Upload reference photo:",
        selected_service_label: "Selected service & time",
        select_service_placeholder: "First select a category above",
        date_label: "Visit Date",
        name_label: "Name",
        name_placeholder: "How to address you",
        phone_label: "Phone",
        email_label: "Email (required)",
        social_label: "Nickname / social",
        slots_label: "Available time slots (studio works until 19:00)",
        deposit_notice: "⚡ <b>Booking term:</b> <b>500 UAH</b> deposit confirms booking.",
        pay_btn: "Pay deposit 500 ₴ & book",
        modal_title: "Public Offer Agreement",
        modal_btn: "Understood",
        loc_info: "📍 <b>Location:</b> Dnipro, 35-B Volodymyr Vernadskyi St.<br><br>Private space, minimalism and focus on quality.",
        map_btn: "Open in Google Maps"
    }
};

window.addEventListener('DOMContentLoaded', () => {
    initCustomCalendar();
    fetchBookingsData();
});

async function fetchBookingsData() {
    try {
        let res = await fetch('/api/bookings');
        let data = await res.json();
        bookedSlotsCache = {};
        data.forEach(b => {
            if (!bookedSlotsCache[b.date]) bookedSlotsCache[b.date] = [];
            bookedSlotsCache[b.date].push({
                time: b.time,
                duration: Number(b.durationHours || 1.5)
            });
        });
        renderTimeSlots();
    } catch(e) { console.error("Could not fetch bookings", e); }
}

function toggleLang() {
    currentLang = currentLang === 'ua' ? 'en' : 'ua';
    let langBtn = document.getElementById('langToggle');
    if (langBtn) langBtn.innerText = currentLang.toUpperCase() + ' / ' + (currentLang === 'ua' ? 'EN' : 'UA');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        let key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) el.innerHTML = translations[currentLang][key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        let key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) el.setAttribute('placeholder', translations[currentLang][key]);
    });
    initCustomCalendar();
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    html.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
}

function toggleAccordion(header) {
    header.parentElement.classList.toggle('open');
}

function switchTab(tabName, element) {
    document.querySelectorAll('.section-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.quick-nav .nav-chip').forEach(chip => chip.classList.remove('active'));

    if (tabName === 'book') document.getElementById('paneBook').classList.add('active');
    if (tabName === 'works') document.getElementById('paneWorks').classList.add('active');
    if (tabName === 'loc') document.getElementById('paneLoc').classList.add('active');
    if (element) element.classList.add('active');
}

function selectMainCategory(category) {
    selectedCategory = category;
    document.querySelectorAll('.service-card-mini').forEach(card => card.classList.remove('selected'));
    if (category === 'cut') document.getElementById('mainCardCut').classList.add('selected');
    if (category === 'color') document.getElementById('mainCardColor').classList.add('selected');
    if (category === 'complex') document.getElementById('mainCardComplex').classList.add('selected');

    document.getElementById('haircutExamplesSection').style.display = (category === 'cut' || category === 'complex') ? 'block' : 'none';
    document.getElementById('photoUploadSection').style.display = 'block';
    
    let subMenu = document.getElementById('categorySubmenu');
    let coloringOptions = document.getElementById('coloringSubOptions');

    if (category === 'color') {
        subMenu.style.display = 'block';
        coloringOptions.style.display = 'block';
        selectedServiceData = null;
        renderSubmenuItems();
        updateSummaryCard();
    } else if (category === 'complex') {
        subMenu.style.display = 'none';
        coloringOptions.style.display = 'none';
        selectedServiceData = { title: "Стрижка + Фарбування коріння (до 2 см)", price: 3000, durationHours: 3, durationText: "3 год" };
        updateSummaryCard();
    } else {
        subMenu.style.display = 'none';
        coloringOptions.style.display = 'none';
        selectedServiceData = { title: "Стрижка (будь-яка)", price: 1000, durationHours: 1.5, durationText: "1.5 год" };
        updateSummaryCard();
    }
    renderTimeSlots();
}

function selectHaircutReference(imgName, element) {
    document.querySelectorAll('.haircut-grid-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
    selectedHaircutRef = imgName;
    let notice = document.getElementById('selectedRefNotice');
    if (notice) notice.style.display = 'block';
    updateSummaryCard();
}

function renderSubmenuItems() {
    let container = document.getElementById('submenuItems');
    if (!container) return;
    container.innerHTML = `
        <div class="sub-service-card" onclick="selectHairCondition('natural', 'Натуральне волосся', this)">
            <div><div class="s-title">Натуральне волосся</div><div class="s-sub">Доступні всі техніки фарбування</div></div>
        </div>
        <div class="sub-service-card" onclick="selectHairCondition('colored', 'Фарбоване волосся', this)">
            <div><div class="s-title">Фарбоване волосся</div><div class="s-sub">Корінь, тонування, однотон</div></div>
        </div>
    `;
}

function selectHairCondition(conditionKey, conditionTitle, element) {
    document.querySelectorAll('.sub-service-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    selectedCondition = conditionKey;
    
    let specList = document.getElementById('specificServicesList');
    if (!specList) return;
    if (conditionKey === 'natural') {
        specList.innerHTML = `
            <div class="sub-service-card" onclick="selectSpecificServiceType('root', 'Фарбування коріння (до 2 см)', 2500, 2.5, '2.5 год', this)">
                <div><div class="s-title">Фарбування коріння (до 2 см)</div><div class="s-sub">2500 ₴ • 2.5 год</div></div>
            </div>
            <div class="sub-service-card" onclick="selectSpecificServiceType('blonde', 'Тотал блонд / яскраві техніки', null, null, null, this)">
                <div><div class="s-title">Тотал блонд / яскраві техніки</div><div class="s-sub">Повне освітлення з тонуванням</div></div>
            </div>
            <div class="sub-service-card" onclick="selectSpecificServiceType('tone', 'Тонування / однотон', null, null, null, this)">
                <div><div class="s-title">Тонування / однотон</div><div class="s-sub">Фарбування в один тон</div></div>
            </div>
        `;
    } else {
        specList.innerHTML = `
            <div class="sub-service-card" onclick="selectSpecificServiceType('root', 'Фарбування коріння (до 2 см)', 2500, 2.5, '2.5 год', this)">
                <div><div class="s-title">Фарбування коріння (до 2 см)</div><div class="s-sub">2500 ₴ • 2.5 год</div></div>
            </div>
            <div class="sub-service-card" onclick="selectSpecificServiceType('tone', 'Тонування / однотон', null, null, null, this)">
                <div><div class="s-title">Тонування / однотон</div><div class="s-sub">Тонування фарбованого</div></div>
            </div>
        `;
    }
}

let chosenServiceType = null;

function selectSpecificServiceType(typeKey, title, fixedPrice, fixedHours, fixedDurationText, element) {
    document.querySelectorAll('#specificServicesList .sub-service-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    chosenServiceType = typeKey;

    let lengthContainer = document.getElementById('lengthContainer');
    if (lengthContainer) lengthContainer.style.display = 'block';

    if (fixedPrice !== null) {
        selectedServiceData = { title: title, price: fixedPrice, durationHours: fixedHours, durationText: fixedDurationText };
    } else {
        updateServiceDetails();
    }
    updateSummaryCard();
    renderTimeSlots();
}

function updateServiceDetails() {
    let lengthSelect = document.getElementById('hairLengthSelect');
    let lengthVal = lengthSelect ? lengthSelect.value : 'shoulders';

    if (chosenServiceType === 'blonde') {
        if (lengthVal === 'shoulders') selectedServiceData = { title: "Тотал блонд", price: 4000, durationHours: 3, durationText: "3 год" };
        else if (lengthVal === 'shoulder_blades') selectedServiceData = { title: "Тотал блонд", price: 6000, durationHours: 6, durationText: "6 год" };
        else selectedServiceData = { title: "Тотал блонд", price: 7500, durationHours: 7, durationText: "7+ год" };
    } else if (chosenServiceType === 'tone') {
        if (lengthVal === 'shoulders') selectedServiceData = { title: "Тонування / однотон", price: 3000, durationHours: 2, durationText: "2 год" };
        else if (lengthVal === 'shoulder_blades') selectedServiceData = { title: "Тонування / однотон", price: 3500, durationHours: 2.5, durationText: "2.5 год" };
        else selectedServiceData = { title: "Тонування / однотон", price: 5000, durationHours: 3, durationText: "3 год" };
    }
    updateSummaryCard();
    renderTimeSlots();
}

function updateSummaryCard() {
    let titleEl = document.getElementById('summaryServiceTitle');
    let priceBadge = document.getElementById('summaryPriceBadge');
    let metaEl = document.getElementById('summaryMeta');
    let durationEl = document.getElementById('summaryDuration');
    let dateTimeEl = document.getElementById('summaryDateTime');

    if (!titleEl) return;

    if (selectedServiceData) {
        let text = selectedServiceData.title;
        if (selectedHaircutRef) text += " + Референс";
        titleEl.innerText = text;
        priceBadge.innerText = selectedServiceData.price + " ₴";
        durationEl.innerText = selectedServiceData.durationText;
        metaEl.style.display = 'flex';
    } else {
        titleEl.innerText = currentLang === 'ua' ? "Оберіть послугу вище" : "Select service above";
        priceBadge.innerText = "0 ₴";
        metaEl.style.display = 'none';
    }

    if (selectedDate && selectedTimeSlot) {
        dateTimeEl.innerText = `${selectedDate} о ${selectedTimeSlot}`;
    } else if (selectedDate) {
        dateTimeEl.innerText = `${selectedDate} (час не обрано)`;
    }
}

function initCustomCalendar() {
    let grid = document.getElementById('customCalendarGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const daysUa = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let today = new Date();
    for (let i = 0; i < 30; i++) {
        let d = new Date();
        d.setDate(today.getDate() + i);
        
        let dayOfWeek = (currentLang === 'ua') ? daysUa[d.getDay()] : daysEn[d.getDay()];
        let dayNum = d.getDate();
        let isoDate = d.toISOString().split('T')[0];

        let cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        if (i === 0 && !selectedDate) {
            cell.classList.add('selected');
            selectedDate = isoDate;
        } else if (selectedDate === isoDate) {
            cell.classList.add('selected');
        }

        cell.innerHTML = `
            <span class="day-name">${dayOfWeek}</span>
            <span class="day-num">${dayNum}</span>
        `;
        cell.onclick = () => selectCalendarDate(isoDate, cell);
        grid.appendChild(cell);
    }
    renderTimeSlots();
}

function selectCalendarDate(isoDate, element) {
    document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    selectedDate = isoDate;
    renderTimeSlots();
    updateSummaryCard();
}

function renderTimeSlots() {
    let grid = document.getElementById('timeSlotsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!selectedDate) {
        grid.innerHTML = '<span style="font-size:9px; color:var(--text-muted);">Спочатку оберіть дату</span>';
        return;
    }

    let bookedForDay = bookedSlotsCache[selectedDate] || [];
    let serviceDuration = selectedServiceData ? Number(selectedServiceData.durationHours) : 1.5;

    let slots = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"];
    let now = new Date();
    let isToday = (selectedDate === now.toISOString().split('T')[0]);

    slots.forEach(timeStr => {
        let [hours, minutes] = timeStr.split(':').map(Number);
        let slotStartDecimal = hours + (minutes / 60);
        let slotEndDecimal = slotStartDecimal + serviceDuration;

        let cell = document.createElement('div');
        cell.className = 'time-cell';
        cell.innerText = timeStr;

        let isDisabled = false;

        if (slotEndDecimal > 19.0) {
            isDisabled = true;
        }

        if (isToday) {
            let slotTime = new Date();
            slotTime.setHours(hours, minutes, 0, 0);
            let diffHours = (slotTime - now) / (1000 * 60 * 60);
            if (diffHours < 3) {
                isDisabled = true;
            }
        }

        bookedForDay.forEach(b => {
            let [bHours, bMinutes] = b.time.split(':').map(Number);
            let bStart = bHours + (bMinutes / 60);
            let bEnd = bStart + Number(b.duration || 1.5);

            if (slotStartDecimal < bEnd && slotEndDecimal > bStart) {
                isDisabled = true;
            }
        });

        if (isDisabled) {
            cell.classList.add('booked');
            cell.style.opacity = '0.35';
            cell.style.pointerEvents = 'none';
        } else {
            cell.onclick = () => selectTimeSlot(timeStr, cell);
            if (selectedTimeSlot === timeStr) cell.classList.add('selected');
        }
        grid.appendChild(cell);
    });
}

function selectTimeSlot(time, element) {
    document.querySelectorAll('.time-cell').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    selectedTimeSlot = time;
    updateSummaryCard();
}

function openOffer() { document.getElementById('offerModal').style.display = 'flex'; }
function closeOffer() { document.getElementById('offerModal').style.display = 'none'; }

function openLightbox(imgSrc) {
    let lightbox = document.getElementById('imageLightboxModal');
    let img = document.getElementById('lightboxImage');
    if (lightbox && img) {
        img.src = imgSrc;
        lightbox.style.display = 'flex';
    }
}
function closeLightbox() { document.getElementById('imageLightboxModal').style.display = 'none'; }

async function submitBooking() {
    let name = document.getElementById('clientName').value.trim();
    let phone = document.getElementById('clientPhone').value.trim();
    let email = document.getElementById('clientEmail').value.trim();
    let social = document.getElementById('clientSocial')?.value.trim() || '';

    if (!selectedCategory || !selectedServiceData) {
        alert("Оберіть послугу!");
        return;
    }
    if (!selectedDate || !selectedTimeSlot) {
        alert("Оберіть дату та час візиту!");
        return;
    }
    if (!name || !phone || !email) {
        alert("Заповніть ім'я, телефон та email!");
        return;
    }

    try {
        let checkRes = await fetch('/api/check-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        let checkData = await checkRes.json();

        let bookingPayload = {
            name,
            phone,
            email,
            social,
            service: selectedServiceData.title,
            price: selectedServiceData.price,
            durationHours: selectedServiceData.durationHours,
            date: selectedDate,
            time: selectedTimeSlot,
            reference: selectedHaircutRef || ''
        };

        let bookRes = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });
        let bookData = await bookRes.json();

        if (checkData.isRegular) {
            if (bookData.success !== false) {
                alert("✨ Раді знову бачити вас! Ваш запис успішно підтверджено.");
                window.location.href = TELEGRAM_BOT_URL;
            } else {
                alert("Помилка при збереженні запису в базі.");
            }
        } else {
            try {
                let invoiceRes = await fetch('/api/create-invoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, email, date: selectedDate, time: selectedTimeSlot, price: selectedServiceData.price })
                });
                let invoiceData = await invoiceRes.json();
                
                if (invoiceData && invoiceData.pageUrl) {
                    window.location.href = invoiceData.pageUrl;
                    return;
                }
            } catch (invErr) {
                console.warn("Інвойс не створено, але бронь збережено:", invErr);
            }

            alert("✨ Запис успішно сформовано! Переходимо в чат-бот.");
            window.location.href = TELEGRAM_BOT_URL;
        }
    } catch (err) {
        console.error("Помилка оформлення:", err);
        alert("Сталася помилка при зв'язку з сервером.");
    }
}
