import TelegramBot from 'node-telegram-bot-api';

import dotenv from "dotenv";
dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

export default bot;