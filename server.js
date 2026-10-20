const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname)));

const MONO_TOKEN = 'mF4VYm_rjXjOAAAF1FJJ5yw';

// ⚠️ НАЛАШТУВАННЯ TELEGRAM (Новий токен та ID)
const BOT_TOKEN = '8591183866:AAFrBrQrZe_1C1azzBdUmqR4Habuv7LLnQI'; 
const MASTER_TELEGRAM_ID = '956742572'; 

// Дані Supabase
const SUPABASE_URL = 'https://crhzelpvxdcthhevplho.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaHplbHB2eGRjdGhoZXZwbGhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjEzNzI4MSwiZXhwIjoyMTA3NzEzMjgxfQ.on7872D5eD3i95BGJVNiVdiMywjs9uMUvBwg5wdbfA8';

const supabaseHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

let customWorksMemory = [];

function parseTimeToDecimal(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m / 60);
}

// ------------------ TELEGRAM BOT & NOTIFICATIONS ------------------

// 1. Сповіщення майстру про новий запис
async function sendMasterTelegramNotification(booking) {
    if (!BOT_TOKEN || !MASTER_TELEGRAM_ID) return;

    const messageText = `⚡ <b>НОВИЙ ЗАПИС У СТУДІЮ!</b>\n\n` +
        `<code>` +
        `👤 Клієнт:  ${booking.name}\n` +
        `📞 Телефон: ${booking.phone}\n` +
        `📅 Дата:    ${booking.date} о ${booking.time}\n` +
        `✂️ Послуга: ${booking.service}\n` +
        `💰 Сума:    ${booking.price} ₴\n` +
        `📧 Email:   ${booking.email || '—'}\n` +
        `💬 Соцмережа: ${booking.social || '—'}` +
        `</code>`;

    await sendTelegramMessage(MASTER_TELEGRAM_ID, messageText);
}

// 2. Вбудований бот: автовідповідь клієнтам на /start
let telegramOffset = 0;
async function startTelegramBotPolling() {
    if (!BOT_TOKEN) return;

    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${telegramOffset}&timeout=10`);
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
                telegramOffset = update.update_id + 1;
                if (update.message && update.message.text) {
                    await handleBotMessage(update.message);
                }
            }
        }
    } catch (err) {
        console.error("Telegram Polling Error:", err.message);
    }

    setTimeout(startTelegramBotPolling, 1500);
}

async function handleBotMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const bookingId = parts[1] ? parts[1].trim() : null;

        if (bookingId) {
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`, {
                    headers: supabaseHeaders
                });
                const data = await response.json();

                if (Array.isArray(data) && data.length > 0) {
                    const b = data[0];
                    const confirmMsg = `✨ <b>ЯВІР ІЛЛЯНА // STUDIO</b>\n\n` +
                        `<code>` +
                        `📅 ДАТА:    ${b.date}\n` +
                        `⏰ ЧАС:     ${b.time}\n` +
                        `✂️ ПОСЛУГА: ${b.service}\n` +
                        `💰 ВАРТІСТЬ: ${b.price || 1000} ₴` +
                        `</code>\n\n` +
                        `⚠️ <b>ПРАВИЛО СКАСУВАННЯ:</b>\n` +
                        `Зміна або скасування запису можливі <b>не пізніш ніж за 48 годин</b> до візиту.`;

                    // Інтерактивні кнопки під карткою запису
                    const inlineButtons = {
                        inline_keyboard: [
                            [
                                { text: "📍 Локація студії", url: "https://maps.google.com/?q=48.458,35.051" },
                                { text: "💬 Написати майстру", url: "https://t.me/illianahair" }
                            ]
                        ]
                    };

                    await sendTelegramMessage(chatId, confirmMsg, inlineButtons);
                    return;
                }
            } catch (e) {
                console.error("Error loading booking details:", e);
            }
        }

        const welcomeMsg = `Вітаємо у чат-боті студії <b>Явір Ілляни</b>! ✨\n\nТут зберігаються деталі ваших візитів. Якщо у вас є питання або ви бажаєте змінити час — натисніть кнопку нижче.`;
        const defaultButtons = {
            inline_keyboard: [
                [
                    { text: "📍 Локація", url: "https://maps.google.com/?q=48.458,35.051" },
                    { text: "💬 Написати майстру", url: "https://t.me/illianahair" }
                ]
            ]
        };

        await sendTelegramMessage(chatId, welcomeMsg, defaultButtons);
    }
}

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
    try {
        const bodyPayload = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        };
        if (replyMarkup) {
            bodyPayload.reply_markup = replyMarkup;
        }

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });
    } catch (e) {
        console.error("Error sending Telegram message:", e);
    }
}

