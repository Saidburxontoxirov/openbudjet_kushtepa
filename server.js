import TelegramBot from 'node-telegram-bot-api';
import { fetchAndNotifyAdmins, sendErrorMessageToDeveloper } from './sendNotification.js';

import bot from './telegram.js';

// Store user state
const userState = {};

bot.onText(/\/start/, async (msg) => {
    if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
        // console.log(`🗑️ Deleting message from ${msg.from.username}`);

        try {
            await bot.deleteMessage(msg.message.message_id); // Delete the received message
            // console.log("✅ Message deleted successfully");
        } catch (error) {
            console.error("❌ Error deleting message:", error.response?.data || error.message);
        }
    }

    if (!(msg.chat.type === "group" || msg.chat.type === "supergroup")) {
        const chatId = msg.chat.id;
        bot.sendMessage(msg.chat.id, "✅   Assalom alaykum " + msg.from.first_name + "   ✅ ");

        bot.sendPhoto(chatId, "./images/voterrights-05.png", {
            caption: '<a href="https://openbudget.uz/boards/initiatives/initiative/32/6a6e3d7f-49d6-48aa-b8f8-a2df7932253e">Ko\'proq ma\'lumot uchun havola</a>' +
                "\n\n To'lovlar bo'yicha: https://t.me/open_byudjet_isbot"
            ,
            parse_mode: "HTML",
        });


        bot.sendMessage(msg.chat.id, "\n\n \t \t \t \t Qo'shtepa qishlog'i uchun ovoz bering va har bir qabul qilingan ovozingiz uchun pul yutug'ini qo'lga kiriting " +
            "\n\n \t\t\t\t\t\ Ovoz berish uchun quyidagi tugmani bosing 👇", {
            "reply_markup": {
                "keyboard": [["Ovoz bering va pul ishlang"]]
            }
        })
    }else{
        bot.deleteMessage(msg.message_id); 
    }
});

const uzbekistanPhoneRegex = /^(?:\998)(?:90|91|93|94|95|97|98|99|33|50|77|88)\d{7}$/;
const secondVariantPhoneRegex = /^(?:90|91|93|94|95|97|98|99|33|50|77|88)\d{7}$/;

// habarlarni o'qib olish uchun
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text !== 'undefined' && ((msg.text ?? "").toString() === "Ovoz bering va pul ishlang")) {
        // Create a keyboard button that requests contact
        const keyboard = {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "📞 Mening nomerim",
                            request_contact: true, // This allows the button to request contact
                        },
                    ],
                    ['Boshqa nomerdan ovoz berish']
                ],
                resize_keyboard: true,
                one_time_keyboard: true, // Keyboard disappears after contact is sent
            }
        };

        // bot.sendMessage(chatId, "Please share your contact info:", keyboard);
        bot.sendMessage(chatId, "Iltimos quyidagi tugmalardan birini tanlang:", keyboard);
    }

    const contact = msg?.contact;

    if (contact) {
        const phoneNumber = contact.phone_number;
        const firstName = contact.first_name || "Unknown";
        const lastName = contact.last_name || "";
        const userName = msg.from.username ?? "";


        // console.log(`New Contact: ${firstName} ${lastName} - ${phoneNumber}`);

        bot.sendMessage(
            chatId,
            `📞 Telefon Ma'lumotlari :\n👤 FIO: ${firstName} ${lastName}\n📱 Tel: ${phoneNumber}\n🆔 Chat ID: ${chatId}\nUsername: ${userName}`
        );

        if (uzbekistanPhoneRegex.test(phoneNumber)) {
            bot.sendMessage(chatId, `✅ Jo'natilgan nomer: ${phoneNumber} \n5 minut ichida sizga bog'lanishadi`);
            await fetchAndNotifyAdmins(firstName, lastName, userName, phoneNumber, chatId);
        } else {
            bot.sendMessage(chatId, `❌ Noto'g'ri O'zbekistan nomer: ${phoneNumber}`);
        }
    }

    // boshqa nomerdan ovoz berish
    if (msg.text !== 'undefined' && ((msg.text ?? "").toString() === "Boshqa nomerdan ovoz berish")) {

        const keyboard = {
            reply_markup: {
                keyboard: [
                    ['Kiritilgan nomerni jo\'natish']
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };

        userState[chatId] = "awaiting_phone";

        bot.sendMessage(chatId, "📞 Iltimos telefon nomeringizni ko'rsatilgan formatda kiriting:\n`901234567`", {
            parse_mode: "Markdown",
        }, keyboard);
    }

    if (userState[chatId] === "awaiting_phone") {

        let phoneNumber = msg?.text ?? "";
        // Check if the input is a valid Uzbekistan number
        if (secondVariantPhoneRegex.test(phoneNumber) && phoneNumber.length > 0) {
            try {
                let first_name = msg.from.first_name ?? "";
                let last_name = msg.from.last_name ?? "";
                let username = msg.from.username ?? "";
                let phone_number = msg.text
                bot.sendMessage(chatId, `✅ Jo'natilgan nomer: ${phoneNumber}  \n5 minut ichida sizga bog'lanishadi`);
                await fetchAndNotifyAdmins(first_name, last_name, username, phone_number, chatId);
            } catch (err) {
                await sendErrorMessageToDeveloper(err);
            }

            // Clear user state
            delete userState[chatId];
        }

        if (!secondVariantPhoneRegex.test(phoneNumber) && msg.text !== "Boshqa nomerdan ovoz berish") {
            bot.sendMessage(chatId, "❌ Iltimos to'g'ri formatda O'zbekiston nomerini kiriting \n(Misol: `901234567`).", {
                parse_mode: "Markdown",
            });
        }
    }

});

// xatoliklarni ushlash
bot.on("polling_error", async (error) => {
    await sendErrorMessageToDeveloper(error);
    console.error("Polling error:", error);
});


