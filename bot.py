import os
import telebot
import requests
import base64
import time

# গিটহাব সিক্রেটস থেকে টোকেনগুলো আসবে
BOT_TOKEN = os.getenv('BOT_TOKEN')
GH_TOKEN = os.getenv('GH_TOKEN')
REPO = "SIYAMBOSS/my-photo"

bot = telebot.TeleBot(BOT_TOKEN)
user_data = {}

@bot.message_handler(commands=['start'])
def start(message):
    bot.send_message(message.chat.id, "🔐 **Welcome to SIYAM VAULT!**\n\nপ্রথমে আপনার জিমেইল আইডি দিন:")
    bot.register_next_step_handler(message, get_email)

def get_email(message):
    email = message.text.strip().lower()
    user_data[message.chat.id] = {'email': email}
    bot.send_message(message.chat.id, "🔑 এবার একটি সিক্রেট টোকেন (পাসওয়ার্ড) দিন:")
    bot.register_next_step_handler(message, get_token)

def get_token(message):
    token = message.text.strip()
    user_data[message.chat.id]['token'] = token
    bot.send_message(message.chat.id, f"✅ সেটআপ সম্পন্ন!\n🎯 Gmail: `{user_data[message.chat.id]['email']}`\n\nএখন ফটো বা ভিডিও পাঠান, আমি সেভ করে দিচ্ছি।")

@bot.message_handler(content_types=['photo', 'video'])
def handle_media(message):
    if message.chat.id not in user_data:
        bot.send_message(message.chat.id, "⚠️ আগে /start দিয়ে জিমেইল সেট করুন!")
        return

    email = user_data[message.chat.id]['email']
    
    if message.content_type == 'photo':
        file_id = message.photo[-1].file_id
        ext = ".jpg"
    else:
        file_id = message.video.file_id
        ext = ".mp4"

    file_info = bot.get_file(file_id)
    downloaded = bot.download_file(file_info.file_path)
    
    filename = f"{int(time.time_ns())}{ext}"
    path = f"vault/{email}/photos/{filename}"
    content = base64.b64encode(downloaded).decode('utf-8')
    
    url = f"https://api.github.com/repos/{REPO}/contents/{path}"
    headers = {"Authorization": f"token {GH_TOKEN}"}
    data = {"message": f"Cloud Sync: {email}", "content": content}
    
    res = requests.put(url, json=data, headers=headers)
    if res.status_code == 201:
        bot.send_message(message.chat.id, "✅ Uploaded to Vault!")

bot.infinity_polling()
