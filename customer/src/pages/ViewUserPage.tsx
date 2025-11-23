// src/pages/ViewUserPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Divider, // Thêm Divider để phân chia
  Paper, // Thêm Paper để tạo khối nền
} from "@mui/material";
import { useUser } from "../context/UserContext";
import { UserService } from "../services/userService";
import { useParams, useNavigate } from "react-router-dom";
import StorefrontIcon from '@mui/icons-material/Storefront'; // Icon Sản phẩm
import StarRateIcon from '@mui/icons-material/StarRate'; // Icon Đánh giá

// Kiểu dữ liệu cho viewedUser
interface ViewedUser {
  id?: number | null;
  userFullName: string;
  avatarUrl?: string;
}

const ViewUserPage: React.FC = () => {
  const { user: me, loading: loadingContext } = useUser();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const parsedUserId = userId ? parseInt(userId, 10) : undefined;

  const [tabIndex, setTabIndex] = useState(0); // Vẫn giữ Tab Index cho cấu trúc chung
  const [viewedUser, setViewedUser] = useState<ViewedUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch user từ API
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        if (!parsedUserId || parsedUserId === me?.userId) {
          setViewedUser({
            id: me?.userId,
            userFullName: me?.userFullName || "Tôi",
            avatarUrl: me?.avatarUrl,
          });
        } else {
          const data = await UserService.getUserById(parsedUserId);

          setViewedUser({
            id: data.userId,
            userFullName: data.fullname || "Người dùng không xác định",
            avatarUrl: `http://localhost:8000/identity${data.avatar}`,
          });
        }
      } catch (err) {
        console.error("ViewPage:", err);
        setViewedUser({
          id: parsedUserId,
          userFullName: "Không tìm thấy người dùng",
          avatarUrl: undefined,
        });
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [parsedUserId, me]);

  if (loadingContext || loadingUser || !viewedUser) {
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 6 }} />;
  }

  const viewedUserId = viewedUser.id;
  const isMe = viewedUserId === me?.userId;

  const handleViewProducts = () => {
    if (viewedUserId) {
      navigate(`/search-post?userId=${viewedUserId}`);
    }
  };

  const handleViewRates = () => {
    if (viewedUserId) {
      navigate(`/view-rates?userId=${viewedUserId}`);
    }
  };
  
  // Chúng ta không dùng Tabs cho nội dung, nên chỉ dùng để cấu trúc.
  // Có thể xóa hàm này nếu không dùng Tabs thực tế:
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setTabIndex(newValue);
    
  return (
    <Box sx={{ 
        width: "100%", 
        minHeight: "100vh", 
        backgroundColor: "#eef2f6", // Nền nhạt
        py: 5, 
        px: { xs: 2, md: 5 } 
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
            maxWidth: 800, 
            mx: 'auto', 
            borderRadius: 2, 
            overflow: 'hidden' 
        }}
      >
        {/* Banner Placeholder (Có thể dùng cho ảnh bìa sau này) */}
        <Box sx={{ 
            height: 120, 
            backgroundColor: '#42a5f5', // Màu xanh dương nổi bật
            backgroundImage: 'linear-gradient(135deg, #42a5f5 0%, #007bb2 100%)',
        }} />

        {/* 1. Header: Avatar và Tên */}
        <Box sx={{ 
            px: 4, 
            pt: 0, 
            pb: 4, 
            position: 'relative',
            mt: -6, // Kéo lên trên banner
        }}>
            
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
            {/* Avatar lớn */}
            <Avatar 
              src={viewedUser.avatarUrl} 
              sx={{ 
                width: 120, 
                height: 120,
                border: '4px solid #fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              }} 
            />
            
            {/* Tên và Thông tin */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {viewedUser.userFullName}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                 {isMe ? "Thông tin người dùng" : `User ID: ${viewedUserId}`}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />

          {/* 2. Nút Hành Động */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: 'flex-start' }}>
            {/* Nút Xem Sản phẩm */}
            <Button 
                variant="contained" 
                color="primary" 
                size="large"
                startIcon={<StorefrontIcon />}
                onClick={handleViewProducts}
                disabled={!viewedUserId}
                sx={{
                    fontWeight: 600,
                    borderRadius: 8,
                    minWidth: 180,
                }}
            >
              Xem Sản phẩm
            </Button>
            
            {/* Nút Xem Đánh giá */}
            <Button 
                variant="outlined" 
                color="warning" 
                size="large"
                startIcon={<StarRateIcon />}
                onClick={handleViewRates}
                disabled={!viewedUserId}
                sx={{
                    fontWeight: 600,
                    borderRadius: 8,
                    minWidth: 180,
                }}
            >
              Xem Đánh giá
            </Button>
          </Box>
        </Box>
        
        <Divider />
        
        {/* 3. Khu vực Nội dung (Tạm thời là placeholder) */}
        <Box sx={{ p: 4 }}>
             <Typography variant="h6" color="text.secondary" gutterBottom>
               Thông tin Chi tiết & Thống kê
             </Typography>
             <Box sx={{ p: 3, border: '1px dashed #ccc', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                 <Typography variant="body1" color="text.disabled">
                    
                 </Typography>
             </Box>
        </Box>
        
      </Paper>
    </Box>
  );
};

export default ViewUserPage;