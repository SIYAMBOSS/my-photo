import telebot
import requests
import base64
import json

# সরাসরি আপনার টোকেন ও আইডি বসানো হয়েছে
BOT_TOKEN = "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k"
GH_TOKEN = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN" # এখানে আপনার গিটহাব টোকেনটি বসান
REPO = "SIYAMBOSS/siyam-vault"
MY_ID = 7416528268

bot = telebot.TeleBot(BOT_TOKEN)

def set_status_on_github(status):
    url = f"https://api.github.com/repos/{REPO}/contents/status.json"
    headers = {"Authorization": f"token {GH_TOKEN}"}
    
    # বর্তমান ফাইলের sha সংগ্রহ
    res = requests.get(url, headers=headers).json()
    sha = res.get('sha')
    
    # নতুন ডাটা এনকোড করা
    content = json.dumps({"allowDownload": status})
    encoded = base64.b64encode(content.encode()).decode()
    
    data = {
        "message": f"Security: {'ON' if not status else 'OFF'}",
        "content": encoded,
        "sha": sha
    }
    requests.put(url, json=data, headers=headers)

@bot.message_handler(commands=['start', 'control'])
def control(message):
    if message.chat.id == MY_ID:
        markup = telebot.types.InlineKeyboardMarkup()
        markup.add(
            telebot.types.InlineKeyboardButton("✅ Download ON", callback_data="on"),
            telebot.types.InlineKeyboardButton("❌ Download OFF", callback_data="off")
        )
        bot.send_message(message.chat.id, "🎛️ SIYAM VAULT Control Panel:", reply_markup=markup)
    else:
        bot.reply_to(message, "🚫 Unauthorized Access.")

@bot.callback_query_handler(func=lambda call: True)
def callback_query(call):
    if call.data == "on":
        set_status_on_github(True)
        bot.edit_message_text("🔓 Status: Users can now download photos from Website.", call.message.chat.id, call.message.message_id)
    else:
        set_status_on_github(False)
        bot.edit_message_text("🔒 Status: Website is now Protected (No Download).", call.message.chat.id, call.message.message_id)

bot.infinity_polling()
