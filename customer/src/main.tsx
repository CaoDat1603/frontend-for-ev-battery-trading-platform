import React from 'react';
import ReactDOM from 'react-dom/client';
// Sửa lỗi: Thay đổi từ named import sang default import
import App from './App.tsx'; 
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material'; 
import { UserProvider } from "./context/UserContext";
import { customTheme } from './theme/customTheme'; // Giả định file này tồn tại

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <UserProvider>
      <App />
    </UserProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
