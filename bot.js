const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Your real Telegram bot token
const token = '8890048280:AAH-p53MOeIJ7J5YXTPCnWBfqFIsjL9A9-s';
const adminGroupId = '-1004468798532';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Setup Express server
const app = express();
app.use(express.json()); // Essential to read data sent from your frontend web app

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🚀 Ha Fantasy Bot is active and listening for web requests...');
});

// 1. API Endpoint for Deposits from Vercel Frontend
app.post('/api/deposit', async (req, res) => {
  try {
    const { userId, userName, amount, receipt } = req.body;

    const messageText = `📥 **New Deposit Request**\n\n` +
      `👤 **User:** ${userName || 'User'} (ID: \`${userId || 'N/A'}\`)\n` +
      `💰 **Amount:** ${amount || '100'} ETB\n` +
      `📄 **Receipt:** ${receipt || 'N/A'}\n\n` +
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
    res.status(200).json({ success: true, message: 'Sent to admin group' });
  } catch (error) {
    console.error('Error handling deposit API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. API Endpoint for Withdrawals from Vercel Frontend
app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, userName, amount, accountDetails } = req.body;

    const messageText = `📤 **New Withdrawal Request**\n\n` +
      `👤 **User:** ${userName || 'User'} (ID: \`${userId || 'N/A'}\`)\n` +
      `💸 **Amount:** ${amount || '100'} ETB\n` +
      `🏦 **Account/Phone:** ${accountDetails || 'N/A'}\n\n` +
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
    res.status(200).json({ success: true, message: 'Sent to admin group' });
  } catch (error) {
    console.error('Error handling withdraw API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle admin button clicks inside the Telegram group
bot.on('callback_query', async (query) => {
  const action = query.data;
  const msg = query.message;

  if (action.startsWith('approve_dep_')) {
    const [, , userId, amount] = action.split('_');
    if (userId) bot.sendMessage(userId, `✅ Your deposit of ${amount} ETB has been approved by the admin!`);
    bot.editMessageText(`${msg.text}\n\n✅ **STATUS: APPROVED BY ADMIN**`, {
      chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'Markdown'
    });
    bot.answerCallbackQuery(query.id, { text: 'Deposit approved!' });
  } 
  else if (action.startsWith('reject_dep_')) {
    const [, , userId] = action.split('_');
    if (userId) bot.sendMessage(userId, `❌ Your deposit request was rejected. Please contact support.`);
    bot.editMessageText(`${msg.text}\n\n❌ **STATUS: REJECTED**`, {
      chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'Markdown'
    });
    bot.answerCallbackQuery(query.id, { text: 'Deposit rejected.' });
  }
  else if (action.startsWith('approve_wdraw_')) {
    const [, , userId, amount] = action.split('_');
    if (userId) bot.sendMessage(userId, `🎉 Your withdrawal of ${amount} ETB has been sent to your account!`);
    bot.editMessageText(`${msg.text}\n\n✅ **STATUS: PAID OUT**`, {
      chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'Markdown'
    });
    bot.answerCallbackQuery(query.id, { text: 'Withdrawal completed!' });
  } 
  else if (action.startsWith('reject_wdraw_')) {
    const [, , userId] = action.split('_');
    if (userId) bot.sendMessage(userId, `❌ Your withdrawal request was rejected. Please contact support.`);
    bot.editMessageText(`${msg.text}\n\n❌ **STATUS: REJECTED**`, {
      chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'Markdown'
    });
    bot.answerCallbackQuery(query.id, { text: 'Withdrawal rejected.' });
  }
});

console.log('🚀 Ha Fantasy Bot is active and listening for web requests...');

