# 🤖 Internship Assistant Bot

บอท Discord สำหรับช่วยนักศึกษาฝึกงานจัดการงานภายใน Server ได้อย่างสะดวก
สร้างด้วย **Node.js**, **Discord.js v14** และ **SQLite** — ไม่ต้องใช้ฐานข้อมูลภายนอก

---

## ✨ ฟีเจอร์ทั้งหมด

| ฟีเจอร์ | คำสั่ง | คำอธิบาย |
|---|---|---|
| **รายการงาน** | `/todo add`, `/todo list`, `/todo done` | เพิ่ม ดู และทำเครื่องหมายงานเสร็จ |
| **Daily Standup** | `/standup` | กรอกฟอร์มสรุปงานประจำวัน แล้วโพสต์ไปยัง channel |
| **การแจ้งเตือน** | `/remind add`, `/remind list` | ตั้งเวลาแจ้งเตือน บอทจะ ping ตามเวลาที่กำหนด |
| **ระบบยืนยันตัวตน** | `/auth setup` | ส่ง Auth Panel พร้อมปุ่ม Register/Login ให้ user ยืนยันตัวตนเพื่อรับ Role |
| **ช่วยเหลือ** | `/help` | แสดงคำสั่งทั้งหมด |

---

## 📁 โครงสร้างไฟล์

```
internship-assistant-bot/
├── src/
│   ├── commands/
│   │   ├── todo.js              # คำสั่ง /todo
│   │   ├── standup.js           # คำสั่ง /standup
│   │   ├── remind.js            # คำสั่ง /remind
│   │   ├── auth.js              # คำสั่ง /auth setup
│   │   └── help.js              # คำสั่ง /help
│   ├── events/
│   │   ├── ready.js             # ทำงานเมื่อบอท online
│   │   └── interactionCreate.js # จัดการ command / button / modal ทั้งหมด
│   ├── database/
│   │   ├── db.js                # เปิดการเชื่อมต่อ SQLite
│   │   └── schema.sql           # โครงสร้างตารางในฐานข้อมูล
│   ├── utils/
│   │   ├── time.js              # แปลงเวลา เช่น "30m", "2h"
│   │   ├── reminderScheduler.js # ตรวจและส่งการแจ้งเตือนทุก 30 วินาที
│   │   └── authHandler.js       # Logic ทั้งหมดของระบบยืนยันตัวตน
│   ├── deploy-commands.js       # ลงทะเบียน slash command กับ Discord
│   └── index.js                 # จุดเริ่มต้นของบอท
├── data/                        # ไฟล์ฐานข้อมูล SQLite (สร้างอัตโนมัติ)
├── .env.example                 # ตัวอย่างไฟล์ตั้งค่า
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 วิธีติดตั้งและใช้งาน

### ขั้นตอนที่ 1 — สิ่งที่ต้องมีก่อน

- [Node.js](https://nodejs.org/) **เวอร์ชัน 18 ขึ้นไป** (ตรวจสอบด้วย `node --version`)
- บัญชี Discord

---

### ขั้นตอนที่ 2 — สร้าง Discord Application และ Bot

1. เข้าไปที่ [Discord Developer Portal](https://discord.com/developers/applications)
2. คลิก **New Application** → ตั้งชื่อ → กด **Create**
3. ไปที่แท็บ **Bot** → กด **Reset Token** → **Copy** เก็บ token ไว้ (นี่คือ `DISCORD_TOKEN`)
4. ไปที่แท็บ **General Information** → **Copy** ค่า **Application ID** (นี่คือ `CLIENT_ID`)
5. ในแท็บ **Bot** ไม่ต้องเปิด Privileged Intents ใดๆ

---

### ขั้นตอนที่ 3 — เชิญบอทเข้า Server

1. ไปที่ **OAuth2 → URL Generator**
2. ติ๊ก **Scopes**: `bot` และ `applications.commands`
3. ติ๊ก **Bot Permissions** อย่างน้อย:
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
   - `Manage Roles` ← จำเป็นสำหรับระบบยืนยันตัวตน
4. คัดลอก URL ที่ได้ → เปิดในเบราว์เซอร์ → เลือก Server ที่ต้องการ → **Authorize**

---

### ขั้นตอนที่ 4 — เปิด Developer Mode และหา ID ที่จำเป็น

เปิด Developer Mode ใน Discord: **Settings → Advanced → Developer Mode**

| ID ที่ต้องการ | วิธีหา |
|---|---|
| `GUILD_ID` | คลิกขวาที่ **ไอคอน Server** → **Copy Server ID** |
| `STANDUP_CHANNEL_ID` | คลิกขวาที่ **ชื่อ channel** ที่ต้องการโพสต์ standup → **Copy Channel ID** |

> `STANDUP_CHANNEL_ID` ไม่บังคับ — ถ้าเว้นว่างไว้ บอทจะโพสต์ใน channel ที่ใช้คำสั่ง

---

### ขั้นตอนที่ 5 — ติดตั้งและตั้งค่า

```bash
# ติดตั้ง dependencies
npm install

