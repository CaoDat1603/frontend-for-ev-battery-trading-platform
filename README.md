# ⚛️ React + TypeScript + Vite

This repository contains two separate frontend applications:
- Admin Panel – management interface for system administrators
- Customer App – end-user application built using React + TypeScript + Vite + MUI
---

## 📁 Project Structure (Monorepo)
```bash
root/
├── admin/             # Admin Frontend
├── customer/          # Customer Frontend
└── README.md          # Root README (this file)
```

## ⚡ Tech Stack Overview
This project uses Material UI (MUI) for a clean and responsive design system.
| Technology                    | Admin    | Customer |
| ----------------------------- | -------- | -------- |
| React + TypeScript            | ✔️       | ✔️      |
| Vite                          | ✔️       | ✔️      |
| Material UI                   | Optional | ✔️       |
| react-router-dom              | ✔️       | ✔️      |
| Axios                         | ✔️       | ✔️      |
| Notistack                     | Optional | ✔️       |
| State Manager (Redux/Zustand) | ✔️       | ✔️       |

## 🚀 Getting Started
```bash
git clone <repository-url>
cd root
```

## 🎨 Customer Frontend (Sub-module Overview)
The Customer module uses:
- React + TypeScript + Vite
- Material UI (MUI) for modern UI styling
- Notistack for snackbars/notifications
- Axios for HTTP requests
- React Router for navigation
Install required libraries:
```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install react-router-dom
npm install --save-dev @types/react @types/react-dom @types/node
npm install notistack
npm install axios
```
Run the project:
```bash
npm run dev
```

## 🧠 Notes
- Both applications use TypeScript for type safety
- Vite provides blazing-fast HMR and build performance
- Consistent conventions across modules ensure scalability
- Easy to extend with additional modules (e.g., Seller, Partner...)

## 🪄 Summary
✔️ Monorepo containing Admin + Customer
✔️ Shared React + TypeScript + Vite architecture
✔️ Customer uses MUI + Notistack + Axios
✔️ Clean, scalable, maintainable folder structure
✔️ Ready for production and future expansions
