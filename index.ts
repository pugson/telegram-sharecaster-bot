import { Bot as TelegramBot } from "grammy";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN env variable is not defined");
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const FARCASTER_DEEPLINK = /farcaster:\/\/casts\/0x[0-9a-fA-F]{64}\/0x[0-9a-fA-F]{64}/;

bot.on("message:text", async (ctx) => {
  const messageText = ctx.message.text;
  const chatId = ctx.message.chat.id;
  const msgId = ctx.message.message_id;

  if (!messageText || !chatId || !msgId) return;

  if (FARCASTER_DEEPLINK.test(messageText)) {
    const deeplink = messageText.match(FARCASTER_DEEPLINK)?.[0];

    // Show typing indicator in Telegram
    ctx.api.sendChatAction(chatId, "typing");

    try {
      // Thanks to @gskril for a quick way to access the Sharecaster API
      // https://github.com/gskril/raycast-commands/blob/main/sharecaster.js
      const { data: sharecaster } = await axios.post("https://sharecaster.xyz/api/share", {
        sharecast: deeplink,
      });

      const url = `https://sharecaster.xyz/${sharecaster.data}`;
      await ctx.reply(url, {
        reply_to_message_id: msgId,
        disable_notification: true,
      });
    } catch {
      console.error("Error creating Sharecaster URL");
    }
  }
});

bot.start();
console.info("[ Bot started... ]");
