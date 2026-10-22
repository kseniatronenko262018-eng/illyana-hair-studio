const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname)));

const MONO_TOKEN = 'mF4VYm_rjXjOAAAF1FJJ5yw';
const TG_BOT_TOKEN = '8591183866:AAFrBrQrZe_1C1azzBdUmqR4Habuv7LLnQI';
const TG_BOT_USERNAME = 'illyana_hair_studio_bot';
const MASTER_TG_ID = '684896405'; 

const SUPABASE_URL = 'https://crhzelpvxdcthhevplho.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaHplbHB2eGRjdGhoZXZwbGhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjEzNzI4MSwiZXhwIjoyMTA3NzEzMjgxfQ.on7872D5eD3i95BGJVNiVdiMywjs9uMUvBwg5wdbfA8';

const supabaseHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/master', (req, res) => res.sendFile(path.join(__dirname, 'master.html')));

let blockedDays = [];
app.get('/api/blocked-days', (req, res) => res.json(blockedDays));
app.post('/api/block-day', (req, res) => {
    if (req.body.password !== '1414') return res.status(403).json({ error: 'Невірний пароль!' });
    if (req.body.date && !blockedDays.includes(req.body.date)) blockedDays.push(req.body.date);
    res.json({ success: true, blockedDays });
});
app.post('/api/unblock-day', (req, res) => {
    if (req.body.password !== '1414') return res.status(403).json({ error: 'Невірний пароль!' });
    blockedDays = blockedDays.filter(d => d !== req.body.date);
    res.json({ success: true, blockedDays });
});

app.get('/api/works', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/works?select=*&order=id.desc`, { method: 'GET', headers: supabaseHeaders });
        const data = await response.json();
        res.json(Array.isArray(data) ? data : []);
    } catch (error) { res.status(500).json([]); }
});

app.post('/api/works', async (req, res) => {
    try {
        const { title, image } = req.body;
        const response = await fetch(`${SUPABASE_URL}/rest/v1/works`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify({ title: title || 'Робота студії', image })
        });
        
        if (!response.ok) {
            return res.status(400).json({ success: false, error: "Database rejected the file" });
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/delete-work', async (req, res) => {
    try {
        const { id } = req.body;
        await fetch(`${SUPABASE_URL}/rest/v1/works?id=eq.${id}`, {
            method: 'DELETE',
            headers: supabaseHeaders
        });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

async function sendTelegramNotification(chatId, text) {
    try {
        await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: chatId, 
                text: text, 
                parse_mode: 'HTML',
                disable_web_page_preview: true 
            })
        });
    } catch (e) { console.error("Telegram error:", e); }
}

let lastClientMessagePerChat = {};
let pendingClientMessages = {};
let lastUpdateId = 0;

async function pollTelegram() {
    try {
        let res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`);
        let data = await res.json();
        if (data.ok && data.result.length > 0) {
            for (let update of data.result) {
                lastUpdateId = update.update_id;
                if (update.message && update.message.text && update.message.text.startsWith('/start')) {
                    let chatId = update.message.chat.id;
                    let parts = update.message.text.split(' ');
                    
                    if (parts.length > 1) {
                        let ref = parts[1];
                        if (pendingClientMessages[ref]) {
                            lastClientMessagePerChat[chatId] = pendingClientMessages[ref];
                            await sendTelegramNotification(chatId, pendingClientMessages[ref]);
                            delete pendingClientMessages[ref]; 
                        } else {
                            let foundMsg = await getLastClientBookingMessage();
                            if (foundMsg) {
                                await sendTelegramNotification(chatId, foundMsg);
                            } else {
                                await sendTelegramNotification(chatId, "✨ Ваш запис оформлено.\n\n💬 Для скасування чи зміни часу напишіть у Директ майстру:\nhttps://www.instagram.com/i.ll.yana?srtk=ZDQwZnZyZnFxdXc=");
                            }
                        }
                    } else {
                        if (lastClientMessagePerChat[chatId]) {
                            await sendTelegramNotification(chatId, lastClientMessagePerChat[chatId]);
                        } else {
                            await sendTelegramNotification(chatId, "✨ Вітаємо у студії Явір Ілляни!\n\n💬 З питань запису, скасування чи зміни часу звертайтесь у Директ майстра:\nhttps://www.instagram.com/i.ll.yana?srtk=ZDQwZnZyZnFxdXc=");
                        }
                    }
                }
            }
        }
    } catch (e) {}
    setTimeout(pollTelegram, 2000);
}
pollTelegram();

