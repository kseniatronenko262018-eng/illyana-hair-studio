let currentLang = 'ua';
let selectedCategory = null;
let selectedServiceData = null;
let selectedHaircutRef = null;
let selectedCondition = null;
let selectedDate = null;
let selectedTimeSlot = null;
let bookedSlotsCache = {};

// Новий лінк на основі вашого токена бота
const TELEGRAM_BOT_URL = 'https://t.me/illianahair_bot';

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
            bookedSlotsCache[b.date].push({ time: b.time, duration: Number(b.durationHours || 1.5) });
        });
        renderTimeSlots();
    } catch(e) {}
}

function toggleAccordion(header) { header.parentElement.classList.toggle('open'); }
function openOffer() { document.getElementById('offerModal').style.display = 'flex'; }
function closeOffer() { document.getElementById('offerModal').style.display = 'none'; }
function openLightbox(imgSrc) {
    let img = document.getElementById('lightboxImage');
    if (img) { img.src = imgSrc; document.getElementById('imageLightboxModal').style.display = 'flex'; }
}
function closeLightbox() { document.getElementById('imageLightboxModal').style.display = 'none'; }

function switchTab(tabName, element) {
    document.querySelectorAll('.section-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-chip').forEach(c => c.classList.remove('active'));
    document.getElementById(tabName === 'book' ? 'paneBook' : tabName === 'works' ? 'paneWorks' : 'paneLoc').classList.add('active');
    if (element) element.classList.add('active');
}

function selectMainCategory(category) {
    selectedCategory = category;
    document.querySelectorAll('.service-card-row').forEach(c => c.classList.remove('selected'));
    
    let elId = category === 'cut' ? 'mainCardCut' : category === 'color' ? 'mainCardColor' : 'mainCardComplex';
    document.getElementById(elId)?.classList.add('selected');

    document.getElementById('haircutExamplesSection').style.display = (category === 'cut' || category === 'complex') ? 'block' : 'none';
    document.getElementById('photoUploadSection').style.display = 'block';

    let subMenu = document.getElementById('categorySubmenu');
    let coloringOptions = document.getElementById('coloringSubOptions');

    if (category === 'color') {
        subMenu.style.display = 'block'; coloringOptions.style.display = 'block';
        selectedServiceData = null;
        renderSubmenuItems();
    } else if (category === 'complex') {
        subMenu.style.display = 'none'; coloringOptions.style.display = 'none';
        selectedServiceData = { title: "Стрижка + Фарбування коріння", price: 3000, durationHours: 3 };
    } else {
        subMenu.style.display = 'none'; coloringOptions.style.display = 'none';
        selectedServiceData = { title: "Стрижка (будь-яка)", price: 1000, durationHours: 1.5 };
    }
    updateSummaryCard(); renderTimeSlots();
}

function selectHaircutReference(imgName, element) {
    document.querySelectorAll('.haircut-grid-item').forEach(i => i.classList.remove('selected'));
    element.classList.add('selected');
    selectedHaircutRef = imgName;
    document.getElementById('selectedRefNotice').style.display = 'block';
    updateSummaryCard();
}

function renderSubmenuItems() {
    document.getElementById('submenuItems').innerHTML = `
        <div class="sub-service-card" onclick="selectHairCondition('natural', this)">
            <div><div class="s-title">Натуральне волосся</div><div class="s-sub">Доступні всі техніки фарбування</div></div>
        </div>
        <div class="sub-service-card" onclick="selectHairCondition('colored', this)">
            <div><div class="s-title">Фарбоване волосся</div><div class="s-sub">Корінь, тонування, однотон</div></div>
        </div>
    `;
}

