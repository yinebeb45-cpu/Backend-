const TelegramBot = require('node-telegram-bot-api');

// 1. Paste your Bot Token from @BotFather below:
const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';

// 2. Your Private Telegram Group Chat ID:
const ADMIN_CHAT_ID = '-4468798532';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🚀 Ha Fantasy Bot is active and listening for web requests...');

// Listen for WebApp Data sent from index.html (Deposits & Withdrawals)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);

      // --- HANDLE DEPOSIT SUBMISSIONS ---
      if (data.type === 'DEPOSIT_SUBMISSION') {
        const depositNotice = 
          `🚨 *NEW DEPOSIT REQUEST*\n\n` +
          `👤 *User:* ${user.first_name} ${user.last_name \vert{}\vert{} ''} (@${user.username || 'N/A'})\n` +
          `🆔 *User Telegram ID:* \`${user.id}\`\n` +
          `💵 *Amount:* ${data.amount} ETB\n\n` +
          `📜 *Telebirr SMS / Receipt:* \n\`${data.receipt}\``;

        // Forward request directly to your private admin group with buttons
        await bot.sendMessage(ADMIN_CHAT_ID, depositNotice, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve Deposit', callback_data: `approve_dep_${user.id}_${data.amount}` },
                { text: '❌ Reject', callback_data: `reject_dep_${user.id}` }
              ]
            ]
          }
        });

        // Send confirmation back to the user in their private chat
        await bot.sendMessage(chatId, "✅ Your deposit request has been forwarded to management. It will be verified shortly!");
      }

      // --- HANDLE WITHDRAWAL REQUESTS ---
      if (data.type === 'WITHDRAWAL_REQUEST') {
        const withdrawNotice = 
          `💸 *NEW WITHDRAWAL REQUEST*\n\n` +
          `👤 *User:* ${user.first_name} ${user.last_name \vert{}\vert{} ''} (@${user.username || 'N/A'})\n` +
          `🆔 *User Telegram ID:* \`${user.id}\`\n` +
          `🏦 *Method:* ${data.method.toUpperCase()}\n` +
          `👤 *Account Name:* ${data.accountName}\n` +
          `🔢 *Account/Phone:* \`${data.accountNo}\``;

        // Forward request to your private admin group
        await bot.sendMessage(ADMIN_CHAT_ID, withdrawNotice, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Mark Paid', callback_data: `paid_wit_${user.id}` },
                { text: '❌ Reject', callback_data: `reject_wit_${user.id}` }
              ]
            ]
          }
        });

        await bot.sendMessage(chatId, "💸 Your withdrawal request has been received and is being processed.");
      }

    } catch (err) {
      console.error('Error parsing WebApp data:', err);
    }
  }
});

// --- HANDLE ADMIN BUTTON ACTIONS IN THE PRIVATE GROUP ---
bot.on('callback_query', async (query) => {
  const [action, type, userId, amount] = query.data.split('_');

  // Admin clicks "Approve Deposit"
  if (action === 'approve' && type === 'dep') {
    await bot.answerCallbackQuery(query.id, { text: "Deposit Approved!" });
    
    // Notify the user directly in private chat
    await bot.sendMessage(userId, `🎉 Your deposit of ${amount || ''} ETB has been approved! You can now join contests.`);
    
    // Update the notification in the private group
    await bot.editMessageText(query.message.text + "\n\n✅ *STATUS: APPROVED BY ADMIN*", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: 'Markdown'
    });
  }

  // Admin clicks "Reject Deposit"
  if (action === 'reject' && type === 'dep') {
    await bot.answerCallbackQuery(query.id, { text: "Deposit Rejected" });
    
    await bot.sendMessage(userId, "❌ Your deposit request could not be verified. Please contact support.");
    
    await bot.editMessageText(query.message.text + "\n\n❌ *STATUS: REJECTED BY ADMIN*", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: 'Markdown'
    });
  }

  // Admin clicks "Mark Paid"
  if (action === 'paid' && type === 'wit') {
    await bot.answerCallbackQuery(query.id, { text: "Marked as Paid!" });
    
    await bot.sendMessage(userId, "🎉 Your withdrawal has been processed and sent to your account!");
    
    await bot.editMessageText(query.message.text + "\n\n✅ *STATUS: PAID OUT*", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: 'Markdown'
    });
  }
});
