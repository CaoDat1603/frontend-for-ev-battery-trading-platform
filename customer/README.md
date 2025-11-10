# ⚛️ React + TypeScript + Vite

This project uses **React**, **TypeScript**, and **Vite** to build a fast and modern web application.  
It includes basic ESLint rules and supports Hot Module Replacement (HMR) for an optimized development experience.

---

## 🚀 Getting Started

### 1. Install Required Libraries

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install react-router-dom
npm install --save-dev @types/react @types/
npm install html2canvas jspdf
react-dom @types/node
```

### 2. Run the Project
```bash
npm run dev
```

## 🧩 Project Structure
```bash
src/
├── assets/              # 0. Contains images and static files
├── components/          # 1. Reusable UI components (Header, Footer, Custom Buttons)
├── pages/               # 2. Main application pages (Homepage, Dashboard, Profile, etc.)
├── theme/               # 3. Custom MUI theme definitions
├── hooks/               # 4. Custom React hooks (useFetch, useAuth, etc.)
├── utils/               # 5. Helper and utility functions (date formatting, validation, etc.)
├── services/            # 6. API service functions for backend communication
├── App.tsx              # Root component
└── main.tsx             # Application entry point
```

## 🎨 UI Framework
This project uses Material UI (MUI) for a clean and responsive design system.

All theme customizations are located inside the src/theme/ directory.

## 🧠 Notes
- Includes TypeScript type definitions for React, React DOM, and Node.
- ESLint and Vite provide a fast, type-safe developer experience.
- The folder naming follows best practices for React + Vite projects.

## 🪄 Summary
✅ Vite for blazing-fast development

✅ React + TypeScript for scalable architecture

✅ MUI for modern, responsive UI

✅ Ready-to-extend foundation for your Admin Dashboard
