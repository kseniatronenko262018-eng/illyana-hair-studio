const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const MONO_TOKEN = 'mF4VYm_rjXjOAAAF1FJJ5yw';

// Дані вашого проєкту Supabase з новим ключем service_role
const SUPABASE_URL = 'https://crhzelpvxdcthhevplho.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaHplbHB2eGRjdGhoZXZwbGhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjEzNzI4MSwiZXhwIjoyMTA3NzEzMjgxfQ.on7872D5eD3i95BGJVNiVdiMywjs9uMUvBwg5wdbfA8';

const supabaseHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

// Головна сторінка для клієнтів
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Окрема захищена сторінка кабінету майстра
app.get('/master', (req, res) => {
    res.sendFile(path.join(__dirname, 'master.html'));
});

// API: Отримати список вихідних днів
let blockedDays = [];
app.get('/api/blocked-days', (req, res) => {
    res.json(blockedDays);
});

app.post('/api/block-day', (req, res) => {
    const { date, password } = req.body;
    if (password !== '1988') {
        return res.status(403).json({ error: 'Невірний PIN-код майстра!' });
    }
    if (date && !blockedDays.includes(date)) {
        blockedDays.push(date);
    }
    res.json({ success: true, blockedDays });
});

app.post('/api/unblock-day', (req, res) => {
    const { date, password } = req.body;
    if (password !== '1988') {
        return res.status(403).json({ error: 'Невірний PIN-код майстра!' });
    }
    blockedDays = blockedDays.filter(d => d !== date);
    res.json({ success: true, blockedDays });
});

// API: Отримати всі записи з хмари Supabase (таблиця bookings)
app.get('/api/bookings', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*`, {
            method: 'GET',
            headers: supabaseHeaders
        });
        const data = await response.json();
        res.json(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Помилка отримання записів з Supabase:", error);
        res.status(500).json([]);
    }
});

// API: Додати новий запис та автоматично зберегти/оновити клієнта в базі
app.post('/api/bookings', async (req, res) => {
    const booking = req.body;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(booking)
        });
        const data = await response.json();

        const checkClient = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=*`, {
            method: 'GET',
            headers: supabaseHeaders
        });
        const clientsList = await checkClient.json();
        const cleanInputPhone = (booking.phone || '').replace(/\D/g, '').slice(-9);
        const clientExists = clientsList.some(c => {
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

        res.json({ success: true, data });
    } catch (error) {
        console.error("Помилка збереження запису в Supabase:", error);
        res.status(500).json({ error: 'Не вдалося зберегти запис у хмару' });
    }
});

// API: Перевірка клієнта за останками 9 цифр (ігнорує +38, пробіли тощо)
app.post('/api/check-client', async (req, res) => {
    const { phone } = req.body;
    try {
        const cleanInputPhone = (phone || '').replace(/\D/g, '').slice(-9);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=*`, {
            method: 'GET',
            headers: supabaseHeaders
        });
        const clients = await response.json();
        
        const found = clients.find(c => {
            const dbPhone = (c.phone || '').replace(/\D/g, '').slice(-9);
            return dbPhone && dbPhone === cleanInputPhone;
        });
        
        if (found) {
            res.json({ isRegular: true, client: found });
        } else {
            res.json({ isRegular: false });
        }
    } catch (error) {
        console.error("Помилка перевірки клієнта:", error);
        res.status(500).json({ isRegular: false });
    }
});

// Ендпоінт для створення платежу через еквайринг Monobank
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
                redirectUrl: req.headers.referer || "https://render.com",
                webHookUrl: "https://example.com/webhook"
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Помилка при створенні інвойсу:", error);
        res.status(500).json({ error: "Не вдалося створити платіж" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}!`);
});
