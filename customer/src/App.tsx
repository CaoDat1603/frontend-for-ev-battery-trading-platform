// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LayoutMain from './layouts/LayoutMain';
import LayoutAuth from './layouts/LayoutAuth';
import { HomePage } from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { ElectricCarBatteryPage } from './pages/ElectricCarBatteryPage';
import { ElectricScooterBatteryPage } from './pages/ElectricScooterBatteryPage';
import { ElectricBatteryPage } from './pages/ElectricBatteryPage';
import { SearchPostPage } from './pages/SearchPostPage'; 
import { LoginPage } from './pages/Auth';

import ProductManagementPage from './pages/ProductManagementPage';
import PostDetailPageManager from './pages/PostDetailPageManager';
// ... import các Pages Auth khác ...
import { RegisterPage } from './pages/Auth';
import { VerifyOtpPage } from './pages/Auth';
import { ResetPasswordEmailPage } from './pages/Auth';
import { ResetPasswordPhonePage } from './pages/Auth';
import { ForgotPasswordPage } from './pages/Auth';
import ViewUserPage from "./pages/ViewUserPage";

import ProductDetailPage from './pages/ProductDetailPage';
import ScrollToTop from './components/ScrollToTop';
import CreatePostPage from './pages/CreatePostPage';
import { WishlistPage } from './pages/WishlistPage';
import CreateAuctionPage from './pages/CreateAuctionPage'
import AuctionDetailPage from './pages/AuctionDetailPage';
import { ManageAuctionsPage } from './pages/ManageAuctionPage';

// BỔ SUNG: Import LocationProvider
import { LocationProvider } from './context/LocationContext'; 

import InvoiceDetailPage from './pages/InvoiceDetailPage';
import PaymentResultPage from './pages/PaymentResultPage';

const PlaceholderPage = ({ title }: { title: string }) => (
    <div style={{ padding: 50, textAlign: 'center' }}>
        <h1 style={{ color: '#1976d2' }}>{title}</h1>
        <p>Đây là trang danh mục sản phẩm. Nội dung sẽ được cập nhật sau.</p>
    </div>
);

const App: React.FC = () => (
    // 🚨 BƯỚC SỬA: BAO BỌC TOÀN BỘ ỨNG DỤNG BẰNG LOCATIONPROVIDER
    <LocationProvider>
        <BrowserRouter>
            <Routes>
                {/* Trang Login sử dụng LayoutAuth */}
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
                            <ScrollToTop /> 
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
                    path="/car-ecycle"
                    element={
                        <LayoutMain>
                            <ElectricCarBatteryPage />
                        </LayoutMain>
                    }
                />
                <Route
                    path="/scooter-ecycle"
                    element={
                        <LayoutMain>
                            <ElectricScooterBatteryPage />
                        </LayoutMain>
                    }
                />
                <Route
                    path="/battery-ecycle"
                    element={
                        <LayoutMain>
                            <ElectricBatteryPage />
                        </LayoutMain>
                    }
                />
                <Route 
                    path="/search-post" 
                    element={
                        <LayoutMain>
                            <ScrollToTop /> 
                            <SearchPostPage />
                        </LayoutMain>
                    } 
                />
                <Route 
                    path="/content/:postId" 
                    element={
                        <LayoutMain>
                            <ScrollToTop /> 
                            <ProductDetailPage />
                        </LayoutMain>
                    } 
                />
                <Route 
                    path="/create-post" 
                    element={
                        <LayoutMain>
                            <ScrollToTop /> 
                            <CreatePostPage />
                        </LayoutMain>
                    } 
                />
                <Route 
                    path="/manage-posts" 
                    element={
                        <LayoutMain>
                            <ScrollToTop /> 
                            <ProductManagementPage />
                        </LayoutMain>
                    } 
                />
                <Route 
                    path="/detail-post-manage/:postId" 
                    element={
                        <LayoutMain>
                            <ScrollToTop /> 
                            <PostDetailPageManager />
                        </LayoutMain>
                    } 
                />
                <Route
                    path="/view-user/:userId"
                    element={
                        <LayoutMain>
                            <ViewUserPage />
                        </LayoutMain>
                    }
                />
                <Route
                    path="/manage-wishlists"
                    element={
                        <LayoutMain>
                            <WishlistPage />
                        </LayoutMain>
                    }
                />    
                <Route
                    path="/detail-auction/:auctionId"
                    element={
                        <LayoutMain>
                            <ScrollToTop /> 
                            <AuctionDetailPage />
                        </LayoutMain>
                    }
                />    
                <Route
                    path="/create-auction/:productId"
                    element={
                        <LayoutMain>
                            <ScrollToTop /> 
                            <CreateAuctionPage />
                        </LayoutMain>
                    }
                />   
                <Route
                    path="/manage-auction"
                    element={
                        <LayoutMain>
                            <ScrollToTop /> 
                            <ManageAuctionsPage />
                        </LayoutMain>
                    }
                />   
                <Route 
                    path="invoice-detail/:postId" 
                    element={
                        <LayoutMain>
                            <InvoiceDetailPage />
                        </LayoutMain>
                    } 
                />
                <Route 
                    path="payment-result" 
                    element={
                        <LayoutMain>
                            <PaymentResultPage />
                        </LayoutMain>
                    } 
                />      
            </Routes>
        </BrowserRouter>
    </LocationProvider>
);

export default App;