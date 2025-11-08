import React, { useState, useEffect, type JSX } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Divider, Chip, Button, Alert,
    Card, CardContent, List, ListItem, ListItemText, ListItemIcon, 
    Dialog, DialogContent, IconButton, CircularProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

// ICONS
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import VerifiedIcon from '@mui/icons-material/Verified';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import FlagIcon from '@mui/icons-material/Flag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FmdGoodIcon from '@mui/icons-material/FmdGood'; 
import AttachFileIcon from '@mui/icons-material/AttachFile'; 
import FolderSharedIcon from '@mui/icons-material/FolderShared'; 
import DownloadIcon from '@mui/icons-material/Download'; 
import VisibilityIcon from '@mui/icons-material/Visibility'; 
import CloseIcon from '@mui/icons-material/Close'; 
import NotesIcon from '@mui/icons-material/Notes'; 

// --- IMPORT TỪ SERVICE FILE ---
import { 
    type ProductStatus, 
    ProductStatusValue,
    type ProductType, 
    type SaleMethod, 
    SaleMethodValue, 
    type ProductData,
    getProductById, // <-- Hàm API cần dùng
    updateProductStatusApi // <-- Hàm API giả lập cập nhật trạng thái
} from '../services/productService'; // Cập nhật đường dẫn thực tế của bạn

// Hàm helper để chuyển đổi giá trị số sang chuỗi hiển thị (Tái sử dụng từ service)
const getStatusString = (status: ProductStatus): string => {
    switch (status) {
        case ProductStatusValue.Available: return 'Available';
        case ProductStatusValue.Suspended: return 'Suspended';
        case ProductStatusValue.SoldOut: return 'Sold Out';
        case ProductStatusValue.Block: return 'Block';
        default: return 'Pending';
    }
}

const getProductTypeString = (type: number): string => {
    switch (type) {
        case 0: return 'Electric Battery';
        case 1: return 'Electric Car Battery';
        case 2: return 'Electric Scooter Battery';
        default: return 'Unknown Type';
    }
};


// INTERFACE CHUẨN HÓA (Mở rộng từ ProductData DTO để giữ lại các thuộc tính giao diện)
// Lưu ý: Các thuộc tính này không có trong DTO ProductData của API, nhưng cần cho UI
interface ProductDetail extends ProductData { 
    relatedComplaintIds: string[]; // Giữ lại cho giao diện
    adminNotes: string; // Giữ lại cho giao diện
}

// --- FAKE DATA cho các trường UI chưa có trong DTO ProductData ---
const getFakeUIData = (productId: number): { relatedComplaintIds: string[], adminNotes: string } => {
    // Logic giả lập để tạo dữ liệu liên quan và ghi chú admin dựa trên productId
    if (productId === 3) {
        return {
            relatedComplaintIds: ['c006', 'c007'], 
            adminNotes: 'High likelihood of scam/spam. Requires immediate rejection. User has been flagged for review.'
        };
    }
    if (productId === 1) {
        return { relatedComplaintIds: ['c001'], adminNotes: '' };
    }
    return { relatedComplaintIds: [], adminNotes: '' };
};


// --- 3. HELPER FUNCTIONS (Không thay đổi) ---
const getStatusChip = (status: ProductStatus): JSX.Element => {
    let color: 'default' | 'success' | 'error' | 'warning' = 'default';
    let icon: JSX.Element | undefined = undefined;
    const statusString = getStatusString(status);

    if (status === ProductStatusValue.Available) { color = 'success'; icon = <CheckCircleIcon style={{fontSize: 16}}/>; }
    else if (status === ProductStatusValue.Suspended) { color = 'error'; icon = <BlockIcon style={{fontSize: 16}}/>; }
    else if (status === ProductStatusValue.Block) { color = 'error'; icon = <BlockIcon style={{fontSize: 16}}/>; }
    else if (status === ProductStatusValue.SoldOut) { color = 'default'; icon = undefined; }
    else if (status === ProductStatusValue.Pending) { color = 'warning'; icon = <AccessTimeIcon style={{fontSize: 16}}/>; }

    return (
        <Chip 
            label={statusString} 
            size="medium"
            color={color}
            variant="filled"
            icon={icon}
        />
    );
};

const handleDownloadFile = (url: string | null, title: string) => {
    if (url) {
        window.open(url, '_blank');
        console.log(`Downloading file for: ${title} from ${url}`);
    } else {
        alert('File URL is not available.');
    }
}


const PostDetailPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>(); 
    const navigate = useNavigate();
    const theme = useTheme();

    const [product, setProduct] = useState<ProductDetail | null>(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // State để hiển thị lỗi API

    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [openImageModal, setOpenImageModal] = useState(false);
    
    // --- GỌI API THAY VÌ MOCK DATA TRONG USEEFFECT ---
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            const idNumber = parseInt(postId || '0');

            if (idNumber > 0) {
                try {
                    // **GỌI HÀM API getProductById ĐÃ IMPORT**
                    const fetchedProductData: ProductData = await getProductById(idNumber);

                    // Thêm dữ liệu giả lập cho UI (relatedComplaintIds, adminNotes)
                    const uiData = getFakeUIData(idNumber);

                    setProduct({
                        ...fetchedProductData,
                        ...uiData,
                        // Lưu ý: author chính là sellerId (theo yêu cầu của bạn, nhưng đã được xử lý trong service)
                    } as ProductDetail);

                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
                    setError(`Error fetching product: ${errorMessage}`);
                    setProduct(null);
                }
            } else {
                setError(`Invalid Product ID: ${postId}`);
                setProduct(null);
            }
            setLoading(false);
        };

        fetchProduct();
    }, [postId]);

    // Hàm mở/đóng Modal không đổi...
    const handleOpenImageModal = () => {
        if (product?.imageUrl) {
            setOpenImageModal(true);
        }
    };
    const handleCloseImageModal = () => {
        setOpenImageModal(false);
    };

    // --- CẬP NHẬT TRẠNG THÁI SỬ DỤNG API SERVICE ---
    const updateStatus = async (newStatus: ProductStatus) => {
        if (!product) return;

        setLoading(true); // Bắt đầu tải khi gửi yêu cầu

        try {
            await updateProductStatusApi(product.productId, newStatus);
            
            // Nếu API thành công, cập nhật trạng thái UI và refetch data để đồng bộ
            setProduct(prev => prev ? { 
                ...prev, 
                statusProduct: newStatus,
                moderatedBy: 1, // Giả định admin ID là 1
                updatedAt: new Date().toISOString()
            } : null);
            alert(`Product ${product.productId} status changed to ${getStatusString(newStatus)} successfully!`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown status update error.';
            alert(`Failed to update status: ${errorMessage}`);
            // Không setProduct nếu thất bại
        } finally {
            setLoading(false); 
        }
    };

    const toggleVerification = () => {
        if (product) {
            setProduct({ ...product, isVerified: !product.isVerified });
            alert(`Product ${product.productId} verification toggled to ${!product.isVerified}. (Local UI update)`);
        }
    };
    const handleViewAuthor = () => {
        if (product) {
            navigate(`/users/${product.sellerId}`); 
        }
    };
    const handleViewComplaints = () => {
        if (product?.relatedComplaintIds.length) {
            navigate(`/complaints?targetId=${product.productId}`);
        }
    };
    const handleGoBack = () => {
        navigate('/content');
    };

    const isPdf = product?.fileUrl?.toLowerCase().endsWith('.pdf');
    
    // --- 4. RENDER ---
    if (loading && !product) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
                <Typography sx={{ml: 2}}>Loading Product Details...</Typography>
            </Box>
        );
    }

    if (error || !product) {
        const displayId = postId || 'N/A';
        return (
            <Alert severity="error">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight="bold">Product ID:</Typography>
                    <Chip label={displayId} color="error" size="small" variant="outlined" />
                    <Typography>{error || 'not found in the database. Please check URL or Mock Data.'}</Typography>
                </Stack>
                <Button variant="contained" onClick={handleGoBack} sx={{ mt: 2 }}>
                    <ArrowBackIcon sx={{ mr: 1 }}/> Go back to Moderation List
                </Button>
            </Alert>
        );
    }

    return (
        <Box>
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={handleGoBack} 
                sx={{ mb: 3 }}
            >
                Back to Content Moderation
            </Button>
            
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
                <AssignmentIcon color="secondary" fontSize="large" /> 
                <Typography variant="h5" fontWeight="bold">
                    Product Detail: {product.title}
                </Typography>
                {product.isSpam && <Chip label="SPAM SUSPECT" color="error" size="medium" icon={<FlagIcon />} />}
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                
                {/* --- A. THÔNG TIN CƠ BẢN & NỘI DUNG (65%) --- */}
                <Card sx={{ width: { xs: '100%', md: '65%' } }}>
                    <CardContent>
                        {/* Status/ID */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h5" color="text.secondary">
                                ID: **{product.productId}**
                            </Typography>
                            {getStatusChip(product.statusProduct)}
                        </Stack>
                        <Divider sx={{ mb: 2 }} />
                        
                        {/* TÊN SẢN PHẨM VÀ HÌNH ẢNH */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" sx={{ mb: 3 }}>
                            {/* Hình ảnh */}
                            <Box 
                                sx={{ 
                                    width: 100, 
                                    height: 100, 
                                    bgcolor: theme.palette.grey[200], 
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    cursor: product.imageUrl ? 'zoom-in' : 'default',
                                }}
                                onClick={handleOpenImageModal}
                            >
                                {product.imageUrl ? (
                                    <img 
                                        src={product.imageUrl} 
                                        alt={product.productName} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Typography variant="caption" color="text.secondary">No Image</Typography>
                                )}
                            </Box>
                            {/* Tên sản phẩm */}
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="caption" color="text.secondary">Product Name:</Typography>
                                <Typography variant="h6" fontWeight="bold">{product.productName}</Typography>
                            </Box>
                        </Stack>
                        <Divider sx={{ mb: 2 }} />

                        {/* Metadata */}
                        <List disablePadding dense>
                            <ListItem disableGutters>
                                <ListItemIcon><FmdGoodIcon color="warning" /></ListItemIcon>
                                <ListItemText primary="Pickup Address" secondary={<Typography fontWeight="bold">{product.pickupAddress}</Typography>} />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                                <ListItemText 
                                    primary="Author" 
                                    secondary={<Box component="span" sx={{ fontWeight: 'bold', cursor: 'pointer', color: theme.palette.info.main }} onClick={handleViewAuthor}>
                                            {product.author} ({product.sellerId})
                                        </Box>}
                                />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon><AccessTimeIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Submitted Date" secondary={product.createdAt.substring(0, 10)} />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon>{product.isVerified ? <VerifiedIcon color="success" /> : <VerifiedIcon color="disabled" />}</ListItemIcon>
                                <ListItemText primary="Verification Status" secondary={product.isVerified ? 'VERIFIED' : 'Not Verified'} />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon><AssignmentIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Sale Method / Category" secondary={`${product.methodSale === SaleMethodValue.Auction ? 'Auction' : 'Fixed Price'} / ${getProductTypeString(product.productType ?? -1) || 'N/A'}`} />
                            </ListItem>
                        </List>
                        
                        <Divider sx={{ my: 3 }} />

                        {/* MÔ TẢ CHI TIẾT */}
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Description:</Typography>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.grey[100], whiteSpace: 'pre-wrap', mb: 3 }}>
                            <Typography variant="body1">
                                 {product.description}
                            </Typography>
                        </Paper>

                        <Divider sx={{ my: 3 }} />

                        {/* TÀI LIỆU ĐÍNH KÈM */}
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Attached Documents:</Typography>
                        <List disablePadding dense>
                            <ListItem disableGutters>
                                <ListItemIcon><FolderSharedIcon color="secondary" /></ListItemIcon>
                                <ListItemText primary="Registration Card/License" secondary={product.registrationCard || "N/A"} />
                            </ListItem>
                            <ListItem disableGutters secondaryAction={
                                <Stack direction="row" spacing={1}>
                                    {isPdf && (
                                        <Button 
                                            variant="outlined" size="small" startIcon={<VisibilityIcon />}
                                            onClick={() => setShowPdfViewer(!showPdfViewer)}
                                        >
                                            {showPdfViewer ? 'Hide PDF' : 'View PDF'}
                                        </Button>
                                    )}
                                    <Button 
                                        variant="contained" size="small" startIcon={<DownloadIcon />}
                                        disabled={!product.fileUrl}
                                        onClick={() => handleDownloadFile(product.fileUrl, product.title)}
                                    >
                                        Download
                                    </Button>
                                </Stack>
                            }>
                                <ListItemIcon><AttachFileIcon color="info" /></ListItemIcon>
                                <ListItemText 
                                    primary="Attached File" 
                                    secondary={product.fileUrl ? product.fileUrl.split('/').pop() : 'No File Attached'}
                                />
                            </ListItem>
                        </List>
                        
                        {/* TRÌNH XEM PDF NHÚNG */}
                        {showPdfViewer && isPdf && product.fileUrl && (
                            <Box sx={{ mt: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: '4px', height: 600 }}>
                                <iframe 
                                    src={product.fileUrl} 
                                    title={`PDF Viewer for ${product.productName}`}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                >
                                    This browser does not support PDFs. Please download the PDF to view it.
                                </iframe>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* --- B. ADMIN ACTIONS (35% - STICKY) --- */}
                <Stack sx={{ 
                    width: { xs: '100%', md: '35%' },
                    alignSelf: 'flex-start', 
                    position: 'sticky', 
                    top: theme.spacing(10), // Vị trí cố định (có thể điều chỉnh)
                }} spacing={3}>
                    
                    {/* HÀNH ĐỘNG KIỂM DUYỆT */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2] }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Moderation Actions</Typography>
                        <Stack spacing={1}>
                            
                            {/* Duyệt/Từ chối */}
                            {product.statusProduct !== ProductStatusValue.Available && (
                                <Button 
                                    startIcon={<CheckCircleIcon />} 
                                    variant="contained" 
                                    color="success" 
                                    onClick={() => updateStatus(ProductStatusValue.Available)}
                                    disabled={loading}
                                >
                                    Approve Product
                                </Button>
                            )}
                            {product.statusProduct !== ProductStatusValue.Block && (
                                <Button 
                                    startIcon={<BlockIcon />} 
                                    variant="outlined" 
                                    color="error" 
                                    onClick={() => updateStatus(ProductStatusValue.Block)}
                                    disabled={loading}
                                >
                                    Reject / Take Down / Ban
                                </Button>
                            )}
                            {product.statusProduct !== ProductStatusValue.Suspended && (
                                <Button 
                                    startIcon={<BlockIcon />} 
                                    variant="outlined" 
                                    color="error" 
                                    onClick={() => updateStatus(ProductStatusValue.Suspended)}
                                    disabled={loading}
                                >
                                    Suspended
                                </Button>
                            )}
                            
                            <Divider sx={{ my: 1 }} />
                            
                            {/* Gắn nhãn Đã kiểm định */}
                             <Button 
                                variant={product.isVerified ? "contained" : "outlined"}
                                color="primary" 
                                size="medium"
                                startIcon={<VerifiedIcon />}
                                onClick={toggleVerification}
                                disabled={loading}
                            >
                                {product.isVerified ? 'Remove Verification' : 'Mark as Verified'}
                            </Button>
                            
                            <Divider sx={{ my: 1 }} />
                            
                            {/* Xử lý Khiếu nại */}
                            <Button 
                                startIcon={<ReportProblemIcon />} variant="contained" 
                                color={product.relatedComplaintIds.length > 0 ? 'warning' : 'inherit'}
                                disabled={product.relatedComplaintIds.length === 0 || loading}
                                onClick={handleViewComplaints}
                            >
                                View Related Complaints ({product.relatedComplaintIds.length})
                            </Button>
                        </Stack>
                    </Paper>

                    {/* RELATED COMPLAINTS (Chỉ giao diện - Dữ liệu giả lập) */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2] }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <ReportProblemIcon color="warning" />
                            <Typography variant="h6" fontWeight="bold">Related Complaints</Typography>
                        </Stack>
                        {product.relatedComplaintIds.length > 0 ? (
                            <List dense>
                                {product.relatedComplaintIds.map(complaintId => (
                                    <ListItem key={complaintId} disablePadding>
                                        <Chip 
                                            label={`Complaint ID: ${complaintId}`} 
                                            onClick={handleViewComplaints} 
                                            clickable 
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                            sx={{mt: 0.5, mb: 0.5}}
                                        />
                                    </ListItem>
                                ))}
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Click above or the 'View Related Complaints' button to see details.
                                </Typography>
                            </List>
                        ) : (
                            <Alert severity="info" sx={{ p: 1 }}>No related complaints found.</Alert>
                        )}
                    </Paper>

                    {/* ADMIN NOTES (Chỉ giao diện - Dữ liệu giả lập) */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2] }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <NotesIcon color="info" />
                            <Typography variant="h6" fontWeight="bold">Admin Notes</Typography>
                        </Stack>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.grey[100], whiteSpace: 'pre-wrap', minHeight: 60 }}>
                            <Typography variant="body2" color={product.adminNotes ? "text.primary" : "text.secondary"}>
                                {product.adminNotes || "No internal notes have been added for this product yet."}
                            </Typography>
                        </Paper>
                        {/* Có thể thêm nút chỉnh sửa ở đây nếu cần */}
                    </Paper>

                </Stack>
            </Stack>

            {/* --- C. IMAGE MODAL/DIALOG (Lightbox) --- */}
            {product.imageUrl && (
                <Dialog 
                    open={openImageModal} 
                    onClose={handleCloseImageModal} 
                    maxWidth="md" 
                    fullWidth
                    sx={{
                        '& .MuiDialog-paper': { 
                            bgcolor: 'rgba(0, 0, 0, 0.9)', 
                            maxWidth: '90vw', 
                            maxHeight: '90vh' 
                        }
                    }}
                >
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseImageModal}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'white',
                            zIndex: 10,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img 
                            src={product.imageUrl} 
                            alt={product.productName} 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain' 
                            }}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Box>
    );
};

export default PostDetailPage;