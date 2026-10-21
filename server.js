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
    if (req.body.password !== '1988') return res.status(403).json({ error: 'Невірний PIN-код!' });
    if (req.body.date && !blockedDays.includes(req.body.date)) blockedDays.push(req.body.date);
    res.json({ success: true, blockedDays });
});
app.post('/api/unblock-day', (req, res) => {
    if (req.body.password !== '1988') return res.status(403).json({ error: 'Невірний PIN-код!' });
    blockedDays = blockedDays.filter(d => d !== req.body.date);
    res.json({ success: true, blockedDays });
});

let worksCache = [];
app.get('/api/works', (req, res) => res.json(worksCache));
app.post('/api/works', (req, res) => {
    const { title, image } = req.body;
    const newWork = { id: Date.now().toString(), title: title || 'Робота студії', image };
    worksCache.unshift(newWork);
    res.json({ success: true, work: newWork });
});
app.post('/api/delete-work', (req, res) => {
    const { id } = req.body;
    worksCache = worksCache.filter(w => w.id !== id);
    res.json({ success: true });
});

app.get('/api/bookings', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=id.desc`, { method: 'GET', headers: supabaseHeaders });
        const data = await response.json();
        const formattedData = Array.isArray(data) ? data.map(b => ({
            ...b,
            price: b.price || 1000,
            durationHours: b.durationHours || 1.5,
            reference: (b.reference && b.reference !== 'EMPTY' && b.reference !== 'NULL') ? b.reference : (b.haircut_ref || '')
        })) : [];
        res.json(formattedData);
    } catch (error) { res.status(500).json([]); }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const payloadToInsert = {
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email || '',
            social: req.body.social || '',
            service: req.body.service,
            price: req.body.price,
            durationHours: req.body.durationHours,
            date: req.body.date,
            time: req.body.time,
            reference: req.body.reference || ''
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(payloadToInsert)
        });

        if (!response.ok) return res.status(500).json({ success: false, error: await response.text() });

        const cleanPhone = (req.body.phone || '').replace(/\D/g, '').slice(-9);
        const checkClient = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=*`, { method: 'GET', headers: supabaseHeaders });
        const clientsList = await checkClient.json();
        const exists = Array.isArray(clientsList) && clientsList.some(c => (c.phone || '').replace(/\D/g, '').slice(-9) === cleanPhone);

        if (!exists) {
            await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify({ name: req.body.name, phone: req.body.phone, email: req.body.email || '', social: req.body.social || '' })
            });
        }

        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/cancel-booking', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, error: "ID не передано" });
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, { method: 'DELETE', headers: supabaseHeaders });
        if (response.ok) return res.json({ success: true });
        res.status(500).json({ success: false, error: await response.text() });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
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
                merchantPaymInfo: { destination: "Завдаток за послугу (ФОП Явір І.В.)", comment: `Запис клієнта ${req.body.name} на ${req.body.date} о ${req.body.time}` },
                redirectUrl: `https://t.me/${TG_BOT_USERNAME}`
            })
        });
        res.json(await response.json());
    } catch (error) { res.status(500).json({ error: "Не вдалося створити платіж" }); }
});

app.listen(process.env.PORT || 3000, () => console.log('Сервер запущено!'));
