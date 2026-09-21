const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Your real Telegram bot token
const token = '8890048280:AAH-p53MOeIJ7J5YXTPCnWBfqFIsjL9A9-s';
const adminGroupId = '-1004468798532';

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

  if (!text) return;

  // 1. Handle Deposit Submissions
  if (text.startsWith('DEPOSIT_SUBMIT:')) {
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
            { text: '✅ Approve Deposit', callback_data: `approve_dep_${userId}_${amount}` },
            { text: '❌ Reject', callback_data: `reject_dep_${userId}` }
          ]
        ]
      }
    };

    await bot.sendMessage(adminGroupId, messageText, { parse_mode: 'Markdown', ...inlineKeyboard });
    bot.sendMessage(chatId, '✅ Your deposit request has been submitted and is pending admin approval.');
  }

  // 2. Handle Withdrawal Requests
  else if (text.startsWith('WITHDRAW_SUBMIT:')) {
    const parts = text.split(':');
    const amount = parts[1] || '100';
    const accountDetails = parts[2] || 'N/A';
    
    const userName = msg.from.first_name || 'User';
    const userId = msg.from.id;

    const messageText = `📤 **New Withdrawal Request**\n\n` +
      `👤 **User:** ${userName} (ID: \`${userId}\`)\n` +
      `💸 **Amount:** ${amount} ETB\n` +
      `🏦 **Account/Phone:** ${accountDetails}\n\n` +
      `⏳ **Status:** Pending Admin Payout`;

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Confirm Sent', callback_data: `approve_wdraw_${userId}_${amount}` },
            { text: '❌ Reject', callback_data: `reject_wdraw_${userId}` }
          ]
        ]
      }
    };

    await bot.sendMessage(adminGroupId, messageText, { parse_mode: 'Markdown', ...inlineKeyboard });
    bot.sendMessage(chatId, '✅ Your withdrawal request has been submitted and is pending processing.');
  }
});

// Handle admin button clicks
bot.on('callback_query', async (query) => {
  const action = query.data;
  const msg = query.message;

  // Deposit Actions
  if (action.startsWith('approve_dep_')) {
    const [, , userId, amount] = action.split('_');
    bot.sendMessage(userId, `✅ Your deposit of ${amount} ETB has been approved by the admin!`);
    bot.editMessageText(`${msg.text}\n\n✅ **STATUS: APPROVED BY ADMIN**`, {
      chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'Markdown'
    });
    bot.answerCallbackQuery(query.id, { text: 'Deposit approved!' });
  } 
  else if (action.startsWith('reject_dep_')) {
    const [, , userId] = action.split('_');
    bot.sendMessage(userId, `❌ Your deposit request was rejected. Please contact support if this was a mistake.`);
    bot.editMessageText(`${msg.text}\n\n❌ **STATUS: REJECTED**`, {
      chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'Markdown'
    });
    bot.answerCallbackQuery(query.id, { text: 'Deposit rejected.' });
  }

  // Withdrawal Actions
  else if (action.startsWith('approve_wdraw_')) {
    const [, , userId, amount] = action.split('_');
    bot.sendMessage(userId, `🎉 Your withdrawal of ${amount} ETB has been sent to your account!`);
    bot.editMessageText(`${msg.text}\n\n✅ **STATUS: PAID OUT**`, {
      chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'Markdown'
    });
    bot.answerCallbackQuery(query.id, { text: 'Withdrawal completed!' });
  } 
  else if (action.startsWith('reject_wdraw_')) {
    const [, , userId] = action.split('_');
    bot.sendMessage(userId, `❌ Your withdrawal request was rejected. Please contact support.`);
    bot.editMessageText(`${msg.text}\n\n❌ **STATUS: REJECTED**`, {
      chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'Markdown'
    });
    bot.answerCallbackQuery(query.id, { text: 'Withdrawal rejected.' });
  }
});

console.log('🚀 Ha Fantasy Bot is active and listening for web requests...');
