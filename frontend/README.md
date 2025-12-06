# Nexus MVP Frontend

React + Vite + Tailwind CSS frontend for Nexus.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Backend running on port 8000

### Installation

```bash
cd frontend
npm install
```

### Running Development Server

```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

## 🛠 Features
- **Chat Interface**: Real-time chat with Nexus AI.
- **Task Management**: View and manage tasks created by the AI.
- **Modern UI**: Dark mode, responsive design using Tailwind CSS.

## 🔧 Configuration
- **Vite Proxy**: Configured in `vite.config.js` to proxy `/api` requests to `http://localhost:8000`.
- **Tailwind**: Configured in `tailwind.config.js` and `postcss.config.js`.
