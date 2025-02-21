import bot from './telegram.js';
import fs from 'fs';

import dotenv from "dotenv";
dotenv.config();

let messageCounter = 0;
async function savePhoneNumber(phoneNumber) {
    const filePath = "phone_numbers.txt";

    // Append the phone number to the file
    fs.appendFile(filePath, phoneNumber + "\n", async (err) => {
        if (err) {
            console.error("❌ Error writing to file:", err);
            await sendErrorMessageToDeveloper(err);
        } else {
            // console.log(`✅ Phone number ${phoneNumber} saved.`);
        }
    });
}
async function readPhoneNumbers() {
    const filePath = "phone_numbers.txt";

    // Read the file and return unique phone numbers as an array
    try {
        if (!fs.existsSync(filePath)) return []; // Return empty if file doesn't exist
        const data = fs.readFileSync(filePath, "utf8");
        return [...new Set(data.split("\n").filter((num) => num.trim() !== ""))]; // Remove duplicates & empty lines
    } catch (err) {
        console.error("❌ Error reading file:", err);
        return [];
    }
}

async function fetchAndNotifyAdmins(firstName, lastName, userName, phoneNumber, chatId) {
    // Read existing numbers
    const existingNumbers = await readPhoneNumbers();
    // console.log("telefon nomerlar", existingNumbers);
    let newPhone = phoneNumber.length == 9 ? "998" + phoneNumber : phoneNumber;

    // Check if the number is already in the list
    if (existingNumbers.includes(newPhone)) {
        // console.log(`⚠️ Phone number ${newPhone} already sent. Skipping.`);
        bot.sendMessage(chatId, `\nTel: ${newPhone} avval jo'natilgan`);
    } else {
        messageCounter++;
        bot.sendMessage(
            process.env.GROUP_CHAT_ID,
            `\n🥳️️️️️️🥳️️️️️️🥳️️️️️️ ${messageCounter} - mijoz ✅✅✅  \n\n👤 FIO: ${firstName} ${lastName}\n📞 Tel: ${newPhone}\n📝 Username : @${userName}\n🆔 ChatID: ${chatId}`
        );

        await savePhoneNumber(newPhone);
    }
}

async function sendErrorMessageToDeveloper(error) {
    bot.sendMessage(
        process.env.DEVELOPER_ID,
        `🔥 Developer diqqatiga\n ` + error
    );
}

export { fetchAndNotifyAdmins, sendErrorMessageToDeveloper };

