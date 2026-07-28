# Signage Control Panel

Full-stack aplikasi manajemen layar digital signage dengan admin dashboard dan simulasi device client, real-time via WebSocket.

---

## 📁 Struktur Proyek

```
repo/
├── backend/          # Node.js + Express.js + WebSocket
│   └── src/
│       ├── index.js          # Entry point server
│       ├── db.js             # Koneksi Supabase
│       ├── websocket.js      # WebSocket server
│       ├── logActivity.js    # Logger aktivitas
│       └── routes/
│           ├── auth.js       # Login/Register JWT
│           ├── devices.js    # CRUD devices
│           ├── contents.js   # CRUD contents
│           ├── playlists.js  # CRUD playlists + push
│           └── upload.js     # Upload gambar ke Storage
├── frontend/         # React.js + Vite
│   └── src/
│       ├── App.tsx           # Router + Auth gate
│       ├── api.ts            # HTTP client
│       ├── components/
│       │   ├── Sidebar.tsx   # Sidebar navigasi
│       │   └── Modal.tsx     # Modal reusable
│       ├── pages/
│       │   ├── Login.tsx     # Login/Register
│       │   ├── Overview.tsx  # Dashboard statistik
│       │   ├── DevicesPage.tsx  # Manajemen devices
│       │   ├── ContentsPage.tsx # Manajemen konten
│       │   ├── PlaylistPage.tsx # Playlist device
│       │   └── DeviceClient.tsx # Tampilan signage
│       └── assets/css/       # Semua CSS terpisah
└── supabase/
    └── migration.sql   # DDL tabel
```

---

## 🏗️ Arsitektur

```
┌─────────────┐     REST API      ┌──────────┐     SQL      ┌──────────┐
│  Dashboard  │ ────────────────→ │ Backend  │ ──────────→ │ Supabase │
│  (React)    │ ←──────────────── │ Express  │ ←────────── │ Postgres │
│  :5173      │    JSON/HTTP      │ :3001    │             │          │
└──────┬──────┘                   └────┬─────┘             └──────────┘
       │                               │
       │     WebSocket (real-time)     │
       └───────────────────────────────┘
                ↕ broadcast
┌──────────────────────────┐
│   Device Client (React)  │
│   Menampilkan konten     │
│   signage di layar       │
└──────────────────────────┘
```

### Alur Data:
1. **Admin** mengelola device, konten, playlist via Dashboard (REST API)
2. **Device** signage terhubung via WebSocket, menerima konten secara real-time
3. Setiap perubahan status device (online/offline) di-broadcast ke semua client
4. Push konten dikirim langsung ke device tertentu via WebSocket

---

## ✨ Fitur

### Admin Dashboard
| Fitur | Detail |
|-------|--------|
| **Overview** | Statistik total device, online/offline, total konten, grafik bulanan |
| **Devices** | CRUD device, search, pagination, export Excel, copy URL |
| **Contents** | CRUD konten (URL, Teks, Gambar), upload file ke Supabase Storage |
| **Playlist** | Atur konten per device, push otomatis, push ulang |
| **Auth JWT** | Register/Login dengan cookie HTTP-only |

### Device Client
| Fitur | Detail |
|-------|--------|
| **WebSocket** | Koneksi real-time dengan exponential backoff reconnection |
| **Tampilan** | Fullscreen, dukung URL (iframe), Teks, Gambar |
| **Auto-content** | Menerima konten terbaru otomatis saat connect |

### Real-time WebSocket Events
| Event | Arah |
|-------|------|
| `device_online/offline` | Device → Broadcast |
| `push_content` | Admin → Device tertentu |
| `content_pushed` | Admin → Broadcast |
| `device_added/updated/deleted` | Admin → Broadcast |
| `content_added/updated/deleted` | Admin → Broadcast |

---

## 🚀 Cara Menjalankan

### 1. Clone & Setup
```bash
git clone https://github.com/dhiyafasya/Workflow_Challenge_MJSolution-Indonesia.git
cd repo
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Isi .env dengan credentials Supabase
npm install
npm run dev
# Server berjalan di http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Dashboard di http://localhost:5173
```

### 4. Supabase Migration
Jalankan SQL di `supabase/migration.sql` via Supabase SQL Editor +:
```sql
ALTER TABLE contents ADD COLUMN IF NOT EXISTS filename text;
```

### 5. Supabase Storage
Buat bucket `content-images` (Public) di Supabase Storage.

---

## 🔑 Credentials

- **Admin Login**: `admin@gmail.com` / `Admin123#`
- **JWT Secret**: `mj_signage_2026_workflow_challenge`

---

## 🛠️ Teknologi

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19, Vite, TypeScript, lucide-react |
| **Backend** | Node.js, Express.js, ws (WebSocket) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | JWT, bcryptjs, cookie-parser |
| **Storage** | Supabase Storage (multer) |
| **UI** | CSS murni (tanpa library UI) |

---

## 📦 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | - | Register admin |
| POST | `/api/auth/login` | - | Login, set cookie JWT |
| GET | `/api/auth/me` | Cookie | Cek session |
| POST | `/api/auth/logout` | Cookie | Logout |
| GET/POST/PUT/DELETE | `/api/devices` | Cookie | CRUD devices |
| GET/POST/PUT/DELETE | `/api/contents` | Cookie | CRUD konten |
| GET/POST/DELETE | `/api/playlists` | Cookie | CRUD playlist |
| POST | `/api/playlists/push/:deviceId` | Cookie | Push konten ke device |
| POST | `/api/upload` | Cookie | Upload gambar ke Storage |
| GET | `/api/health` | - | Health check |

---

## ⚡ WebSocket

- **URL**: `ws://localhost:3001?deviceId=<uuid>`
- **Device client** terhubung dengan deviceId untuk menerima konten
- **Dashboard** terhubung tanpa deviceId untuk menerima broadcast status
- Reconnection: exponential backoff (1s → 2s → 4s → ... → 30s max)

---

## 📝 Log Aktivitas

Semua aktivitas CRUD dan auth tercatat di **console terminal backend**:
```
[18.49.41] admin@gmail.com → login user[105f4434]
[18.49.41] admin@gmail.com → push playlist[9bb9eb03] {"content_id":"..."}
[18.50.00] admin@gmail.com → create device[abc123] {"nama":"TV Lobby"}
```
