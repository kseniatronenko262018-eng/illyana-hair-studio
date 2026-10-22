let currentLang = 'ua';
let selectedCategory = null;
let selectedServiceData = null;
let selectedCondition = null;
let selectedDate = null;
let selectedTimeSlot = null;
let bookedSlotsCache = {};
let observer;

const TELEGRAM_BOT_URL = 'https://t.me/illyana_hair_studio_bot';

window.addEventListener('DOMContentLoaded', () => {
    initCustomCalendar();
    fetchBookingsData();
    
    let savedTheme = localStorage.getItem('illiana_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Ініціалізація анімацій появи
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.fade-in-section').forEach(el => {
        observer.observe(el);
    });
});

// Логіка плаваючої кнопки
window.addEventListener('scroll', () => {
    let cta = document.getElementById('stickyCta');
    let bookBtn = document.getElementById('mainBookBtn');
    let paneBook = document.getElementById('paneBook');
    
    if(!cta || !paneBook.classList.contains('active')) {
        if(cta) cta.classList.remove('visible');
        return;
    }
    
    let btnRect = bookBtn ? bookBtn.getBoundingClientRect() : null;
    
    if (window.scrollY > 350 && (!btnRect || btnRect.top > window.innerHeight)) {
        cta.classList.add('visible');
    } else {
        cta.classList.remove('visible');
    }
});

function scrollToBooking() {
    document.getElementById('step1Card').scrollIntoView({ behavior: 'smooth' });
}

function toggleTheme() {
    let current = document.documentElement.getAttribute('data-theme');
    let next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('illiana_theme', next);
}

function toggleLang() {
    currentLang = currentLang === 'ua' ? 'en' : 'ua';
    document.body.setAttribute('data-lang', currentLang);
    
    document.querySelectorAll('input[data-ph-ua]').forEach(el => {
        el.placeholder = currentLang === 'ua' ? el.getAttribute('data-ph-ua') : el.getAttribute('data-ph-en');
    });

    updateSummaryCard();
    initCustomCalendar(); 
}

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
    
    let targetPane = document.getElementById(tabName === 'book' ? 'paneBook' : tabName === 'works' ? 'paneWorks' : 'paneLoc');
    if (targetPane) {
        targetPane.classList.add('active');
        targetPane.querySelectorAll('.fade-in-section').forEach(el => el.classList.add('is-visible'));
    }
    
    if (element) element.classList.add('active');
    
    if (tabName === 'works' && typeof loadPublicWorks === 'function') {
        loadPublicWorks();
    }
    
    if(tabName !== 'book') {
        let cta = document.getElementById('stickyCta');
        if(cta) cta.classList.remove('visible');
    }
}

function selectMainCategory(category) {
    selectedCategory = category;
    document.querySelectorAll('.service-card-row').forEach(c => c.classList.remove('selected'));
    
    let elId = category === 'cut' ? 'mainCardCut' : category === 'color' ? 'mainCardColor' : 'mainCardComplex';
    document.getElementById(elId)?.classList.add('selected');

    let step2 = document.getElementById('step2Card');
    step2.style.opacity = '1';
    step2.style.pointerEvents = 'auto';

    let subMenu = document.getElementById('categorySubmenu');
    let coloringOptions = document.getElementById('coloringSubOptions');

    if (category === 'color') {
        subMenu.style.display = 'block'; coloringOptions.style.display = 'block';
        selectedServiceData = null;
        renderSubmenuItems();
    } else if (category === 'complex') {
        subMenu.style.display = 'none'; coloringOptions.style.display = 'none';
        selectedServiceData = { title: {ua: "Стрижка + Фарбування коріння", en: "Haircut + Root touch-up"}, price: 3000, durationHours: 3 };
        unlockStep3();
    } else {
        subMenu.style.display = 'none'; coloringOptions.style.display = 'none';
        selectedServiceData = { title: {ua: "Стрижка", en: "Haircut"}, price: 1000, durationHours: 1.5 };
        unlockStep3();
    }
    updateSummaryCard(); renderTimeSlots();
}

