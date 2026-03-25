# MyKost Frontend

Aplikasi manajemen kost modern dengan React dan Vite.

## 🚀 Features

- ✅ Authentication & Authorization
- ✅ Dashboard dengan statistik real-time
- ✅ Manajemen Kamar (CRUD)
- ✅ Manajemen Penyewa (CRUD)
- ✅ Responsive Design
- ✅ Loading States & Error Handling
- ✅ Production Ready

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Custom CSS (Tailwind-like)
- **HTTP Client**: Axios
- **Environment**: Vite Environment Variables

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd mykost/frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start development server
npm run dev
```

## 🔧 Environment Variables

Create `.env` file in root directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable components
│   └── ProtectedRoute.jsx
├── hooks/              # Custom hooks
│   └── useAuth.js
├── pages/              # Page components
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── Kamar.jsx
│   ├── Penyewa.jsx
│   └── Home.jsx
├── services/           # API services
│   ├── authService.js
│   ├── kamarService.js
│   └── penyewaService.js
├── utils/              # Utilities
│   └── api.js
├── App.jsx            # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## 🚀 Build & Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Deploy to Netlify
```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
```

## 🔐 Authentication

- Default credentials:
  - Email: `admin@example.com`
  - Password: `password`

## 📱 API Integration

Frontend terhubung dengan backend Laravel API:

- **Base URL**: `http://localhost:8000/api`
- **Authentication**: JWT Token
- **Endpoints**:
  - `GET /kamars` - List kamar
  - `POST /kamars` - Create kamar
  - `PUT /kamars/{id}` - Update kamar
  - `DELETE /kamars/{id}` - Delete kamar
  - `GET /penyewas` - List penyewa
  - `POST /penyewas` - Create penyewa
  - `PUT /penyewas/{id}` - Update penyewa
  - `DELETE /penyewas/{id}` - Delete penyewa

## 🎨 Design System

### Color Palette
- Primary: `#2563eb` (Blue 600)
- Success: `#16a34a` (Green 600)
- Warning: `#eab308` (Yellow 500)
- Danger: `#ef4444` (Red 500)

### Components
- Cards with shadow effects
- Responsive grid layouts
- Interactive buttons with hover states
- Loading spinners
- Error alerts

## 🔄 Development Workflow

1. **Start Backend**: Laravel API server
2. **Start Frontend**: `npm run dev`
3. **Configure Environment**: Update `.env` file
4. **Test Features**: Login, CRUD operations, navigation

## 📝 Notes

- Project siap untuk production
- Responsive design untuk mobile & desktop
- Error handling dan loading states
- Clean architecture dengan separation of concerns
- Environment variables untuk konfigurasi API

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License