async function getLastClientBookingMessage() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=id.desc&limit=1`, { method: 'GET', headers: supabaseHeaders });
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            const b = data[0];
            let priceNum = Number(b.price) || 0;
            let remainder = priceNum > 500 ? priceNum - 500 : 0;
            
            let depositInfo = `💳 <b>ПЕРЕДОПЛАТА:</b> 500 ₴ (враховано)\n💵 <b>ЗАЛИШОК ДО СПЛАТИ:</b> ${remainder} ₴`;

            return `✨ <b>ЯВІР ІЛЛЯНА // STUDIO</b>\n\n` +
                   `📅 <b>ДАТА:</b> ${b.date}\n` +
                   `⏰ <b>ЧАС:</b> ${b.time}\n` +
                   `✂️ <b>ПОСЛУГА:</b> ${b.service}\n` +
                   `💰 <b>ЗАГАЛЬНА ВАРТІСТЬ:</b> ${priceNum} ₴\n` +
                   `${depositInfo}\n\n` +
                   `📍 <b>Локація:</b> м. Дніпро, вул. Володимира Вернадського, 35-Б\n\n` +
                   `⚠️ <b>ПРАВИЛО СКАСУВАННЯ:</b>\nЗміна або скасування запису можливі <b>не пізніш ніж за 48 годин</b> до візиту.\n\n` +
                   `💬 <b>Для скасування чи зміни часу напишіть у Директ майстру:</b>\nhttps://www.instagram.com/i.ll.yana?srtk=ZDQwZnZyZnFxdXc=`;
        }
    } catch(e) {}
    return null;
}

app.get('/api/bookings', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=id.desc`, { method: 'GET', headers: supabaseHeaders });
        const data = await response.json();
        res.json(Array.isArray(data) ? data : []);
    } catch (error) { res.status(500).json([]); }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { name, phone, email, social, service, price, durationHours, date, time, reference, isRegular, bookingRef } = req.body;

        const payloadToInsert = { name, phone, email: email || '', social: social || '', service, price, durationHours, date, time, reference: reference || '' };

        await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(payloadToInsert)
        });

        const cleanPhone = (phone || '').replace(/\D/g, '').slice(-9);
        const checkClient = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=*`, { method: 'GET', headers: supabaseHeaders });
        const clientsList = await checkClient.json();
        const exists = Array.isArray(clientsList) && clientsList.some(c => (c.phone || '').replace(/\D/g, '').slice(-9) === cleanPhone);

        if (!exists) {
            await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify({ name, phone, email: email || '', social: social || '' })
            });
        }

        let priceNum = Number(price) || 0;
        let depositInfo = "";
        
        if (isRegular) {
            depositInfo = `💎 <b>Статус:</b> Постійний клієнт\n💰 <b>До сплати:</b> ${priceNum} ₴ (без передоплати)`;
        } else {
            let remainder = priceNum > 500 ? priceNum - 500 : 0;
            depositInfo = `💳 <b>ПЕРЕДОПЛАТА:</b> 500 ₴ (сплачено)\n💵 <b>ЗАЛИШОК ДО СПЛАТИ:</b> ${remainder} ₴`;
        }

        let clientMessage = `✨ <b>ЯВІР ІЛЛЯНА // STUDIO</b>\n\n` +
                          `📅 <b>ДАТА:</b> ${date}\n` +
                          `⏰ <b>ЧАС:</b> ${time}\n` +
                          `✂️ <b>ПОСЛУГА:</b> ${service}\n` +
                          `💰 <b>ЗАГАЛЬНА ВАРТІСТЬ:</b> ${priceNum} ₴\n` +
                          `${depositInfo}\n\n` +
                          `📍 <b>Локація:</b> м. Дніпро, вул. Володимира Вернадського, 35-Б\n\n` +
                          `⚠️ <b>ПРАВИЛО СКАСУВАННЯ:</b>\nЗміна або скасування запису можливі <b>не пізніш ніж за 48 годин</b> до візиту.\n\n` +
                          `💬 <b>Для скасування чи зміни часу напишіть у Директ майстру:</b>\nhttps://www.instagram.com/i.ll.yana?srtk=ZDQwZnZyZnFxdXc=`;

        let masterMessage = `🔔 <b>НОВИЙ ЗАПИС!</b>\n\n👤 <b>Клієнт:</b> ${name}\n📞 <b>Телефон:</b> ${phone}\n💬 <b>Соцмережі:</b> ${social || '—'}\n\n` + clientMessage;

        await sendTelegramNotification(MASTER_TG_ID, masterMessage);
        
        if (bookingRef) {
            pendingClientMessages[bookingRef] = clientMessage;
        }

        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/cancel-booking', async (req, res) => {
    try {
        const { id } = req.body;
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, { method: 'DELETE', headers: supabaseHeaders });
        if (response.ok) return res.json({ success: true });
        res.status(500).json({ success: false });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/check-client', async (req, res) => {
    try {
        const cleanPhone = (req.body.phone || '').replace(/\D/g, '').slice(-9);
        const response = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=*`, { method: 'GET', headers: supabaseHeaders });
        const clients = await response.json();
        const found = Array.isArray(clients) && clients.find(c => (c.phone || '').replace(/\D/g, '').slice(-9) === cleanPhone);
        res.json({ isRegular: !!found });
    } catch (error) { res.status(500).json({ isRegular: false }); }
});

app.post('/api/create-invoice', async (req, res) => {
    try {
        const response = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Token": MONO_TOKEN },
            body: JSON.stringify({
                amount: 50000,
                ccy: 980,
                merchantPaymInfo: { destination: "Завдаток за послугу (ФОП Явір І.В.)", comment: `Запис на ${req.body.date} о ${req.body.time}` },
                redirectUrl: `https://t.me/${TG_BOT_USERNAME}?start=${req.body.bookingRef}`
            })
        });
        res.json(await response.json());
    } catch (error) { res.status(500).json({ error: "Не вдалося створити платіж" }); }
});

app.listen(process.env.PORT || 3000, () => console.log('Сервер запущено!'));
