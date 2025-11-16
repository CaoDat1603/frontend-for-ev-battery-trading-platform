import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import {AdminProvider} from './context/AdminContext.tsx'

import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme.ts'; 
import { BrowserRouter } from 'react-router-dom';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> 
        <ThemeProvider theme={theme}>
            <CssBaseline /> 
            <AdminProvider>
              <App />
            </AdminProvider>
            
        </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);