function selectHairCondition(conditionKey, element) {
    document.querySelectorAll('#categorySubmenu .sub-service-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    let specList = document.getElementById('specificServicesList');
    if (conditionKey === 'natural') {
        specList.innerHTML = `
            <div class="sub-service-card" onclick="selectSpecificServiceType('root', 'Фарбування коріння', 2500, 2.5, this)">
                <div><div class="s-title">Фарбування коріння (до 2 см)</div><div class="s-sub">2500 ₴ • 2.5 год</div></div>
            </div>
            <div class="sub-service-card" onclick="selectSpecificServiceType('blonde', 'Тотал блонд', null, null, this)">
                <div><div class="s-title">Тотал блонд / яскраві техніки</div><div class="s-sub">Повне освітлення</div></div>
            </div>
            <div class="sub-service-card" onclick="selectSpecificServiceType('tone', 'Тонування / однотон', null, null, this)">
                <div><div class="s-title">Тонування / однотон</div><div class="s-sub">Фарбування в один тон</div></div>
            </div>
        `;
    } else {
        specList.innerHTML = `
            <div class="sub-service-card" onclick="selectSpecificServiceType('root', 'Фарбування коріння', 2500, 2.5, this)">
                <div><div class="s-title">Фарбування коріння (до 2 см)</div><div class="s-sub">2500 ₴ • 2.5 год</div></div>
            </div>
            <div class="sub-service-card" onclick="selectSpecificServiceType('tone', 'Тонування', null, null, this)">
                <div><div class="s-title">Тонування / однотон</div><div class="s-sub">Тонування фарбованого</div></div>
            </div>
        `;
    }
}

let chosenServiceType = null;
function selectSpecificServiceType(typeKey, title, fixedPrice, fixedHours, element) {
    document.querySelectorAll('#specificServicesList .sub-service-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    chosenServiceType = typeKey;
    document.getElementById('lengthContainer').style.display = 'block';

    if (fixedPrice !== null) {
        selectedServiceData = { title, price: fixedPrice, durationHours: fixedHours };
    } else {
        updateServiceDetails();
    }
    updateSummaryCard(); renderTimeSlots();
}

function updateServiceDetails() {
    let lengthVal = document.getElementById('hairLengthSelect').value;
    if (chosenServiceType === 'blonde') {
        selectedServiceData = { title: "Тотал блонд", price: lengthVal === 'shoulders' ? 4000 : lengthVal === 'shoulder_blades' ? 6000 : 7500, durationHours: lengthVal === 'shoulders' ? 3 : lengthVal === 'shoulder_blades' ? 6 : 7 };
    } else if (chosenServiceType === 'tone') {
        selectedServiceData = { title: "Тонування", price: lengthVal === 'shoulders' ? 3000 : lengthVal === 'shoulder_blades' ? 3500 : 5000, durationHours: lengthVal === 'shoulders' ? 2 : lengthVal === 'shoulder_blades' ? 2.5 : 3 };
    }
    updateSummaryCard(); renderTimeSlots();
}

function updateSummaryCard() {
    let titleEl = document.getElementById('summaryServiceTitle');
    let priceBadge = document.getElementById('summaryPriceBadge');
    let metaEl = document.getElementById('summaryMeta');

    if (selectedServiceData) {
        titleEl.innerText = selectedServiceData.title + (selectedHaircutRef ? " + Референс" : "");
        priceBadge.innerText = selectedServiceData.price + " ₴";
        document.getElementById('summaryDuration').innerText = selectedServiceData.durationHours + " год";
        metaEl.style.display = 'flex';
    } else {
        titleEl.innerText = "Спочатку оберіть категорію";
        priceBadge.innerText = "0 ₴";
        metaEl.style.display = 'none';
    }
    if (selectedDate) {
        document.getElementById('summaryDateTime').innerText = selectedDate + (selectedTimeSlot ? ` о ${selectedTimeSlot}` : '');
    }
}

function initCustomCalendar() {
    let grid = document.getElementById('customCalendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const days = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    let today = new Date();
    for (let i = 0; i < 30; i++) {
        let d = new Date(); d.setDate(today.getDate() + i);
        let iso = d.toISOString().split('T')[0];
        let cell = document.createElement('div');
        cell.className = 'calendar-day-cell' + (selectedDate === iso || (i === 0 && !selectedDate) ? ' selected' : '');
        if (i === 0 && !selectedDate) selectedDate = iso;
        cell.innerHTML = `<span class="day-name">${days[d.getDay()]}</span><span class="day-num">${d.getDate()}</span>`;
        cell.onclick = () => {
            document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            selectedDate = iso;
            renderTimeSlots(); updateSummaryCard();
        };
        grid.appendChild(cell);
    }
    renderTimeSlots();
}

function renderTimeSlots() {
    let grid = document.getElementById('timeSlotsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!selectedDate) return;

    let booked = bookedSlotsCache[selectedDate] || [];
    let dur = selectedServiceData ? Number(selectedServiceData.durationHours) : 1.5;
    let slots = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"];
    let now = new Date();
    let isToday = (selectedDate === now.toISOString().split('T')[0]);

    slots.forEach(timeStr => {
        let [h, m] = timeStr.split(':').map(Number);
        let slotStart = h + (m / 60);
        let slotEnd = slotStart + dur;
        let cell = document.createElement('div');
        cell.className = 'time-cell';
        cell.innerText = timeStr;

        let isDisabled = (timeStr !== "19:00" && slotEnd > 19.0) || (timeStr === "19:00" && dur > 1.5);
        if (isToday) {
            let slotTime = new Date(); slotTime.setHours(h, m, 0, 0);
            if ((slotTime - now) / 3600000 < 3) isDisabled = true;
        }

        booked.forEach(b => {
            let [bh, bm] = b.time.split(':').map(Number);
            let bStart = bh + (bm / 60);
            if (slotStart < (bStart + b.duration) && slotEnd > bStart) isDisabled = true;
        });

        if (isDisabled) {
            cell.classList.add('booked');
        } else {
            cell.onclick = () => {
                document.querySelectorAll('.time-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                selectedTimeSlot = timeStr;
                updateSummaryCard();
            };
            if (selectedTimeSlot === timeStr) cell.classList.add('selected');
        }
        grid.appendChild(cell);
    });
}

async function uploadImageToImgBB(file) {
    if (!file) return '';
    return new Promise((resolve) => {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            let img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                let canvas = document.createElement('canvas');
                let MAX_WIDTH = 800;
                let scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = () => resolve('');
        };
        reader.onerror = () => resolve('');
    });
}

async function submitBooking() {
    let name = document.getElementById('clientName').value.trim();
    let phone = document.getElementById('clientPhone').value.trim();
    let email = document.getElementById('clientEmail').value.trim();

    if (!selectedServiceData) return alert("Оберіть послугу!");
    if (!selectedDate || !selectedTimeSlot) return alert("Оберіть дату та час!");
    if (!name || !phone || !email) return alert("Заповніть контактні дані!");

    let btn = document.querySelector('.btn-main[onclick="submitBooking()"]');
    let origText = btn.innerText;
    btn.innerText = "⏳ Оформлення...";
    btn.style.pointerEvents = 'none';

    try {
        let hInput = document.getElementById('clientHairPhoto');
        let rInput = document.getElementById('clientRefPhoto');
        let photoUrl = await uploadImageToImgBB(rInput?.files[0] || hInput?.files[0]);
        let refFinal = selectedHaircutRef || photoUrl || 'EMPTY';

        let checkRes = await fetch('/api/check-client', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ phone }) });
        let { isRegular } = await checkRes.json();

        let bookRes = await fetch('/api/bookings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name, phone, email, social: document.getElementById('clientSocial')?.value.trim(),
                service: selectedServiceData.title, price: selectedServiceData.price,
                durationHours: selectedServiceData.durationHours, date: selectedDate, time: selectedTimeSlot, reference: refFinal
            })
        });

        if (!bookRes.ok) throw new Error("Помилка збереження запису.");

        if (isRegular) {
            alert("✨ Запис підтверджено! Переходимо в Telegram-бот.");
            window.location.href = TELEGRAM_BOT_URL;
        } else {
            let invRes = await fetch('/api/create-invoice', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name, date: selectedDate, time: selectedTimeSlot })
            });
            let invData = await invRes.json();
            if (invData.pageUrl) {
                window.location.href = invData.pageUrl;
            } else {
                alert("Переходимо у Telegram-бот.");
                window.location.href = TELEGRAM_BOT_URL;
            }
        }
    } catch (err) {
        alert("Помилка: " + err.message);
    } finally {
        btn.innerText = origText;
        btn.style.pointerEvents = 'auto';
    }
}
