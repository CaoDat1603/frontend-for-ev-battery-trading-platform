import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LayoutMain from './layouts/LayoutMain';
import LayoutAuth from './layouts/LayoutAuth';
import { HomePage } from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { EcycleCategoryPage } from './pages/EcycleCategoryPage';
import { LoginPage } from './pages/Auth';
import { RegisterPage } from './pages/Auth';
import { VerifyOtpPage } from './pages/Auth';
import { ResetPasswordEmailPage } from './pages/Auth';
import { ResetPasswordPhonePage } from './pages/Auth';
import { ForgotPasswordPage } from './pages/Auth';

const PlaceholderPage = ({ title }: { title: string }) => (
    <div style={{ padding: 50, textAlign: 'center' }}>
        <h1 style={{ color: '#1976d2' }}>{title}</h1>
        <p>Đây là trang danh mục sản phẩm. Nội dung sẽ được cập nhật sau.</p>
    </div>
);

const App: React.FC = () => (
    <BrowserRouter>
        <Routes>
            {/* Trang Login sử dụng LayoutLogin */}
            <Route
                path="/login"
                element={
                    <LayoutAuth>
                        <LoginPage />
                    </LayoutAuth>
                }
            />

            <Route
                path="/register"
                element={
                    <LayoutAuth>
                        <RegisterPage />
                    </LayoutAuth>
                }
            />
            <Route
                path="/verify-Otp"
                element={
                    <LayoutAuth>
                        <VerifyOtpPage />
                    </LayoutAuth>
                }
            />
            <Route
                path="/identity/reset-password"
                element={
                    <LayoutAuth>
                        <ResetPasswordEmailPage />
                    </LayoutAuth>
                }
            />
            <Route
                path="/reset-password-phone"
                element={
                    <LayoutAuth>
                        <ResetPasswordPhonePage />
                    </LayoutAuth>
                }
            />
            <Route
                path="/forgot-password"
                element={
                    <LayoutAuth>
                        <ForgotPasswordPage />
                    </LayoutAuth>
                }
            />



            {/* Các trang còn lại sử dụng LayoutMain */}
            <Route
                path="/"
                element={
                    <LayoutMain>
                        <HomePage />
                    </LayoutMain>
                }
            />
            <Route
                path="/account/profile"
                element={
                    <LayoutMain>
                        <ProfilePage />
                    </LayoutMain>
                }
            />
            <Route
                path="/o-to-dien"
                element={
                    <LayoutMain>
                        <EcycleCategoryPage />
                    </LayoutMain>
                }
            />
            <Route
                path="/xe-may-dien"
                element={
                    <LayoutMain>
                        <PlaceholderPage title="Xe Máy Điện" />
                    </LayoutMain>
                }
            />
            <Route
                path="/pin-xe-dien"
                element={
                    <LayoutMain>
                        <PlaceholderPage title="Pin Xe Điện" />
                    </LayoutMain>
                }
            />
        </Routes>
    </BrowserRouter>
);

export default App;
