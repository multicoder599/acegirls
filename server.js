require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();

/* ═══════════════════════════════════════
   CORS
   ═══════════════════════════════════════ */
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const corsOptions = {
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

/* ═══════════════════════════════════════
   MongoDB
   ═══════════════════════════════════════ */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/acegirls';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

/* ═══════════════════════════════════════
   Schemas
   ═══════════════════════════════════════ */
const ProfileSchema = new mongoose.Schema({
  id:       { type: Number, required: true, unique: true },
  name:     String,
  age:      Number,
  gender:   { type: String, enum: ['women','men'] },
  location: String,
  intent:   String,
  services: [String],
  image:    String,
  online:   { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
});
const Profile = mongoose.model('Profile', ProfileSchema);

const TxSchema = new mongoose.Schema({
  phoneNumber:       String,
  amountKes:         Number,
  profileName:       String,
  paymentType:       String,
  reference:         { type: String, unique: true },
  providerRequestId: String,
  status:            { type: String, default: 'pending' },
  megapayResponse:   mongoose.Schema.Types.Mixed,
  createdAt:         { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', TxSchema);

/* ═══════════════════════════════════════
   Seed Data
   ═══════════════════════════════════════ */
const DEFAULT_PROFILES = [
  { id: 0,  name: "Nelly",     age: 31, gender: "women", location: "Machakos",               intent: "Networking",             services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5769225506690633522.jpg" },
  { id: 1,  name: "Cate",      age: 23, gender: "women", location: "Kwa Ndege, Nairobi",      intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5769225506690633523.jpg" },
  { id: 2,  name: "Vanessa",   age: 26, gender: "women", location: "Kasarani, Nairobi",       intent: "Companionship",          services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                      image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5769225506690633524.jpg" },
  { id: 3,  name: "Sonia",     age: 26, gender: "women", location: "Uasin Gishu",             intent: "Companionship",          services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5769225506690633528.jpg" },
  { id: 4,  name: "Ivonne",    age: 30, gender: "women", location: "Utawala, Nairobi",        intent: "Genuine connection",     services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5769225506690633529.jpg" },
  { id: 5,  name: "Zariah",    age: 24, gender: "women", location: "Kilimani, Nairobi",       intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5771419448999873875.jpg" },
  { id: 6,  name: "Hannah",    age: 26, gender: "women", location: "Ruaka, Nairobi",          intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5771419448999873879.jpg" },
  { id: 7,  name: "Dess",      age: 22, gender: "women", location: "Kirinyaga",               intent: "Friendship",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5771419448999873880.jpg" },
  { id: 8,  name: "Cassie",    age: 24, gender: "women", location: "Mombasa",                 intent: "Networking",             services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5776077310967615184.jpg" },
  { id: 9,  name: "Faith",     age: 26, gender: "women", location: "Zimmerman, Nairobi",      intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5776364519725666229.jpg" },
  { id: 10, name: "Sly",       age: 21, gender: "men",   location: "Nairobi",                 intent: "Someone to talk to",     services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5776364519725666233.jpg" },
  { id: 11, name: "Caroline",  age: 32, gender: "women", location: "Ruaka, Nairobi",          intent: "Marriage",               services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5776364519725666240.jpg" },
  { id: 12, name: "Marie",     age: 23, gender: "women", location: "Nairobi",                 intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5778187441285041708.jpg" },
  { id: 13, name: "Tamara",    age: 24, gender: "women", location: "Thome, Nairobi",          intent: "Networking",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5778187441285041709.jpg" },
  { id: 14, name: "Kristy",    age: 23, gender: "women", location: "Mombasa",                 intent: "Long-term relationship", services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5981110326600076484.jpg" },
  { id: 15, name: "Emma",      age: 20, gender: "women", location: "Nairobi West, Nairobi",   intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5989835578431704305.jpg" },
  { id: 16, name: "Leina",     age: 23, gender: "women", location: "Mombasa",                 intent: "Networking",             services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5998913060531276909.jpg" },
  { id: 17, name: "Sonia B",   age: 21, gender: "women", location: "Lucky Summer, Nairobi",   intent: "Long-term relationship", services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5998913060531276912.jpg" },
  { id: 18, name: "Spasher",   age: 21, gender: "men",   location: "Kasarani, Nairobi",       intent: "Companionship",          services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5998913060531276914.jpg" },
  { id: 19, name: "Lady Gaga", age: 22, gender: "women", location: "Muthiga, Nairobi",        intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784529994.jpg" },
  { id: 20, name: "Natalia",   age: 26, gender: "women", location: "Kiambu Road, Nairobi",    intent: "Someone to talk to",     services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784529995.jpg" },
  { id: 21, name: "Kerubo",    age: 24, gender: "women", location: "Pipeline, Nairobi",       intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784529996.jpg" },
  { id: 22, name: "Tiphany",   age: 26, gender: "women", location: "Kahawa West, Nairobi",    intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784529997.jpg" },
  { id: 23, name: "Treeza",    age: 26, gender: "women", location: "Huruma, Nairobi",         intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784529998.jpg" },
  { id: 24, name: "Maggy",     age: 24, gender: "women", location: "Ruaka, Nairobi",          intent: "Networking",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530000.jpg" },
  { id: 25, name: "Sophi",     age: 28, gender: "women", location: "Mombasa",                 intent: "Friendship",             services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530008.jpg" },
  { id: 26, name: "Shakira",   age: 24, gender: "women", location: "Nakuru",                  intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530011.jpg" },
  { id: 27, name: "June",      age: 24, gender: "women", location: "Ruaka, Nairobi",          intent: "Friendship",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530012.jpg" },
  { id: 28, name: "Ella",      age: 25, gender: "women", location: "Kiambu",                  intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530018.jpg" },
  { id: 29, name: "Alice",     age: 23, gender: "women", location: "Machakos",                intent: "Companionship",          services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530019.jpg" },
  { id: 30, name: "Lisa",      age: 24, gender: "women", location: "Ruaka, Nairobi",          intent: "Long-term relationship", services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530020.jpg" },
  { id: 31, name: "Empress",   age: 24, gender: "women", location: "Narok",                   intent: "Friendship",             services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530021.jpg" },
  { id: 32, name: "Suzzy",     age: 31, gender: "women", location: "Nyeri",                   intent: "Friendship",             services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530022.jpg" },
  { id: 33, name: "Shania",    age: 23, gender: "women", location: "Ruaka, Nairobi",          intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530023.jpg" },
  { id: 34, name: "Lucy",      age: 24, gender: "women", location: "Machakos",                intent: "Someone to talk to",     services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530024.jpg" },
  { id: 35, name: "Chebet",    age: 26, gender: "women", location: "Kitengela, Nairobi",      intent: "Long-term relationship", services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530025.jpg" },
  { id: 36, name: "Nato",      age: 28, gender: "women", location: "Mombasa",                 intent: "Someone to talk to",     services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530026.jpg" },
  { id: 37, name: "Jackline",  age: 23, gender: "women", location: "Nakuru",                  intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530027.jpg" },
  { id: 38, name: "Amina",     age: 25, gender: "women", location: "Langata, Nairobi",        intent: "Friendship",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530028.jpg" },
  { id: 39, name: "Wairimu",   age: 27, gender: "women", location: "Westlands, Nairobi",      intent: "Dating",                 services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530029.jpg" },
  { id: 40, name: "Njeri",     age: 24, gender: "women", location: "Parklands, Nairobi",      intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530030.jpg" },
  { id: 41, name: "Wambui",    age: 29, gender: "women", location: "Embakasi, Nairobi",       intent: "Long-term relationship", services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530031.jpg" },
  { id: 42, name: "Akinyi",    age: 23, gender: "women", location: "Kisumu",                  intent: "Friendship",             services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530033.jpg" },
  { id: 43, name: "Zawadi",    age: 26, gender: "women", location: "Mombasa",                 intent: "Dating",                 services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530034.jpg" },
  { id: 44, name: "Nafisa",    age: 22, gender: "women", location: "Eldoret",                 intent: "Networking",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530035.jpg" },
  { id: 45, name: "Zuwena",    age: 28, gender: "women", location: "Malindi",                 intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530036.jpg" },
  { id: 46, name: "Linet",     age: 24, gender: "women", location: "Thika",                   intent: "Friendship",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530037.jpg" },
  { id: 47, name: "Purity",    age: 21, gender: "women", location: "Githurai, Nairobi",       intent: "Someone to talk to",     services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530038.jpg" },
  { id: 48, name: "Immaculate",age: 30, gender: "women", location: "Nakuru",                  intent: "Long-term relationship", services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530039.jpg" },
  { id: 49, name: "Beatrice",  age: 25, gender: "women", location: "Buru Buru, Nairobi",      intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530040.jpg" },
  { id: 50, name: "Vivian",    age: 23, gender: "women", location: "Kileleshwa, Nairobi",     intent: "Genuine connection",     services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530041.jpg" },
  { id: 51, name: "Christine", age: 27, gender: "women", location: "Nyeri",                   intent: "Companionship",          services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530043.jpg" },
  { id: 52, name: "Pauline",   age: 26, gender: "women", location: "Kisumu",                  intent: "Friendship",             services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530044.jpg" },
  { id: 53, name: "Sylvia",    age: 24, gender: "women", location: "Lavington, Nairobi",      intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530045.jpg" },
  { id: 54, name: "Mercy",     age: 25, gender: "women", location: "Eldoret",                 intent: "Someone to talk to",     services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530046.jpg" },
  { id: 55, name: "Grace",     age: 22, gender: "women", location: "Kilifi",                  intent: "Networking",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530047.jpg" },
  { id: 56, name: "Anne",      age: 29, gender: "women", location: "Upper Hill, Nairobi",     intent: "Long-term relationship", services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530048.jpg" },
  { id: 57, name: "Rosa",      age: 24, gender: "women", location: "Nanyuki",                 intent: "Friendship",             services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530049.jpg" },
  { id: 58, name: "Diana",     age: 26, gender: "women", location: "Juja",                    intent: "Companionship",          services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530050.jpg" },
  { id: 59, name: "Pamela",    age: 23, gender: "women", location: "Embu",                    intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530051.jpg" },
  { id: 60, name: "Stella",    age: 27, gender: "women", location: "Westlands, Nairobi",      intent: "Genuine connection",     services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530052.jpg" },
  { id: 61, name: "Agnes",     age: 25, gender: "women", location: "Thika",                   intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530053.jpg" },
  { id: 62, name: "Brenda",    age: 22, gender: "women", location: "Langata, Nairobi",        intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001345493784530054.jpg" },
  { id: 63, name: "Janet",     age: 28, gender: "women", location: "Mombasa",                 intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001422854735465451.jpg" },
  { id: 64, name: "Carol",     age: 24, gender: "women", location: "Kiambu",                  intent: "Long-term relationship", services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/6001422854735465452.jpg" },
  { id: 65, name: "Shiro",     age: 24, gender: "women", location: "South B, Nairobi",        intent: "Dating",                 services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5789546139429309860.jpg" },
  { id: 66, name: "Wanjiku",   age: 27, gender: "women", location: "Karen, Nairobi",          intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5789676560406220434.jpg" },
  { id: 67, name: "Nekesa",    age: 23, gender: "women", location: "Kisumu",                  intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5789676560406220435.jpg" },
  { id: 68, name: "Adhiambo",  age: 25, gender: "women", location: "Kisumu",                  intent: "Long-term relationship", services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5789693899189194192.jpg" },
  { id: 69, name: "Atieno",    age: 26, gender: "women", location: "Homa Bay",                intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5789848341918190950.jpg" },
  { id: 70, name: "Salome",    age: 29, gender: "women", location: "Naivasha",                intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5789848341918190974.jpg" },
  { id: 71, name: "Kendi",     age: 22, gender: "women", location: "Meru",                    intent: "Networking",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905653.jpg" },
  { id: 72, name: "Mumbua",    age: 24, gender: "women", location: "Machakos",                intent: "Companionship",          services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905655.jpg" },
  { id: 73, name: "Muthoni",   age: 28, gender: "women", location: "Ngong Road, Nairobi",     intent: "Friendship",             services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905656.jpg" },
  { id: 74, name: "Wanjiru",   age: 23, gender: "women", location: "Roysambu, Nairobi",       intent: "Long-term relationship", services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905657.jpg" },
  { id: 75, name: "Makena",    age: 26, gender: "women", location: "Nanyuki",                 intent: "Dating",                 services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905658.jpg" },
  { id: 76, name: "Nduta",     age: 25, gender: "women", location: "Kiambu Road, Nairobi",     intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905659.jpg" },
  { id: 77, name: "Ciku",      age: 22, gender: "women", location: "Ruiru",                   intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905660.jpg" },
  { id: 78, name: "Wahu",      age: 30, gender: "women", location: "Westlands, Nairobi",      intent: "Genuine connection",     services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905661.jpg" },
  { id: 79, name: "Soila",     age: 24, gender: "women", location: "Kajiado",                 intent: "Dating",                 services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905662.jpg" },
  { id: 80, name: "Naomi",     age: 27, gender: "women", location: "Dagoretti, Nairobi",      intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905663.jpg" },
  { id: 81, name: "Deborah",   age: 23, gender: "women", location: "Mombasa",                 intent: "Long-term relationship", services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905664.jpg" },
  { id: 82, name: "Veronica",  age: 25, gender: "women", location: "Nakuru",                  intent: "Companionship",          services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905665.jpg" },
  { id: 83, name: "Fiona",     age: 28, gender: "women", location: "Eldoret",                 intent: "Friendship",             services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905666.jpg" },
  { id: 84, name: "Sandra",    age: 24, gender: "women", location: "Mathare, Nairobi",        intent: "Networking",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905667.jpg" },
  { id: 85, name: "Priscilla", age: 26, gender: "women", location: "Thika",                   intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905668.jpg" },
  { id: 86, name: "Josephine", age: 29, gender: "women", location: "Kisii",                   intent: "Genuine connection",     services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905669.jpg" },
  { id: 87, name: "Monica",    age: 23, gender: "women", location: "South C, Nairobi",        intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905670.jpg" },
  { id: 88, name: "Florence",  age: 27, gender: "women", location: "Kakamega",                intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905671.jpg" },
  { id: 89, name: "Ruth",      age: 24, gender: "women", location: "Embakasi, Nairobi",       intent: "Long-term relationship", services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905672.jpg" },
  { id: 90, name: "Elizabeth", age: 31, gender: "women", location: "Meru",                    intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905673.jpg" },
  { id: 91, name: "Catherine", age: 25, gender: "women", location: "Pangani, Nairobi",        intent: "Friendship",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905674.jpg" },
  { id: 92, name: "Margaret",  age: 28, gender: "women", location: "Nyeri",                   intent: "Companionship",          services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905675.jpg" },
  { id: 93, name: "Tina",      age: 22, gender: "women", location: "Mlolongo, Nairobi",       intent: "Genuine connection",     services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905676.jpg" },
  { id: 94, name: "Rita",      age: 26, gender: "women", location: "Kilifi",                  intent: "Friendship",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905678.jpg" },
  { id: 95, name: "Sharon",    age: 24, gender: "women", location: "Umoja, Nairobi",          intent: "Dating",                 services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905679.jpg" },
  { id: 96, name: "Mary",      age: 29, gender: "women", location: "Bungoma",                 intent: "Networking",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905680.jpg" },
  { id: 97, name: "Lydia",     age: 23, gender: "women", location: "Langata, Nairobi",        intent: "Long-term relationship", services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905681.jpg" },
  { id: 98, name: "Judith",    age: 27, gender: "women", location: "Kericho",                 intent: "Companionship",          services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905684.jpg" },
  { id: 99, name: "Teresa",    age: 25, gender: "women", location: "Kitale",                  intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905685.jpg" },
  { id: 100,name: "Isabella",  age: 24, gender: "women", location: "Westlands, Nairobi",      intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905686.jpg" },
  { id: 101,name: "Fatuma",    age: 26, gender: "women", location: "Mombasa",                 intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905687.jpg" },
  { id: 102,name: "Halima",    age: 23, gender: "women", location: "Malindi",                 intent: "Friendship",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905688.jpg" },
  { id: 103,name: "Mariam",    age: 28, gender: "women", location: "Mombasa",                 intent: "Genuine connection",     services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905689.jpg" },
  { id: 104,name: "Zainab",    age: 24, gender: "women", location: "Lamu",                    intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905690.jpg" },
  { id: 105,name: "Habiba",    age: 27, gender: "women", location: "Mombasa",                 intent: "Friendship",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905691.jpg" },
  { id: 106,name: "Yasmin",    age: 22, gender: "women", location: "Kisumu",                  intent: "Long-term relationship", services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905692.jpg" },
  { id: 107,name: "Imani",     age: 25, gender: "women", location: "Nairobi CBD",             intent: "Companionship",          services: ["💬 Chat","📹 Video Call","🤝 Meet Up","🌙 Overnight"],       image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905693.jpg" },
  { id: 108,name: "Baraka",    age: 26, gender: "women", location: "Eldoret",                 intent: "Networking",             services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905694.jpg" },
  { id: 109,name: "Zawira",    age: 24, gender: "women", location: "Mombasa",                 intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905695.jpg" },
  { id: 110,name: "Rabia",     age: 28, gender: "women", location: "Nairobi",                 intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up"],                                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905696.jpg" },
  { id: 111,name: "Diana B",   age: 25, gender: "women", location: "Gigiri, Nairobi",         intent: "Genuine connection",     services: ["💬 Chat","📹 Video Call","🌙 Overnight"],                   image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905697.jpg" },
  { id: 112,name: "Tiffany",   age: 23, gender: "women", location: "Ruaka, Nairobi",          intent: "Dating",                 services: ["💬 Chat","📹 Video Call","🤝 Meet Up"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905698.jpg" },
  { id: 113,name: "Sophia",    age: 27, gender: "women", location: "Upper Hill, Nairobi",     intent: "Companionship",          services: ["💬 Chat","📹 Video Call"],                                  image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905699.jpg" },
  { id: 114,name: "Olivia",    age: 24, gender: "women", location: "Kileleshwa, Nairobi",     intent: "Friendship",             services: ["💬 Chat","🤝 Meet Up","🌙 Overnight"],                     image: "https://pub-8fc588d8a1844be9b0926af13933401a.r2.dev/5791928360219905700.jpg" }
];

/* ═══════════════════════════════════════
   Auto-seed on startup
   ═══════════════════════════════════════ */
(async function autoSeed() {
  try {
    const count = await Profile.countDocuments();
    if (count === 0) {
      await Profile.insertMany(DEFAULT_PROFILES);
      console.log('🌱 Seeded', DEFAULT_PROFILES.length, 'profiles');
    } else {
      console.log('📦', count, 'profiles already in DB');
    }
  } catch (e) {
    console.error('Seed error:', e.message);
  }
})();

/* ═══════════════════════════════════════
   API: Profiles
   ═══════════════════════════════════════ */
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find({ isActive: true }).lean();
    res.json(profiles);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ id: Number(req.params.id), isActive: true }).lean();
    if (!profile) return res.status(404).json({ error: 'Not found' });
    res.json(profile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════
   Helpers
   ═══════════════════════════════════════ */
function normalizePhone(phone) {
  let p = String(phone || '').replace(/\s/g, '').replace(/\+/g, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

function isValidSafaricom(phone) {
  return /^2547\d{8}$/.test(phone) || /^2541\d{8}$/.test(phone);
}

/* ═══════════════════════════════════════
   API: Initiate Payment (Megapay STK)
   ═══════════════════════════════════════ */
app.post('/api/initiate-payment', async (req, res) => {
  try {
    const { action, phoneNumber, amountKes, profileName, paymentType, reference, transactionRequestId } = req.body;
    console.log('💰 Payment request:', { action, phoneNumber, amountKes, paymentType, reference });

    /* ── STATUS CHECK ── */
    if (action === 'status') {
      const tx = await Transaction.findOne({
        $or: [
          { providerRequestId: transactionRequestId },
          { reference: transactionRequestId }
        ]
      }).sort({ createdAt: -1 });

      if (!tx) {
        console.log('Status check: not found for', transactionRequestId);
        return res.json({ status: 'pending' });
      }
      console.log('Status check:', tx.reference, '→', tx.status);
      return res.json({ status: tx.status, reference: tx.reference, providerRequestId: tx.providerRequestId });
    }

    /* ── INITIATE STK PUSH ── */
    if (!phoneNumber || !amountKes) {
      return res.status(400).json({ status: 'failed', message: 'phoneNumber and amountKes required' });
    }

    const phone = normalizePhone(phoneNumber);
    if (!isValidSafaricom(phone)) {
      return res.status(400).json({ status: 'failed', message: 'Invalid Safaricom number. Use 07XX, 01XX, or 2547XX format.' });
    }

    const amount = Number(amountKes);
    if (!Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ status: 'failed', message: 'Invalid amount' });
    }

    const ref = reference || `${paymentType || 'pay'}-${Date.now()}`;

    const baseUrl = process.env.MEGAPAY_BASE_URL || 'https://megapay.co.ke';
    const apiKey  = process.env.MEGAPAY_API_KEY;
    const email   = process.env.MEGAPAY_EMAIL;

    if (!apiKey || !email) {
      console.log('⚠️ Megapay not configured — mock mode');
      const mockId = 'MOCK-' + Date.now();
      await Transaction.create({
        phoneNumber: phone, amountKes: amount, profileName, paymentType,
        reference: ref, providerRequestId: mockId, status: 'pending'
      });
      return res.json({ status: 'queued', providerRequestId: mockId, mock: true });
    }

    /* Megapay official API: POST https://megapay.co.ke/backend/v1/initiatestk
       Fields: api_key, email, amount, msisdn, reference */
    const payload = {
      api_key: apiKey,
      email: email,
      amount: String(amount),
      msisdn: phone,
      reference: ref
    };

    console.log('🔄 Megapay STK payload:', JSON.stringify(payload, null, 2));

    const mpRes = await axios.post(`${baseUrl}/backend/v1/initiatestk`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 25000,
      validateStatus: () => true
    });

    console.log('📥 Megapay response:', mpRes.status, JSON.stringify(mpRes.data).slice(0, 400));

    if (mpRes.status >= 200 && mpRes.status < 300 && mpRes.data) {
      const data = mpRes.data;
      // Megapay returns: { success: "200", massage: "...", transaction_request_id: "..." }
      const reqId = data.transaction_request_id || data.providerRequestId || data.requestId || data.transactionId || ref;

      await Transaction.create({
        phoneNumber: phone,
        amountKes: amount,
        profileName: profileName || '',
        paymentType: paymentType || 'general',
        reference: ref,
        providerRequestId: reqId,
        status: 'pending',
        megapayResponse: data
      });

      return res.json({
        status: 'queued',
        providerRequestId: reqId,
        reference: ref,
        message: data.massage || data.message || 'STK push sent. Check your phone and enter M-Pesa PIN.'
      });
    }

    return res.status(502).json({
      status: 'failed',
      message: mpRes.data?.massage || mpRes.data?.message || `Megapay returned ${mpRes.status}`
    });

  } catch (error) {
    console.error('❌ Payment crash:', error?.response?.data || error.message);
    res.status(500).json({
      status: 'failed',
      message: error?.message || 'Server error during payment.'
    });
  }
});

/* ═══════════════════════════════════════
   API: Megapay Webhook
   ═══════════════════════════════════════ */
app.post('/api/webhook/megapay', async (req, res) => {
  try {
    const body = req.body;
    console.log('🔔 Webhook received:', JSON.stringify(body).slice(0, 600));

    const token = req.headers['x-callback-token'] || req.query.token || body.callback_token;
    if (process.env.MEGAPAY_CALLBACK_TOKEN && token !== process.env.MEGAPAY_CALLBACK_TOKEN) {
      console.warn('⚠️ Webhook token mismatch');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Megapay webhook payload:
    // { ResponseCode, ResponseDescription, MerchantRequestID, CheckoutRequestID,
    //   TransactionID, TransactionAmount, TransactionReceipt, TransactionDate,
    //   TransactionReference, Msisdn }
    const lookupRef = body.TransactionReference || body.transactionReference || body.reference || body.CheckoutRequestID || body.MerchantRequestID;
    const resultCode = body.ResponseCode ?? body.responseCode ?? body.resultCode ?? body.status;
    const isSuccess = String(resultCode) === '0' || String(resultCode) === '200' || String(body.status).toLowerCase() === 'success';
    const newStatus = isSuccess ? 'confirmed' : 'failed';

    const tx = await Transaction.findOneAndUpdate(
      {
        $or: [
          { reference: lookupRef },
          { providerRequestId: body.CheckoutRequestID },
          { providerRequestId: body.MerchantRequestID },
          { providerRequestId: body.TransactionID }
        ]
      },
      { status: newStatus, megapayResponse: body },
      { new: true, sort: { createdAt: -1 } }
    );

    if (tx) {
      console.log('✅ Transaction updated:', tx.reference, '→', newStatus);
    } else {
      console.warn('⚠️ Webhook: no transaction found for ref', lookupRef);
    }

    res.json({ received: true, updated: !!tx, status: newStatus });
  } catch (e) {
    console.error('❌ Webhook crash:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════
   API: AI Chat (fallback)
   ═══════════════════════════════════════ */
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { profileName, profileLocation, profileIntent, messages } = req.body;

    if (process.env.CEREBRAS_API_KEY) {
      try {
        const cerebrasRes = await axios.post('https://api.cerebras.ai/v1/chat/completions', {
          model: process.env.CEREBRAS_MODEL || 'llama3.1-8b',
          messages: [
            { role: 'system', content: `You are ${profileName} from ${profileLocation}. You are here for ${profileIntent}. Reply briefly, flirtatiously, in English. Max 2 sentences.` },
            ...(messages || [])
          ],
          max_tokens: 120,
          temperature: 0.8
        }, {
          headers: { Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: 10000
        });
        const reply = cerebrasRes.data?.choices?.[0]?.message?.content;
        if (reply) return res.json({ reply });
      } catch (aiErr) {
        console.log('Cerebras failed:', aiErr.message);
      }
    }

    const fallbacks = [
      `Hey babe, it's ${profileName}. What's on your mind? 😊`,
      `I'm around ${profileLocation} right now. Tell me more about you.`,
      `That sounds interesting... 💕`,
      `I'd love to chat more. Are you going to unlock my contact?`,
      `Hmm, tell me something I don't know.`,
      `Hey there! Looking for ${(profileIntent || 'fun').toLowerCase()}? Me too.`,
      `😘 I'm online now. What are you looking for today?`
    ];
    res.json({ reply: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════
   API: Stats & Health
   ═══════════════════════════════════════ */
app.get('/api/stats', async (req, res) => {
  try {
    const [profiles, total, confirmed] = await Promise.all([
      Profile.countDocuments({ isActive: true }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'confirmed' })
    ]);
    res.json({ profiles, transactions: total, confirmedTransactions: confirmed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), megapayConfigured: !!process.env.MEGAPAY_API_KEY });
});

/* ═══════════════════════════════════════
   Static Frontend + SPA Fallback
   CRITICAL FIX: use path.join(__dirname, ...)
   NOT path.resolve() which uses cwd
   ═══════════════════════════════════════ */
const FRONTEND_PATH = path.join(__dirname, process.env.FRONTEND_PATH || '../frontend');
console.log('📁 Frontend path resolved to:', FRONTEND_PATH);
app.use(express.static(FRONTEND_PATH));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found' });
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

/* ═══════════════════════════════════════
   Start
   ═══════════════════════════════════════ */
const PORT = process.env.PORT || 3028;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AceGirls API running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving frontend from: ${FRONTEND_PATH}`);
  console.log(`💳 Megapay configured: ${!!process.env.MEGAPAY_API_KEY}`);
});