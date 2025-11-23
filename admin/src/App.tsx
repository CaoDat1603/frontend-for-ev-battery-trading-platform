import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';

// Pages (Mục 2)
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import ContentModerationPage from './pages/ContentModerationPage';
import TransactionManagementPage from './pages/TransactionManagementPage';
import ComplaintHandlingPage from './pages/ComplaintManagementPage';
import FeeCommissionManagementPage from './pages/FeeCommissionManagementPage';
import GeneralSettingsPage from './pages/GeneralSettingsPage';
import AuctionManagementPage from './pages/AuctionManagementPage';
import AuctionDetailPage from './pages/AuctionDetailPage'

import UserDetailPage from './pages/UserDetailPage';
import PostDetailPage from './pages/PostDetailPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import TransactionDetailPage from './pages/TransactionDetailPage';

import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';
import FeedbackPage from './pages/FeedbackPage';

// Auth pages
import {LoginPage} from './pages/Auth';
import {ResetPasswordEmailPage} from './pages/Auth';
import {ResetPasswordPhonePage} from './pages/Auth';
import {ForgotPasswordPage} from './pages/Auth';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Tuyến đường sử dụng Layout Admin (Sidebar + Header) */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="users/:userId" element={<UserDetailPage />} />
        <Route path="content" element={<ContentModerationPage />} />
        <Route path="content/:postId" element={<PostDetailPage />} />
        <Route path="transactions" element={<TransactionManagementPage />} />
        <Route path="transactions/:transactionId" element={<TransactionDetailPage />} />
        <Route path="complaints" element={<ComplaintHandlingPage />} />
        <Route path="complaints/:complaintId" element={<ComplaintDetailPage />} />
        <Route path="finance" element={<FeeCommissionManagementPage />} />
        <Route path="settings" element={<GeneralSettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
                <Route path="auctions" element={<AuctionManagementPage />} />
        <Route path="auction-detail/:auctionId" element={<AuctionDetailPage />} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Route>

      {/* Tuyến đường Auth (không dùng MainLayout) */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path="/identity/reset-password"
        element={
          <AuthLayout>
            <ResetPasswordEmailPage />
          </AuthLayout>
        }
      />
      <Route
        path="/reset-password-phone"
        element={
          <AuthLayout>
            <ResetPasswordPhonePage />
          </AuthLayout>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        }
      />
    </Routes>
  );
};

export default App;
