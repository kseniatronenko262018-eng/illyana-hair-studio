async function uploadImageToImgBB(file) {
    if (!file) return '';
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        // Використовуємо публічний безкоштовний ключ API ImgBB для сайту-візитки
        let response = await fetch('https://api.imgbb.com/1/upload?key=6d207e02949e29f8f41e1277a06f3630', {
            method: 'POST',
            body: formData
        });
        let result = await response.json();
        if (result && result.success) {
            return result.data.url; // Повертає пряме посилання на картинку
        }
    } catch (e) {
        console.warn("Помилка завантаження фото на хостинг:", e);
    }
    return file.name; // Якщо сталася помилка, запишеться хоча б назва файлу
}

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
        let hairPhotoInput = document.getElementById('clientHairPhoto');
        let refPhotoInput = document.getElementById('clientRefPhoto');

        let uploadedPhotoUrl = '';
        if (refPhotoInput && refPhotoInput.files && refPhotoInput.files[0]) {
            uploadedPhotoUrl = await uploadImageToImgBB(refPhotoInput.files[0]);
        } else if (hairPhotoInput && hairPhotoInput.files && hairPhotoInput.files[0]) {
            uploadedPhotoUrl = await uploadImageToImgBB(hairPhotoInput.files[0]);
        }

        let finalReferenceInfo = selectedHaircutRef || uploadedPhotoUrl || 'EMPTY';

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
            price: Number(selectedServiceData.price),
            durationHours: Number(selectedServiceData.durationHours),
            date: selectedDate,
            time: selectedTimeSlot,
            reference: finalReferenceInfo
        };

        let bookRes = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });

        let responseText = await bookRes.text();
        let bookData;
        try {
            bookData = JSON.parse(responseText);
        } catch (e) {
            throw new Error("Відповідь сервера не у форматі JSON: " + responseText);
        }

        if (!bookRes.ok || bookData.success === false) {
            throw new Error(bookData.error || "Помилка збереження на сервері: " + responseText);
        }

        if (checkData.isRegular) {
            alert("✨ Раді знову бачити вас! Ваш запис успішно підтверджено.");
            window.location.href = TELEGRAM_BOT_URL;
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
        alert("Помилка: " + err.message);
    }
}