// Запускаємо бота
startTelegramBotPolling();

// ------------------ API ROUTES ------------------

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/master', (req, res) => res.sendFile(path.join(__dirname, 'master.html')));

let blockedDays = [];
app.get('/api/blocked-days', (req, res) => res.json(blockedDays));

app.post('/api/block-day', (req, res) => {
    const { date, password } = req.body;
    if (password !== '1988') return res.status(403).json({ error: 'Невірний PIN-код майстра!' });
    if (date && !blockedDays.includes(date)) blockedDays.push(date);
    res.json({ success: true, blockedDays });
});

app.post('/api/unblock-day', (req, res) => {
    const { date, password } = req.body;
    if (password !== '1988') return res.status(403).json({ error: 'Невірний PIN-код майстра!' });
    blockedDays = blockedDays.filter(d => d !== date);
    res.json({ success: true, blockedDays });
});

app.get('/api/bookings', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=id.desc`, {
            method: 'GET',
            headers: supabaseHeaders
        });
        const data = await response.json();
        
        const formattedData = Array.isArray(data) ? data.map(b => ({
            ...b,
            price: b.price !== null && b.price !== undefined ? b.price : 1000,
            durationHours: b.durationHours !== null && b.durationHours !== undefined ? Number(b.durationHours) : 1.5,
            reference: (b.reference && b.reference !== 'EMPTY' && b.reference !== 'NULL') ? b.reference : (b.haircut_ref || '')
        })) : [];

        res.json(formattedData);
    } catch (error) {
        res.status(500).json([]);
    }
});

app.post('/api/bookings', async (req, res) => {
    const booking = req.body;
    try {
        const checkExisting = await fetch(`${SUPABASE_URL}/rest/v1/bookings?date=eq.${encodeURIComponent(booking.date)}`, {
            method: 'GET',
            headers: supabaseHeaders
        });
        const existingForDay = await checkExisting.json();

        if (Array.isArray(existingForDay)) {
            const reqStart = parseTimeToDecimal(booking.time);
            const reqDuration = Number(booking.durationHours || 1.5);
            const reqEnd = reqStart + reqDuration;

            const isOverlap = existingForDay.some(b => {
                const bStart = parseTimeToDecimal(b.time);
                const bDuration = Number(b.durationHours || 1.5);
                const bEnd = bStart + bDuration;
                return (reqStart < bEnd) && (reqEnd > bStart);
            });

            if (isOverlap) {
                return res.status(400).json({ success: false, error: "На жаль, цей часовий слот вже зайнято іншим записом!" });
            }
        }

        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(booking)
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(500).json({ success: false, error: errText });
        }

        let createdBookingData = null;
        const textResp = await response.text();
        if (textResp) {
            try { 
                const parsed = JSON.parse(textResp);
                createdBookingData = Array.isArray(parsed) ? parsed[0] : parsed;
            } catch(e) {}
        }

        sendMasterTelegramNotification(booking);

        try {
            const checkClient = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=*`, {
                method: 'GET',
                headers: supabaseHeaders
            });
            const clientsList = await checkClient.json();
            const cleanInputPhone = (booking.phone || '').replace(/\D/g, '').slice(-9);
            const clientExists = Array.isArray(clientsList) && clientsList.some(c => {
                const dbPhone = (c.phone || '').replace(/\D/g, '').slice(-9);
                return dbPhone && dbPhone === cleanInputPhone;
            });

            if (!clientExists) {
                await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
                    method: 'POST',
                    headers: supabaseHeaders,
                    body: JSON.stringify({
                        name: booking.name,
                        phone: booking.phone,
                        email: booking.email || '',
                        social: booking.social || ''
                    })
                });
            }
        } catch (clientErr) {}

        return res.json({ success: true, booking: createdBookingData });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/cancel-booking', async (req, res) => {
    try {
        const { date, time, phone, id } = req.body;
        let queryUrl = `${SUPABASE_URL}/rest/v1/bookings?`;
        if (id) {
            queryUrl += `id=eq.${id}`;
        } else {
            queryUrl += `date=eq.${encodeURIComponent(date)}&time=eq.${encodeURIComponent(time)}&phone=eq.${encodeURIComponent(phone)}`;
        }

        const response = await fetch(queryUrl, {
            method: 'DELETE',
            headers: supabaseHeaders
        });

        if (response.ok) {
            return res.json({ success: true, message: "Запис скасовано" });
        } else {
            const errText = await response.text();
            return res.status(500).json({ success: false, error: errText });
        }
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/works', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/works?select=*&order=id.desc`, {
            method: 'GET',
            headers: supabaseHeaders
        });
        if (response.ok) {
            const dbWorks = await response.json();
            if (Array.isArray(dbWorks) && dbWorks.length > 0) return res.json(dbWorks);
        }
    } catch (e) {}
    res.json(customWorksMemory);
});

