const TelegramBot = require('node-telegram-bot-api');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ⚠️ НАЛАШТУВАННЯ TELEGRAM БОТА
const BOT_TOKEN = '7891234567:AAExxx...'; // Вкажіть токен з @BotFather

const SUPABASE_URL = 'https://crhzelpvxdcthhevplho.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaHplbHB2eGRjdGhoZXZwbGhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjEzNzI4MSwiZXhwIjoyMTA3NzEzMjgxfQ.on7872D5eD3i95BGJVNiVdiMywjs9uMUvBwg5wdbfA8';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const bookingId = match ? match[1] : null;

    if (bookingId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`, {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            });
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                const b = data[0];
                const text = `✨ <b>Дякуємо за ваш запис у студію!</b>\n\n` +
                    `📅 <b>Дата візиту:</b> ${b.date}\n` +
                    `⏰ <b>Час:</b> ${b.time}\n` +
                    `✂️ <b>Послуга:</b> ${b.service}\n` +
                    `💰 <b>Вартість:</b> ${b.price || 1000} ₴\n\n` +
                    `⚠️ <b>ВАЖЛИВЕ ПРАВИЛО СКАСУВАННЯ:</b>\n` +
                    `Зміна або скасування запису можливі <b>не пізніш ніж за 48 годин</b> до візиту.\n\n` +
                    `Для скасування або зміни часу, будь ласка, напишіть безпосередньо в <b>Директ майстра</b>.`;

                bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
                return;
            }
        } catch (e) {
            console.error("Помилка завантаження запису в боті:", e);
        }
    }

    bot.sendMessage(chatId, "Вітаємо у чат-боті студії Явір Ілляни! ✨\nЯкщо у вас є питання або ви хочете скасувати візит, напишіть майстру в Директ.");
});
