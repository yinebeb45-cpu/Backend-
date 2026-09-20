const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Replace with your actual token from BotFather
const token = 'YOUR_TELEGRAM_BOT_TOKEN';
const adminGroupId = '-4468798532';

// Create a bot instance that uses polling to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Setup a basic Express server to satisfy Render's port binding requirement
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🚀 Ha Fantasy Bot is active and listening for web requests...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle incoming messages / WebApp data
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Handle deposit submissions from Mini App text or data
  if (text && text.startsWith('DEPOSIT_SUBMIT:')) {
    const parts = text.split(':');
    const amount = parts[1] || '100';
    const receipt = parts[2] || 'N/A';
    
    const userName = msg.from.first_name || 'User';
    const userId = msg.from.id;

    const messageText = `📥 **New Deposit Request**\n\n` +
      `👤 **User:** ${userName} (ID: \`${userId}\`)\n` +
      `💰 **Amount:** ${amount} ETB\n` +
      `📄 **Receipt:** ${receipt}\n\n` +
      `⏳ **Status:** Pending Admin Approval`;

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Approve Deposit', callback_data: `approve_${userId}_${amount}` },
            { text: '❌ Reject', callback_data: `reject_${userId}` }
          ]
        ]
      }
    };

    // Forward request to the private admin group
    await bot.sendMessage(adminGroupId, messageText, { parse_mode: 'Markdown', ...inlineKeyboard });
    bot.sendMessage(chatId, '✅ Your deposit request has been submitted and is pending admin approval.');
  }
});

// Handle admin button clicks
bot.on('callback_query', async (query) => {
  const action = query.data;
  const msg = query.message;

  if (action.startsWith('approve_')) {
    const [, userId, amount] = action.split('_');

    // Notify user
    bot.sendMessage(userId, `✅ Your deposit of ${amount} ETB has been approved by the admin!`);

    // Update admin group message
    bot.editMessageText(`${msg.text}\n\n✅ **STATUS: APPROVED BY ADMIN**`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'Markdown'
    });
    
    bot.answerCallbackQuery(query.id, { text: 'Deposit approved!' });
  } else if (action.startsWith('reject_')) {
    const [, userId] = action.split('_');

    // Notify user
    bot.sendMessage(userId, `❌ Your deposit request was rejected. Please contact support if this was a mistake.`);

    // Update admin group message
    bot.editMessageText(`${msg.text}\n\n❌ **STATUS: REJECTED**`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'Markdown'
    });

    bot.answerCallbackQuery(query.id, { text: 'Deposit rejected.' });
  }
});

console.log('🚀 Ha Fantasy Bot is active and listening for web requests...');