app.post('/api/works', async (req, res) => {
    const { title, image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: "Зображення обов'язкове" });

    const newWork = {
        id: Date.now(),
        title: title || 'Робота майстра',
        image: image,
        created_at: new Date().toISOString()
    };

    try {
        await fetch(`${SUPABASE_URL}/rest/v1/works`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(newWork)
        });
    } catch (e) {}

    customWorksMemory.unshift(newWork);
    res.json({ success: true, work: newWork });
});

app.post('/api/delete-work', async (req, res) => {
    const { id } = req.body;
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/works?id=eq.${id}`, {
            method: 'DELETE',
            headers: supabaseHeaders
        });
    } catch (e) {}

    customWorksMemory = customWorksMemory.filter(w => String(w.id) !== String(id));
    res.json({ success: true });
});

app.post('/api/check-client', async (req, res) => {
    const { phone } = req.body;
    try {
        const cleanInputPhone = (phone || '').replace(/\D/g, '').slice(-9);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=*`, {
            method: 'GET',
            headers: supabaseHeaders
        });
        const clients = await response.json();
        
        const found = Array.isArray(clients) && clients.find(c => {
            const dbPhone = (c.phone || '').replace(/\D/g, '').slice(-9);
            return dbPhone && dbPhone === cleanInputPhone;
        });
        
        if (found) {
            return res.json({ isRegular: true, client: found });
        } else {
            return res.json({ isRegular: false });
        }
    } catch (error) {
        return res.status(500).json({ isRegular: false });
    }
});

app.post('/api/create-invoice', async (req, res) => {
    try {
        const { name, date, time } = req.body;

        const response = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Token": MONO_TOKEN
            },
            body: JSON.stringify({
                amount: 50000,
                ccy: 980,
                merchantPaymInfo: {
                    destination: "Завдаток за послугу (ФОП Явір І.В.)",
                    comment: `Запис клієнта ${name} на ${date} о ${time}`
                },
                redirectUrl: req.headers.referer || "https://vercel.com",
                webHookUrl: "https://example.com/webhook"
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Не вдалося створити платіж" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер та новий Telegram-бот запущено на порту ${PORT}!`));
