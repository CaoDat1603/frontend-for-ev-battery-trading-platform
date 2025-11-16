// src/pages/ViewUserPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Rating,
  Button,
  CircularProgress,
} from "@mui/material";
import { useUser } from "../context/UserContext";
import { UserService } from "../services/userService";
import { useParams } from "react-router-dom";

// Mock data cho sản phẩm & đánh giá
interface Product {
  id: number;
  name: string;
  image: string;
  price: string;
}

interface Review {
  id: number;
  reviewer: string;
  comment: string;
  rating: number;
}

const mockProducts: Product[] = [
  { id: 1, name: "Áo Khoác Denim", image: "https://via.placeholder.com/150", price: "250.000đ" },
  { id: 2, name: "Chân Váy Bubble", image: "https://via.placeholder.com/150", price: "180.000đ" },
  { id: 3, name: "Áo Thun Slimfit", image: "https://via.placeholder.com/150", price: "200.000đ" },
  { id: 4, name: "Đầm Đỏ Verita", image: "https://via.placeholder.com/150", price: "320.000đ" },
];

const mockReviews: Review[] = [
  { id: 1, reviewer: "Nguyen Van B", comment: "Sản phẩm tốt!", rating: 5 },
  { id: 2, reviewer: "Tran Thi C", comment: "Giao hàng nhanh", rating: 4 },
];

// Kiểu dữ liệu cho viewedUser
interface ViewedUser {
  id?: number | null,
  userFullName: string;
  avatarUrl?: string;
}

const ViewUserPage: React.FC = () => {
  const { user: me, loading } = useUser();
  const { userId } = useParams<{ userId: string }>();
  const parsedUserId = userId ? parseInt(userId, 10) : undefined;

  const [tabIndex, setTabIndex] = useState(0);
  const [viewedUser, setViewedUser] = useState<ViewedUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch user từ API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!parsedUserId || parsedUserId === me?.userId) {
          setViewedUser({
            userFullName: me?.userFullName || "",
            avatarUrl: me?.avatarUrl,
          });
        } else {
          const data = await UserService.getUserById(parsedUserId);
          
          setViewedUser({
            id: data.userId,
            userFullName: data.fullname || "Người khác",
            avatarUrl: `http://localhost:8000/identity${data.avatar}`,
          });
        }
      } catch (err) {
        console.error("ViewPage:" + err);
        setViewedUser({
          userFullName: "Người khác",
          avatarUrl: undefined,
        });
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [parsedUserId, me]);

  if (loading || loadingUser || !viewedUser)
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 6 }} />;

  // Tính thống kê mock
  const productsCount = mockProducts.length;
  const reviewsCount = mockReviews.length;
  const avgRating =
    mockReviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount || 0;

  const isMe = !parsedUserId || parsedUserId === me?.userId;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setTabIndex(newValue);

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", backgroundColor: "#f5f5f5", pb: 6 }}>
      {/* Header + User Info */}
      <Box
        sx={{
    backgroundColor: "#fff",
    p: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // dàn đều hai khối
    borderBottom: "1px solid #e6e6e6",
    width: "100%",
    px: { xs: 20, md: 20 }, // padding trái/phải của khung trắng
  }}
      >
        {/* Left: avatar + name + action */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
    <Avatar src={viewedUser.avatarUrl} sx={{ width: 96, height: 96 }} />
    <Box>
      <Typography variant="h6" fontWeight="700" noWrap>
        {viewedUser.userFullName}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
        
      </Box>
    </Box>
  </Box>

  {/* Thống kê dạng cột */}
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, textAlign: "left" }}>
    <Typography variant="body2" color="text.secondary">
      Sản phẩm: <strong>{productsCount}</strong>
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Đánh giá: <strong>{avgRating.toFixed(1)} ★</strong> ({reviewsCount} đánh giá)
    </Typography>
  </Box>
</Box>

      {/* Tabs */}
      <Box sx={{ backgroundColor: "#fff", borderBottom: "1px solid #e6e6e6" }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          centered
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Sản phẩm" />
          <Tab label="Đánh giá" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ px: { xs: 2, md: 3 }, mt: 3 }}>
        {tabIndex === 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {mockProducts.map((p) => (
              <Card
                key={p.id}
                sx={{
                  flex: "1 1 calc(25% - 16px)",
                  textAlign: "center",
                  p: 1,
                  backgroundColor: "#fff",
                }}
              >
                <Box
                  component="img"
                  src={p.image}
                  alt={p.name}
                  sx={{ width: "100%", height: 150, objectFit: "cover" }}
                />
                <Typography variant="subtitle1">{p.name}</Typography>
                <Typography color="primary">{p.price}</Typography>
              </Card>
            ))}
          </Box>
        )}

        {tabIndex === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {mockReviews.map((r) => (
              <Card key={r.id} sx={{ backgroundColor: "#fff" }}>
                <CardContent>
                  <Typography fontWeight="bold">{r.reviewer}</Typography>
                  <Rating value={r.rating} readOnly size="small" />
                  <Typography>{r.comment}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ViewUserPage;