# คัดลอกไฟล์ตั้งค่า
cp .env.example .env
# บน Windows ใช้: copy .env.example .env
```

จากนั้นเปิดไฟล์ `.env` แล้วใส่ค่าต่างๆ:

```env
DISCORD_TOKEN=token-ของคุณ
CLIENT_ID=application-id-ของคุณ
GUILD_ID=server-id-ของคุณ
STANDUP_CHANNEL_ID=channel-id-สำหรับ-standup  # ไม่บังคับ
```

---

### ขั้นตอนที่ 6 — ลงทะเบียน Slash Commands

```bash
npm run deploy
```

> ต้องรันคำสั่งนี้ทุกครั้งที่เพิ่มหรือแก้ไข command
> ถ้าตั้งค่า `GUILD_ID` ไว้ command จะปรากฏใน Server ทันที

---

### ขั้นตอนที่ 7 — เปิดบอท

```bash
npm start
```

เมื่อเห็น `Logged in as ชื่อบอท#xxxx` แสดงว่าบอทพร้อมใช้งานแล้ว ลองพิมพ์ `/help` ใน Server ได้เลย 🎉

> ระหว่างพัฒนา ใช้ `npm run dev` เพื่อให้บอท restart อัตโนมัติเมื่อแก้ไขไฟล์

---

## 🔒 วิธีตั้งค่าระบบยืนยันตัวตน

1. สร้าง Role ที่ต้องการมอบให้ user ใน Server Settings → Roles
2. ตรวจสอบว่า Role ของบอทอยู่ **สูงกว่า** Role ที่จะมอบให้
3. ใน Discord พิมพ์คำสั่ง (Admin เท่านั้น):
   ```
   /auth setup role:@ชื่อRole
   ```
   หรือถ้าต้องการใส่รูปภาพ:
   ```
   /auth setup role:@ชื่อRole image_url:https://...
   ```
4. บอทจะส่ง Auth Panel พร้อม 4 ปุ่มออกมา

**Flow ของแต่ละปุ่ม:**

| ปุ่ม | การทำงาน |
|---|---|
| 📝 สมัครสมาชิก | กรอก username + password → สร้างบัญชีใหม่ → ได้รับ Role |
| 🔑 เข้าสู่ระบบ | กรอก username + password → ตรวจสอบ → ได้รับ Role |
| 🔒 ลืมรหัสผ่าน | กรอก username + password ใหม่ → เปลี่ยนรหัสผ่าน |
| 🗝️ กรอกคีย์พิเศษ | กรอก API Key → บันทึกลงระบบ |

> รหัสผ่านถูกเข้ารหัสด้วย **scrypt** ก่อนบันทึกทุกครั้ง

---

## 🧠 การทำงานของแต่ละฟีเจอร์

- **รายการงาน** — ข้อมูลแยกกันทุก user และทุก Server หมายเลข ID ที่แสดงใน `/todo list` ใช้กับ `/todo done`
- **Daily Standup** — ใช้ป๊อปอัปฟอร์ม (Modal) เพื่อกรอกข้อมูล คำตอบจะถูกบันทึกและโพสต์ Embed สรุปไปยัง `STANDUP_CHANNEL_ID`
- **การแจ้งเตือน** — เก็บ timestamp แน่นอนในฐานข้อมูล บอทตรวจทุก 30 วินาที ถ้าบอทปิดอยู่ระหว่างที่ถึงเวลา จะส่งแจ้งเตือนทันทีเมื่อบอทเปิดใหม่
- **ระบบยืนยันตัวตน** — บัญชีผูกกับ Discord ID ของ user ป้องกันไม่ให้คนอื่น login เข้าบัญชีของคนอื่น

---

## 🛠️ แก้ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
|---|---|
| Command ไม่ปรากฏใน Discord | รัน `npm run deploy` และตรวจสอบว่า `GUILD_ID` ตรงกับ Server |
| `DISCORD_TOKEN is missing` | ยังไม่ได้สร้างไฟล์ `.env` หรือยังไม่ได้ใส่ค่า |
| Standup ไม่โพสต์ไปยัง channel | ตรวจสอบ `STANDUP_CHANNEL_ID` และสิทธิ์ของบอทใน channel นั้น |
| บอท assign Role ไม่ได้ | ตรวจสอบว่าบอทมีสิทธิ์ **Manage Roles** และ Role ของบอทอยู่สูงกว่า Role ที่จะมอบให้ |
| Error ตอนติดตั้ง | ตรวจสอบว่าใช้ Node.js เวอร์ชัน 18 ขึ้นไป แล้วรัน `npm install` ใหม่ |

---

## 📦 Tech Stack

- [discord.js v14](https://discord.js.org/)
- [Node.js SQLite](https://nodejs.org/api/sqlite.html) (built-in, ไม่ต้องติดตั้งเพิ่ม)
- [dotenv](https://github.com/motdotla/dotenv)

---

## 📄 License

MIT — ใช้และแก้ไขได้อย่างอิสระ