function renderSubmenuItems() {
    document.getElementById('submenuItems').innerHTML = `
        <div class="sub-service-card" onclick="selectHairCondition('natural', this)">
            <div>
                <div class="s-title"><span class="ua">Натуральне волосся</span><span class="en">Natural hair</span></div>
                <div class="s-sub"><span class="ua">Доступні всі техніки фарбування</span><span class="en">All techniques available</span></div>
            </div>
        </div>
        <div class="sub-service-card" onclick="selectHairCondition('colored', this)">
            <div>
                <div class="s-title"><span class="ua">Фарбоване волосся</span><span class="en">Colored hair</span></div>
                <div class="s-sub"><span class="ua">Корінь, тонування, однотон</span><span class="en">Roots, toning, single process</span></div>
            </div>
        </div>
    `;
}

function selectHairCondition(conditionKey, element) {
    document.querySelectorAll('#categorySubmenu .sub-service-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    let specList = document.getElementById('specificServicesList');
    if (conditionKey === 'natural') {
        specList.innerHTML = `
            <div class="sub-service-card" onclick="selectSpecificServiceType('root', {ua: 'Фарбування коріння', en: 'Root coloring'}, 2500, 2.5, this)">
                <div><div class="s-title"><span class="ua">Фарбування коріння (до 2 см)</span><span class="en">Root coloring (up to 2 cm)</span></div><div class="s-sub">2500 ₴ • 2.5 <span class="ua">год</span><span class="en">h</span></div></div>
            </div>
            <div class="sub-service-card" onclick="selectSpecificServiceType('blonde', {ua: 'Тотал блонд', en: 'Total blonde'}, null, null, this)">
                <div><div class="s-title"><span class="ua">Тотал блонд / яскраві техніки</span><span class="en">Total blonde / bright colors</span></div><div class="s-sub"><span class="ua">Повне освітлення</span><span class="en">Full lightening</span></div></div>
            </div>
            <div class="sub-service-card" onclick="selectSpecificServiceType('tone', {ua: 'Тонування / однотон', en: 'Toning / Single process'}, null, null, this)">
                <div><div class="s-title"><span class="ua">Тонування / однотон</span><span class="en">Toning / Single process</span></div><div class="s-sub"><span class="ua">Фарбування в один тон</span><span class="en">Single color application</span></div></div>
            </div>
        `;
    } else {
        specList.innerHTML = `
            <div class="sub-service-card" onclick="selectSpecificServiceType('root', {ua: 'Фарбування коріння', en: 'Root coloring'}, 2500, 2.5, this)">
                <div><div class="s-title"><span class="ua">Фарбування коріння (до 2 см)</span><span class="en">Root coloring (up to 2 cm)</span></div><div class="s-sub">2500 ₴ • 2.5 <span class="ua">год</span><span class="en">h</span></div></div>
            </div>
            <div class="sub-service-card" onclick="selectSpecificServiceType('tone', {ua: 'Тонування', en: 'Toning'}, null, null, this)">
                <div><div class="s-title"><span class="ua">Тонування / однотон</span><span class="en">Toning / Single process</span></div><div class="s-sub"><span class="ua">Тонування фарбованого</span><span class="en">Refreshing colored hair</span></div></div>
            </div>
        `;
    }
}

let chosenServiceType = null;
function selectSpecificServiceType(typeKey, titleObj, fixedPrice, fixedHours, element) {
    document.querySelectorAll('#specificServicesList .sub-service-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    chosenServiceType = typeKey;
    document.getElementById('lengthContainer').style.display = 'block';

    if (fixedPrice !== null) {
        selectedServiceData = { title: titleObj, price: fixedPrice, durationHours: fixedHours };
        unlockStep3();
    } else {
        updateServiceDetails();
    }
    updateSummaryCard(); renderTimeSlots();
}

function updateServiceDetails() {
    let selectEl = currentLang === 'ua' ? document.getElementById('hairLengthSelectUA') : document.getElementById('hairLengthSelectEN');
    let lengthVal = selectEl.value;
    
    document.getElementById('hairLengthSelectUA').value = lengthVal;
    document.getElementById('hairLengthSelectEN').value = lengthVal;

    if (chosenServiceType === 'blonde') {
        selectedServiceData = { 
            title: {ua: "Тотал блонд", en: "Total blonde"}, 
            price: lengthVal === 'shoulders' ? 4000 : lengthVal === 'shoulder_blades' ? 6000 : 7500, 
            durationHours: lengthVal === 'shoulders' ? 3 : lengthVal === 'shoulder_blades' ? 6 : 7 
        };
    } else if (chosenServiceType === 'tone') {
        selectedServiceData = { 
            title: {ua: "Тонування", en: "Toning"}, 
            price: lengthVal === 'shoulders' ? 3000 : lengthVal === 'shoulder_blades' ? 3500 : 5000, 
            durationHours: lengthVal === 'shoulders' ? 2 : lengthVal === 'shoulder_blades' ? 2.5 : 3 
        };
    }
    updateSummaryCard(); renderTimeSlots();
    unlockStep3();
}

function unlockStep3() {
    let step3 = document.getElementById('step3Card');
    step3.style.opacity = '1';
    step3.style.pointerEvents = 'auto';
}

function checkPhotoLoaded(input) {
    let btn = document.getElementById('fileUploadBtn');
    if (input.files && input.files[0]) { 
        btn.innerHTML = `✅ ${input.files[0].name}`;
        btn.classList.add('loaded');
        unlockStep3(); 
    } else {
        btn.innerHTML = `<span class="ua">📁 Натисніть, щоб обрати файл</span><span class="en">📁 Click to choose file</span>`;
        btn.classList.remove('loaded');
    }
}

function updateSummaryCard() {
    let titleEl = document.getElementById('summaryServiceTitle');
    let priceBadge = document.getElementById('summaryPriceBadge');
    let metaEl = document.getElementById('summaryMeta');

    if (selectedServiceData) {
        titleEl.innerText = selectedServiceData.title[currentLang];
        priceBadge.innerText = selectedServiceData.price + " ₴";
        let hText = currentLang === 'ua' ? 'год' : 'h';
        document.getElementById('summaryDuration').innerText = selectedServiceData.durationHours + " " + hText;
        metaEl.style.display = 'flex';
    } else {
        titleEl.innerHTML = `<span class="ua">Оберіть послугу вище</span><span class="en">Choose service above</span>`;
        priceBadge.innerText = "0 ₴";
        metaEl.style.display = 'none';
    }
    if (selectedDate) {
        let atText = currentLang === 'ua' ? ' о ' : ' at ';
        document.getElementById('summaryDateTime').innerText = selectedDate + (selectedTimeSlot ? `${atText}${selectedTimeSlot}` : '');
    }
}

function initCustomCalendar() {
    let grid = document.getElementById('customCalendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const daysUA = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const daysEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    let today = new Date();
    for (let i = 0; i < 30; i++) {
        let d = new Date(); d.setDate(today.getDate() + i);
        let iso = d.toISOString().split('T')[0];
        let cell = document.createElement('div');
        cell.className = 'calendar-day-cell' + (selectedDate === iso || (i === 0 && !selectedDate) ? ' selected' : '');
        if (i === 0 && !selectedDate) selectedDate = iso;
        
        let dName = currentLang === 'ua' ? daysUA[d.getDay()] : daysEN[d.getDay()];
        
        cell.innerHTML = `<span class="day-name">${dName}</span><span class="day-num">${d.getDate()}</span>`;
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

        let isDisabled = false;

        if (dur >= 7 && slotStart > 10.5) {
            isDisabled = true;
        }

        if (slotEnd > 19.0 && dur <= 1.5 && timeStr !== "19:00") {
            isDisabled = true; 
        } else if (slotEnd > 19.0 && dur > 1.5) {
            isDisabled = true;
        }

        if (isToday) {
            let slotTime = new Date(); slotTime.setHours(h, m, 0, 0);
            if ((slotTime - now) / 3600000 < 3) isDisabled = true;
        }

        booked.forEach(b => {
            let [bh, bm] = b.time.split(':').map(Number);
            let bStart = bh + (bm / 60);
            let bEnd = bStart + b.duration;
            if (slotStart < bEnd && slotEnd > bStart) {
                isDisabled = true;
            }
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
                let MAX_WIDTH = 600;
                let scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => resolve('');
        };
        reader.onerror = () => resolve('');
    });
}

// ОСНОВНА ФУНКЦІЯ ЗАПИСУ
async function submitBooking() {
    let name = document.getElementById('clientName').value.trim();
    let phone = document.getElementById('clientPhone').value.trim();
    let email = document.getElementById('clientEmail').value.trim();
    let hInput = document.getElementById('clientHairPhoto');

    if (!selectedServiceData) return alert(currentLang === 'ua' ? "Оберіть послугу!" : "Please choose a service!");
    if (!selectedDate || !selectedTimeSlot) return alert(currentLang === 'ua' ? "Оберіть дату та час!" : "Please choose date and time!");
    if (!name || !phone) return alert(currentLang === 'ua' ? "Заповніть ім'я та телефон!" : "Please fill in name and phone!");
    
    if (!email) {
        alert(currentLang === 'ua' ? "⚠️ Будь ласка, введіть ваш Email!" : "⚠️ Please enter your Email!");
        document.getElementById('clientEmail').focus();
        return;
    }
    if (!hInput.files[0]) {
        alert(currentLang === 'ua' ? "⚠️ Завантажте фото вашого волосся!" : "⚠️ Please upload a hair photo!");
        document.getElementById('fileUploadBtn').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    let btn = document.getElementById('mainBookBtn');
    let origHtml = btn.innerHTML;
    btn.innerText = currentLang === 'ua' ? "⏳ Перевірка статусу..." : "⏳ Checking...";
    btn.style.pointerEvents = 'none';

    try {
        let photoUrl = await uploadImageToImgBB(hInput.files[0]);

        // 1. Перевіряємо, чи клієнт постійний
        let checkRes = await fetch('/api/check-client', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ phone }) });
        let { isRegular } = await checkRes.json();

        let bookingRef = "REF" + Date.now().toString();

        let bookingPayload = {
            name, phone, email, 
            social: document.getElementById('clientSocial')?.value.trim(),
            service: selectedServiceData.title.ua,
            price: selectedServiceData.price,
            durationHours: selectedServiceData.durationHours, 
            date: selectedDate, 
            time: selectedTimeSlot, 
            reference: photoUrl, 
            isRegular, 
            bookingRef
        };

        if (isRegular) {
            // ВАРІАНТ А: ПОСТІЙНИЙ КЛІЄНТ (Бронюємо відразу без передплати)
            btn.innerText = currentLang === 'ua' ? "⏳ Бронювання..." : "⏳ Booking...";
            let bookRes = await fetch('/api/bookings', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(bookingPayload)
            });

            if (!bookRes.ok) throw new Error("Server error.");

            alert(currentLang === 'ua' ? "✨ Ви постійний клієнт! Запис оформлено без передплати. Переходимо в Telegram." : "✨ Regular client! Booked without deposit. Redirecting to Telegram.");
            window.location.href = `${TELEGRAM_BOT_URL}?start=${bookingRef}`;
        } else {
            // ВАРІАНТ Б: НОВИЙ КЛІЄНТ (НЕ записуємо в базу, спочатку оплата 500 грн)
            btn.innerText = currentLang === 'ua' ? "⏳ Перехід до оплати..." : "⏳ Redirecting to payment...";
            
            let invRes = await fetch('/api/create-invoice', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(bookingPayload)
            });
            let invData = await invRes.json();
            
            if (invData.pageUrl) {
                // Перенаправляємо на сторінку оплати Monobank
                window.location.href = invData.pageUrl;
            } else {
                throw new Error(invData.error || "Не вдалося створити платіж для передоплати.");
            }
        }
    } catch (err) {
        alert((currentLang === 'ua' ? "Помилка: " : "Error: ") + err.message);
    } finally {
        btn.innerHTML = origHtml;
        btn.style.pointerEvents = 'auto';
    }
}
