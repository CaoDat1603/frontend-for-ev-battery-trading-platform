import React, { useState, useRef, type JSX, useEffect, useMemo } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Divider, Chip, Button, TextField, Select, MenuItem, InputLabel, FormControl,
    CircularProgress, Card, CardContent, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// ICONS
import NoteAddIcon from '@mui/icons-material/NoteAdd'; 
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; 
import SendIcon from '@mui/icons-material/Send'; 
import AttachFileIcon from '@mui/icons-material/AttachFile'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import FileDownloadIcon from '@mui/icons-material/FileDownload'; 
import VisibilityIcon from '@mui/icons-material/Visibility'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; 
import DeleteIcon from '@mui/icons-material/Delete';
import CollectionsIcon from '@mui/icons-material/Collections'; 

import LocationPopover from '../components/popovers/LocationPopover';

import { VIETNAM_PROVINCES, type Province, type District } from '../data/vietnamLocations';

import { 
    createProductApi, 
    type CreateProductRequest, 
    ProductType as ApiProductType,
    type SaleMethod as ApiSaleMethod,
    SaleMethodValue as ApiSaleMethodValue // Đổi tên để tránh xung đột với Enums cục bộ
} from '../services/productService';

// Thư viện xử lý PDF (Cần cài đặt: npm install html2canvas jspdf)
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// --- ENUMS VÀ HẰNG SỐ ---
const SaleMethodValue = { FixedPrice: 1, Auction: 2 } as const;
type SaleMethod = typeof SaleMethodValue[keyof typeof SaleMethodValue];

const ProductTypeValue = { ElectricBattery: 0, ElectricCarBattery: 1, ElectricScooterBattery: 2 } as const;
type ProductType = typeof ProductTypeValue[keyof typeof ProductTypeValue];


// --- INTERFACES VÀ TYPES (Đã thêm InputField) ---
interface LocationData {
    province: string; // Tên tỉnh/thành phố
    district: string; // Tên quận/huyện
    street: string; // Địa chỉ nhà/tên đường
}

// Interface cho các trường nhập liệu dạng text
interface InputField {
    label: string;
    name: string;
    placeholder?: string;
}

// Interface mới cho hình ảnh được xem trước
interface ImagePreview {
    file: File;
    previewUrl: string;
}

// A. Dữ liệu Bài đăng (GỬI API - KHÔNG XUẤT PDF)
interface PostData {
    title: string;          
    productName: string;    
    description: string;    
    price: string;          
    methodSale: SaleMethod; 
    productType: ProductType; 
    mainImage: ImagePreview[];
    registrationCard: string;
    location: LocationData;       
    sellerId: string;
    isDraft: boolean;
}
// B. NỘI DUNG CHUNG CỦA PDF
interface PdfContentBase {
    externalImages: string; 
    internalImages: string; 
    condition: string;      
    warrantyPolicy: string; 
}

// C. NỘI DUNG PDF CHO XE (Ô tô/Xe máy)
// ✅ Đã SỬA: Kế thừa từ PdfContentBase
interface CarPdfContent extends PdfContentBase {
    kilometers: string;     
    origin: string;         
    brand: string;          
    model: string;          
    year: string;           
    version: string;        
    gearbox: string;        
    fuel: string;           
    bodyStyle: string;      
    seats: string;          
    weight: string;         
    loadCapacity: string;   
}

// D. NỘI DUNG PDF CHO PIN/ẮC QUY
// ✅ Đã SỬA: Kế thừa từ PdfContentBase
interface BatteryPdfContent extends PdfContentBase {
    capacityAh: string;     
    voltageV: string;       
    weightKg: string;       
    manufacturer: string;   
    productionDate: string; 
    cycleLife: string;      
}

// E. Gộp lại cho State
type PdfContent = CarPdfContent | BatteryPdfContent;

// Giá trị ban đầu cho PDF Content (Xe là mặc định)
// ✅ Đã SỬA: Đảm bảo khớp với CarPdfContent
const initialCarPdfContent: CarPdfContent = {
    externalImages: '', internalImages: '', condition: '', warrantyPolicy: '',
    kilometers: '', origin: '', brand: '', model: '', year: '', version: '', 
    gearbox: '', fuel: '', bodyStyle: '', seats: '', weight: '', loadCapacity: '',
};

// ✅ Đã SỬA: Đảm bảo khớp với BatteryPdfContent
const initialBatteryPdfContent: BatteryPdfContent = {
    externalImages: '', internalImages: '', condition: '', warrantyPolicy: '',
    capacityAh: '', voltageV: '', weightKg: '', manufacturer: '', productionDate: '', cycleLife: '',
};

// Giá trị ban đầu cho Post Data
const initialPostData: PostData = {
    title: '', productName: '', description: '', price: '',
    methodSale: SaleMethodValue.FixedPrice,
    productType: ProductTypeValue.ElectricCarBattery, 
    mainImage: [], // Ảnh đại diện trống
    location: {
        province: '',
        district: '',
        street: '',
    },
    registrationCard: '',
    sellerId: 'user-007',
    isDraft: true,
};

// --- HELPER FUNCTIONS ---
const formatPrice = (value: string): string => {
    // 1. Chỉ giữ lại chữ số (luôn là bước đầu tiên và quan trọng nhất)
    const digits = value.replace(/\D/g, ''); 
    
    if (digits.length === 0) {
        return '';
    }

    // 2. Loại bỏ số 0 ở đầu 
    let cleanDigits = digits;
    if (digits.length > 1) {
        // Loại bỏ số 0 ở đầu (ví dụ: "000123" -> "123")
        cleanDigits = digits.replace(/^0+/, '');
    }
    
    // Nếu kết quả sau khi loại bỏ số 0 trở thành rỗng, hoặc chỉ là "0", ta trả về "0".
    if (cleanDigits.length === 0) {
        return '0';
    }

    // 3. 🚀 KHÔNG THÊM DẤU CHẤM: Chỉ trả về chuỗi số nguyên sạch
    return cleanDigits; 
};

// =========================================================
// TRANG CHÍNH: CREATE POST
// =========================================================

const CreatePostPage: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [locationAnchorEl, setLocationAnchorEl] = useState<HTMLElement | null>(null);
    


    const pdfContentRef = useRef<HTMLDivElement>(null); 


    const [postData, setPostData] = useState<PostData>(initialPostData);
    const [pdfContent, setPdfContent] = useState<PdfContent>(initialCarPdfContent); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [generatedPdfFile, setGeneratedPdfFile] = useState<File | null>(null);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);

    const currentProvince: Province | null = useMemo(() => {
        if (!postData.location.province) return null;
        
        return VIETNAM_PROVINCES.find(p => p.name === postData.location.province) || null;
    }, [postData.location.province]);

    const currentDistrictObj: District | null = useMemo(() => {
        if (!currentProvince || !postData.location.district) return null;
        
        return currentProvince.districts.find(d => d.name === postData.location.district) || null;
    }, [currentProvince, postData.location.district]);
    
    // --- POPUP HANDLERS ---
    const handleLocationOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setLocationAnchorEl(event.currentTarget);
    };

    const handleLocationClose = () => {
        setLocationAnchorEl(null);
    };

    const handleLocationSelect = (province: Province | null, district: District | null) => {
        // Cập nhật postData.location.province và postData.location.district
        setPostData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                province: province?.name || '', 
                district: district?.name || '',
                // Đảm bảo xóa street nếu tỉnh/huyện bị xóa
                street: (province || district) ? prev.location.street : '', 
            },
        }));
        handleLocationClose(); // Đóng popover sau khi chọn
    };

    // ✅ STATE MỚI: Lưu trữ các tệp ảnh và URL xem trước
    const [imagePreviews, setImagePreviews] = useState<Record<keyof PdfContentBase, ImagePreview[]>>({
        externalImages: [],
        internalImages: [],
        condition: [], // Không dùng
        warrantyPolicy: [] // Không dùng
    } as any); // Ép kiểu vì 2 key cuối không phải mảng ảnh

    // --- HOOKS ---
    useEffect(() => {
        return () => {
            // Giải phóng Object URLs khi component unmount
            //Object.values(imagePreviews).flat().forEach(item => {
            //    URL.revokeObjectURL(item.previewUrl);
            //});
            if (pdfObjectUrl) {
                URL.revokeObjectURL(pdfObjectUrl);
            }
        };
    }, [pdfObjectUrl]);

    useEffect(() => {
        // ... (Logic reset khi đổi loại sản phẩm giữ nguyên)
        if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
        setGeneratedPdfFile(null);
        setPdfObjectUrl(null);

        // Clear previews and content
        setImagePreviews({ externalImages: [], internalImages: [] } as any);
        
        if (postData.productType === ProductTypeValue.ElectricCarBattery) {
            setPdfContent(initialCarPdfContent);
        } else if (postData.productType === ProductTypeValue.ElectricBattery) {
            setPdfContent(initialBatteryPdfContent);
        } else if (postData.productType === ProductTypeValue.ElectricScooterBattery) {
            setPdfContent(initialCarPdfContent);
        }
    }, [postData.productType]); 


    // --- HÀM CHANGE HANDLER (GIỮ NGUYÊN) ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string, value: any } }, isPdfContent = false) => {
        const { name, value } = e.target;
        
        let newValue: any = value;
        if (name === 'price') {
            const digitsOnly = String(value).replace(/\D/g, '');
            newValue = formatPrice(value as string);
            if (digitsOnly === '') {
                newValue = '';
            }
        } else if (name === 'productType') {
            newValue = parseInt(value as string) as ProductType;
        }

        // Xử lý trường location
    if (name.startsWith('location.')) {
        const locationField = name.split('.')[1]; // 'province', 'district', 'street'
        setPostData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                [locationField]: value,
            },
        }));
        return; // Dừng nếu là location
    }

        if (isPdfContent) {
            setPdfContent((prev: PdfContent) => ({
                ...prev,
                [name]: newValue
            }));
        } else {
            setPostData((prev: PostData) => ({
                ...prev,
                [name]: newValue
            }));
        }

        if (isPdfContent || ['title', 'productName', 'description', 'price'].includes(name)) {
            if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
            setGeneratedPdfFile(null);
            setPdfObjectUrl(null);
        }
    };
    
    // --- HÀM XỬ LÝ TỆP ẢNH MỚI (THAY THẾ handleMockUpload) ---
    const handleImageDropOrSelect = (files: FileList | null, fieldName: keyof PdfContentBase) => {
        if (!files || files.length === 0) return;

        const currentPreviews = imagePreviews[fieldName]; // Lấy danh sách ảnh hiện tại
        let allPreviews: ImagePreview[] = [...currentPreviews]; // Sao chép để sửa đổi

        const newFilesList: File[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                // Kiểm tra trùng lặp dựa trên tên file và kích thước
                const isDuplicate = currentPreviews.some(
                   (p) => p.file.name === file.name && p.file.size === file.size
                );
                if (!isDuplicate) {
                    const previewUrl = URL.createObjectURL(file);
                    allPreviews.push({ file, previewUrl });
                    newFilesList.push(file); // Thêm vào danh sách tệp mới
                }
            }
        }
    
        if (newFilesList.length > 0) { // Chỉ cập nhật nếu có tệp mới được thêm
            // Cập nhật State ảnh xem trước
            setImagePreviews(prev => ({
                ...prev,
                [fieldName]: allPreviews // ✅ Bây giờ sẽ nối thêm ảnh
            }));
        
            // Cập nhật PdfContent bằng chuỗi mô tả
            const fileNames = allPreviews.map(p => p.file.name);
            const mockValue = `[${allPreviews.length} ảnh] - ${fileNames.join(', ')}`;
            handleChange({ target: { name: fieldName as string, value: mockValue } }, true);
        }
    };

    // --- HÀM XÓA ẢNH ---
    const handleRemoveImage = (fieldName: keyof PdfContentBase) => {
        const previewsToRemove = imagePreviews[fieldName];
        if (!previewsToRemove) return;

        // Giải phóng Object URLs
        previewsToRemove.forEach(item => URL.revokeObjectURL(item.previewUrl));

        // Cập nhật State
        setImagePreviews(prev => ({
            ...prev,
            [fieldName]: []
        }));
        
        // Reset PdfContent
        handleChange({ target: { name: fieldName as string, value: '' } }, true);
    };

    // --- HÀM TẠO PDF ---
    const handleGeneratePdf = async () => {
        if (!pdfContentRef.current || !postData.title || !postData.productName) {
            alert("Vui lòng nhập Tiêu đề và Tên sản phẩm trước khi tạo PDF.");
            return;
        }

        if (!postData.location.province || !postData.location.district || !postData.location.street) {
            alert("Vui lòng nhập đầy đủ Tỉnh/Thành phố, Quận/Huyện và Địa chỉ chi tiết.");
            return;
        }

        if (postData.mainImage.length === 0) {
            alert("Vui lòng thêm Ảnh hiển thị trên bài đăng.");
            return;
        }

        // 3. Kiểm tra Ref và Bắt đầu tạo PDF
        if (!pdfContentRef.current) {
            alert("Lỗi tham chiếu PDF. Vui lòng thử lại.");
            return;
        }

        setPdfGenerating(true);
        setGeneratedPdfFile(null); 
        
        if (pdfObjectUrl) {
            URL.revokeObjectURL(pdfObjectUrl);
            setPdfObjectUrl(null);
        }

        try {
            const canvas = await html2canvas(pdfContentRef.current, {
                scale: 2, 
                useCORS: true,
                logging: false, 
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const pdf = new jsPDF('p', 'mm', 'a4'); 
            const imgWidth = 210; 
            const pageHeight = 295; 
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const pdfBlob = pdf.output('blob');
            const fileName = `${postData.title.replace(/\s/g, '_').slice(0, 30)}-${Date.now()}.pdf`;
            const pdfFile = new File([pdfBlob], fileName, {
                type: 'application/pdf',
                lastModified: Date.now(),
            });

            const url = URL.createObjectURL(pdfBlob);
            setPdfObjectUrl(url);
            
            setGeneratedPdfFile(pdfFile);

        } catch (error) {
            console.error("Lỗi khi tạo PDF:", error);
            alert("Lỗi khi tạo PDF. Vui lòng thử lại.");
        } finally {
            setPdfGenerating(false);
        }
    };
    
    // --- HÀM XEM TRƯỚC VÀ TẢI XUỐNG ---
    const handleViewPdf = () => {
        if (pdfObjectUrl) {
            window.open(pdfObjectUrl, '_blank');
        } else {
            alert("Chưa có file PDF để xem.");
        }
    };
    
    const handleDownloadPdf = () => {
        if (pdfObjectUrl && generatedPdfFile) {
            const link = document.createElement('a');
            link.href = pdfObjectUrl;
            link.download = generatedPdfFile.name; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Chưa có file PDF để tải xuống.");
        }
    };
    
const handleSubmit = async () => {
    // 1. Kiểm tra điều kiện bắt buộc
    if (!generatedPdfFile || postData.mainImage.length === 0) {
        alert("Vui lòng tạo file PDF và chọn ảnh đại diện trước khi gửi.");
        return;
    }

    // Lấy ảnh đại diện (giả sử chỉ lấy ảnh đầu tiên)
    const mainImageFile = postData.mainImage[0].file;

    // Chuyển đổi Price từ string đã format sang number
    const priceNumber = parseInt(postData.price.replace(/\D/g, ''));

    const apiSaleMethod: ApiSaleMethod = postData.methodSale === SaleMethodValue.FixedPrice
    ? ApiSaleMethodValue.FixedPrice // <-- Đây là VALUE
    : ApiSaleMethodValue.Auction;

    // 2. Chuẩn bị Request DTO
    // LƯU Ý: Phải ánh xạ ProductType và SaleMethod đúng với API
    const requestData: CreateProductRequest = {
        title: postData.title,
        price: priceNumber, 
        pickupAddress: `${postData.location.province}, ${postData.location.district}, ${postData.location.street}`,
        productName: postData.productName,
        description: postData.description,
        
        // ✅ ÁNH XẠ ENUM VỀ KIỂU SỐ CỦA API
        productType: postData.productType as unknown as ApiProductType,
        saleMethod: apiSaleMethod,

        // File/Image sẽ được gửi qua FormData trong hàm service
        imageUrl: mainImageFile, // Ảnh đại diện
        fileUrl: generatedPdfFile, // File PDF (đã được tạo)

        // Các trường tùy chọn
        registrationCard: postData.registrationCard || "string",
        isSpam: false, 
    };

    // 3. Gọi API
    setIsSubmitting(true);
    try {
        const result = await createProductApi(requestData);
        
        console.log('API Response:', result);
        
        // ✅ THÀNH CÔNG
        alert(`Bài đăng đã được tạo thành công! ID: ${result.productId}`);
        navigate(`/detail-post-manage/${result.productId}`); // Chuyển hướng đến trang chi tiết
        
    } catch (error) {
        console.error('Submission Failed:', error);
        alert(`Lỗi gửi bài đăng: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
        setIsSubmitting(false);
    }
};


// =========================================================
    // ✅ COMPONENT DROP ZONE MỚI
    // =========================================================
    interface DropZoneProps {
        fieldName: keyof PdfContentBase;
        label: string;
        previews: ImagePreview[];
        onDrop: (files: FileList | null) => void;
        onRemove: () => void;
    }

    const ImageDropZone: React.FC<DropZoneProps> = ({ fieldName, label, previews, onDrop, onRemove }) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const [isDragging, setIsDragging] = useState(false);

        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault(); 
            setIsDragging(true);
        };
        const handleDragLeave = (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
        };
        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(true);
            if (e.dataTransfer.files.length) {
                onDrop(e.dataTransfer.files);
            }
        };
        const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            onDrop(e.target.files);
            e.target.value = ''; // Reset input value
        };

        const hasImages = previews.length > 0;
        
        return (
            <Box
                onDragOver={handleDragOver}   // Áp dụng cho toàn bộ khu vực
                onDragLeave={handleDragLeave} 
                onDrop={handleDrop} 
                sx={{                
                    border: `2px ${isDragging ? 'dashed' : 'solid'} ${isDragging ? theme.palette.primary.main : theme.palette.grey[300]}`, 
                    p: 2, 
                    borderRadius: 2,
                    transition: 'border-color 0.3s',
                    backgroundColor: isDragging ? theme.palette.primary.light + '1A' : 'transparent',
            }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    **{label}**
                </Typography>
                
                {!hasImages ? (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 3,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 },
                        }}
                        onClick={() => inputRef.current?.click()}
                    >
                        <CollectionsIcon color="action" sx={{ fontSize: 40 }} />
                        <Typography variant="body2" color="text.secondary">
                            Kéo thả ảnh vào đây hoặc **nhấn để chọn**
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1}>
                        <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 1 }}>
                            {previews.map((preview, index) => (
                                <Box key={index} sx={{ position: 'relative', width: 60, height: 60 }}>
                                    <img 
                                        src={preview.previewUrl} 
                                        alt={`Preview ${index}`} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                                    />
                                    <Chip 
                                        label={index + 1} 
                                        size="small" 
                                        color="primary" 
                                        sx={{ position: 'absolute', top: 2, left: 2, height: 18 }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                        
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="success.main" fontWeight="bold">
                                {previews.length} tệp đã được chọn.
                            </Typography>
                            <Button 
                                variant="text" 
                                color="error" 
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            >
                                Xóa tất cả
                            </Button>
                        </Stack>
                    </Stack>
                )}
                
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={inputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                />
            </Box>
        );
    };

    // --- HÀM RENDER RIÊNG CHO CÁC TRƯỜNG CỦA PDF (INPUTS) ---
    const renderPdfContentFields = () => {
        const isBattery = postData.productType === ProductTypeValue.ElectricBattery;
        const currentContent = pdfContent as (CarPdfContent | BatteryPdfContent);
        
        // Định nghĩa các trường File
        const fileFields: { label: string, name: keyof PdfContentBase }[] = [
            { label: 'Hình ảnh bên ngoài(trước, sau, trái, phải, dưới xe/pin)', name: 'externalImages' },
            { label: 'Hình ảnh bên trong(nội thất bên trong xe ô tô/cốp xe gắn máy - pin không cần)', name: 'internalImages' },
        ];
        
        // Định nghĩa các trường Text (Giữ nguyên)
        const baseTextFields: InputField[] = [
            { label: 'Tình trạng chung', name: 'condition', placeholder: 'Ví dụ: Mới 90%, còn zin 80%' },
            { label: 'Chính sách bảo hành', name: 'warrantyPolicy', placeholder: '6 tháng, 1 năm, không bảo hành' },
        ];

        const carFields: InputField[] = [
            { label: 'Số km đã đi', name: 'kilometers', placeholder: 'ví dụ: 50,000 km' },
            { label: 'Xuất xứ', name: 'origin', placeholder: 'Nhật, Đức, Việt Nam...' },
            { label: 'Hãng', name: 'brand' },
            { label: 'Dòng xe', name: 'model' },
            { label: 'Năm sản xuất', name: 'year' },
            { label: 'Phiên bản xe', name: 'version' },
            { label: 'Hộp số', name: 'gearbox' },
            { label: 'Nhiên liệu', name: 'fuel' },
            { label: 'Kiểu dáng', name: 'bodyStyle' },
            { label: 'Số chỗ', name: 'seats' },
            { label: 'Trọng lượng', name: 'weight' },
            { label: 'Trọng tải', name: 'loadCapacity' },
        ];

        const batteryFields: InputField[] = [
            { label: 'Dung lượng (Ah)', name: 'capacityAh' },
            { label: 'Điện áp (V)', name: 'voltageV' },
            { label: 'Trọng lượng (Kg)', name: 'weightKg' },
            { label: 'Nhà sản xuất', name: 'manufacturer' },
            { label: 'Ngày sản xuất', name: 'productionDate' },
            { label: 'Chu kỳ sạc/xả', name: 'cycleLife' },
        ];

        // Gộp các trường text
        const textFields: InputField[] = [
            ...baseTextFields, 
            ...(isBattery ? batteryFields : carFields)
        ];


        return (
            <>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                    📸 Tải lên Hình ảnh (Kéo & Thả)
                </Typography>
                <Stack spacing={2}>
                    {fileFields.map(field => (
                        <ImageDropZone
                            key={field.name}
                            fieldName={field.name}
                            label={field.label}
                            previews={imagePreviews[field.name]}
                            onDrop={(files) => handleImageDropOrSelect(files, field.name)}
                            onRemove={() => handleRemoveImage(field.name)}
                        />
                    ))}
                </Stack>
                
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                    📝 Thông số Chi tiết
                </Typography>
                {textFields.map(field => (
                    <TextField
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        fullWidth
                        margin="normal"
                        value={currentContent[field.name as keyof typeof currentContent] || ''} 
                        onChange={(e) => handleChange(e, true)} 
                        required
                        size="small"
                        placeholder={field.placeholder} 
                        sx={{ mt: 1 }}
                    />
                ))}
            </>
        );
    };

const renderPdfViewContent = () => {
    const isBattery = postData.productType === ProductTypeValue.ElectricBattery;
    const currentContent = pdfContent as (CarPdfContent | BatteryPdfContent);
    
    // Logic render thông số kỹ thuật giữ nguyên
    const carTechSpecs = !isBattery ? [
        { label: 'Hãng', value: (currentContent as CarPdfContent).brand },
        { label: 'Dòng xe', value: (currentContent as CarPdfContent).model },
        { label: 'Năm SX', value: (currentContent as CarPdfContent).year },
        { label: 'Phiên bản', value: (currentContent as CarPdfContent).version },
        { label: 'Hộp số', value: (currentContent as CarPdfContent).gearbox },
        { label: 'Nhiên liệu', value: (currentContent as CarPdfContent).fuel },
        { label: 'Kiểu dáng', value: (currentContent as CarPdfContent).bodyStyle },
        { label: 'Số chỗ', value: (currentContent as CarPdfContent).seats },
        { label: 'Trọng lượng', value: (currentContent as CarPdfContent).weight },
        { label: 'Trọng tải', value: (currentContent as CarPdfContent).loadCapacity },
    ] : [];

    const batteryTechSpecs = isBattery ? [
        { label: 'Dung lượng', value: (currentContent as BatteryPdfContent).capacityAh + ' Ah' },
        { label: 'Điện áp', value: (currentContent as BatteryPdfContent).voltageV + ' V' },
        { label: 'Trọng lượng', value: (currentContent as BatteryPdfContent).weightKg + ' Kg' },
        { label: 'Nhà sản xuất', value: (currentContent as BatteryPdfContent).manufacturer },
        { label: 'Ngày SX', value: (currentContent as BatteryPdfContent).productionDate },
        { label: 'Chu kỳ sạc', value: (currentContent as BatteryPdfContent).cycleLife },
    ] : [];
    
    // Chiều cao ảnh mới: 80px * 2 = 160px
    const IMAGE_HEIGHT = 160; 

return (
        <Box 
            ref={pdfContentRef} 
            sx={{ width: '210mm', minHeight: '297mm', p: '20mm', bgcolor: '#fff', fontSize: 10, lineHeight: 1.5, boxSizing: 'border-box' }}
        >
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, fontSize: 18 }}>
                {postData.productName || 'Tên Sản Phẩm (Chưa nhập)'}
            </Typography>
            
            {/* THÔNG TIN CHUNG */}
            <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Tiêu đề tin đăng:</strong> {postData.title}
            </Typography>

            <Divider sx={{ my: 1 }}><Chip label="Tình Trạng & Hình Ảnh" size="small" /></Divider>
            
            {/* 1. KHU VỰC HÌNH ẢNH (2 Hàng Ngang) */}
            <Stack spacing={2} sx={{ mb: 2 }}>
                
                {/* 1A. HÀNG ẢNH BÊN NGOÀI */}
                <Box sx={{ border: '1px solid #eee', p: 1, borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                        Ảnh bên ngoài(trước, sau, trái, phải, dưới xe/pin) ({imagePreviews.externalImages.length} tệp)
                    </Typography>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'row', 
                        flexWrap: 'wrap', // Cho phép ảnh xuống dòng
                        gap: 1, 
                    }}>
                        {imagePreviews.externalImages.map((p, i) => (
                            <Box key={`ext-${i}`} sx={{ height: IMAGE_HEIGHT, flexShrink: 0, minWidth: 100 }}>
                                <img 
                                    src={p.previewUrl} 
                                    alt={`Ảnh ngoài ${i+1}`} 
                                    crossOrigin="anonymous" 
                                    style={{ 
                                        height: '100%',     
                                        width: 'auto',      // Giữ tỷ lệ khung hình
                                        maxWidth: '100%',   
                                        objectFit: 'contain', 
                                        borderRadius: 2
                                    }} 
                                />
                            </Box>
                        ))}
                        {imagePreviews.externalImages.length === 0 && (
                            <Typography variant="caption" color="text.secondary">Không có ảnh ngoài.</Typography>
                        )}
                    </Box>
                </Box>
                
                {/* 1B. HÀNG ẢNH BÊN TRONG */}
                <Box sx={{ border: '1px solid #eee', p: 1, borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                        Ảnh bên trong(nội thất bên trong xe ô tô/cốp xe gắn máy - pin không cần) ({imagePreviews.internalImages.length} tệp)
                    </Typography>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'row', 
                        flexWrap: 'wrap', 
                        gap: 1, 
                    }}>
                        {imagePreviews.internalImages.map((p, i) => (
                            <Box key={`int-${i}`} sx={{ height: IMAGE_HEIGHT, flexShrink: 0, minWidth: 100 }}>
                                <img 
                                    src={p.previewUrl} 
                                    alt={`Ảnh trong ${i+1}`} 
                                    crossOrigin="anonymous" 
                                    style={{ 
                                        height: '100%', 
                                        width: 'auto', 
                                        maxWidth: '100%', 
                                        objectFit: 'contain', 
                                        borderRadius: 2 
                                    }} 
                                />
                            </Box>
                        ))}
                        {imagePreviews.internalImages.length === 0 && (
                            <Typography variant="caption" color="text.secondary">Không có ảnh trong.</Typography>
                        )}
                    </Box>
                </Box>
            </Stack>
            
            {/* 2. THÔNG TIN CƠ BẢN (Đặt sau phần ảnh) */}
            <Stack spacing={1}>
                <Typography variant="body1">
                    <strong>{isBattery ?'Xuất xứ:' : 'Số Km đã đi:'}</strong> {isBattery ? (currentContent as CarPdfContent).origin :(currentContent as CarPdfContent).kilometers }
                </Typography>
                <Typography variant="body1">
                    <strong>Tình trạng:</strong> {currentContent.condition}
                </Typography>
                <Typography variant="body1">
                    <strong>Chính sách bảo hành:</strong> {currentContent.warrantyPolicy}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Số lượng ảnh ngoài:</strong> {imagePreviews.externalImages.length} | <strong>Số lượng ảnh trong:</strong> {imagePreviews.internalImages.length}
                </Typography>
            </Stack>

            <Divider sx={{ my: 2 }}><Chip label="Thông số Kỹ thuật" size="small" /></Divider>
            
            {/* 3. THÔNG SỐ KỸ THUẬT (Giữ nguyên cấu trúc grid) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1 }}>
                {(isBattery ? batteryTechSpecs : carTechSpecs).map((spec, index) => (
                    <Typography key={index} variant="body2">
                        <strong>{spec.label}:</strong> {spec.value || 'N/A'}
                    </Typography>
                ))}
            </Box>
            
        </Box>
    );
};

    // --- RENDER CHÍNH (GIỮ NGUYÊN) ---
    return (
        <React.Fragment>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
                <NoteAddIcon color="primary" sx={{ fontSize: '2.5rem' }} /> 
                <Typography variant="h4" fontWeight="bold">
                    Tạo Bài Đăng Mới
                </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                
                {/* --- A. VÙNG DỮ LIỆU CẦN XUẤT PDF (60%) --- */}
                <Box sx={{ width: { xs: '100%', md: '60%' } }}>
                    <Paper sx={{ p: 3, mb: 3, border: `2px solid ${theme.palette.primary.light}` }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Chi tiết Sản phẩm **({postData.productType === ProductTypeValue.ElectricBattery ? 'PIN': 'XE Ô TÔ/MÁY ĐIỆN'})** (Xuất PDF)
                        </Typography>
                        
                        {/* renderPdfContentFields ĐÃ ĐƯỢC CẬP NHẬT */}
                        {renderPdfContentFields()} 
                    </Paper>

                    {/* ✅ VÙNG XEM TRƯỚC (Nội dung sẽ được chụp để tạo PDF) */}
                    <Card 
                        ref={pdfContentRef} 
                        sx={{ 
                            border: `2px solid ${generatedPdfFile ? theme.palette.success.main : theme.palette.grey[300]}`, 
                            position: 'relative',
                            mt: 3,
                            backgroundColor: 'white' 
                        }}
                    >
                        <Chip 
                            label="XEM TRƯỚC NỘI DUNG PDF" 
                            color="primary" 
                            size="small" 
                            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                        />
                        {/* renderPdfViewContent ĐÃ ĐƯỢC CẬP NHẬT để hiển thị ảnh preview */}
                        {renderPdfViewContent()} 
                    </Card>

                </Box>


                {/* --- B. DỮ LIỆU BÀI ĐĂNG & HÀNH ĐỘNG (40%) (GIỮ NGUYÊN) --- */}
                <Stack sx={{ 
                    width: { xs: '100%', md: '40%' },
                    alignSelf: 'flex-start', 
                }} spacing={3}>

                    {/* DỮ LIỆU BÀI ĐĂNG */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2] }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Thông tin Bài đăng (Không xuất PDF)
                        </Typography>
                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel id="productType-label">Loại Sản phẩm</InputLabel>
                            <Select
                                labelId="productType-label"
                                name="productType"
                                value={postData.productType.toString()} 
                                label="Loại Sản phẩm"
                                onChange={(e) => handleChange(e as { target: { name: string, value: any } })}
                            >
                                <MenuItem value={ProductTypeValue.ElectricCarBattery}>Xe Ô tô điện</MenuItem>
                                <MenuItem value={ProductTypeValue.ElectricScooterBattery}>Xe Máy điện</MenuItem>
                                <MenuItem value={ProductTypeValue.ElectricBattery}>Pin xe điện</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Tiêu đề Bài đăng" name="title" fullWidth margin="normal" size="small"
                            value={postData.title} onChange={handleChange} required
                        />
                        <TextField
                            label="Tên Sản phẩm" name="productName" fullWidth margin="normal" size="small"
                            value={postData.productName} onChange={handleChange} required
                        />
                        <TextField
                            label="Giá bán (VND)" name="price" fullWidth margin="normal" size="small"
                            value={postData.price} onChange={handleChange} required
                            helperText={`Đã nhập: ${postData.price.replace(/\D/g, '')} VND`}
                        />
                        <TextField
                            label="Mô tả thêm" name="description" fullWidth multiline rows={4} margin="normal" size="small"
                            value={postData.description} onChange={handleChange} required
                        />
<Divider sx={{ my: 2 }} />

{/* === 1. ẢNH ĐẠI DIỆN (MAIN IMAGE) === */}
<Box>
    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        📸 Ảnh Đại Diện (Main Image) *
    </Typography>
    <Button
        variant="outlined"
        component="label"
        fullWidth
        startIcon={<CollectionsIcon />} // Cần import CollectionsIcon
        color={postData.mainImage.length > 0 ? 'success' : 'primary'}
        sx={{ height: 40, borderColor: postData.mainImage.length > 0 ? theme.palette.success.main : undefined }}
    >
        {postData.mainImage.length > 0 ? 
            `Đã chọn 1 ảnh: ${postData.mainImage[0].file.name}` : 
            'Chọn ảnh đại diện (Tối đa 1 ảnh)'
        }
        <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const previewUrl = URL.createObjectURL(file);
                    // Cập nhật State postData.mainImage
                    setPostData(prev => ({
                        ...prev,
                        mainImage: [{ file, previewUrl }],
                    }));
                }
            }}
        />
        </Button>
            {/* Hiển thị ảnh xem trước */}
            {postData.mainImage.length > 0 && (
                <Box sx={{ mt: 1, height: 70, width: 70, border: '1px solid #ccc', borderRadius: 1 }}>
                    <img 
                        src={postData.mainImage[0].previewUrl} 
                        alt="Main Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                    />
                </Box>
            )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* === 2. ĐỊA ĐIỂM (3 TRƯỜNG) === */}
            <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    📍 Địa Điểm Giao Dịch *
                </Typography>
    
                {/* 2A. Tỉnh/Thành phố & Quận/Huyện (Dùng Popover) */}
                <Button
                    variant="outlined"
                    onClick={handleLocationOpen}
                    //endIcon={<KeyboardArrowDownIcon />} 
                    fullWidth
                    sx={{ 
                        justifyContent: 'space-between', 
                        pr: 2, 
                        height: 40, // Điều chỉnh kích thước cho phù hợp với TextField
                        mb: 1 
                    }}
                >
                    {postData.location.province 
                        ? `${postData.location.province}${postData.location.district ? ` - ${postData.location.district}` : ''}`
                        : 'Chọn Tỉnh/Thành phố & Quận/Huyện *'}
                </Button>

                {/* 2B. Địa chỉ nhà/Tên đường (Nhập Text) */}
                <TextField
                    label="Địa chỉ nhà/Tên đường (Địa chỉ chi tiết) *"
                    name="location.street"
                    fullWidth
                    value={postData.location.street}
                    // Gọi hàm handleChange đã sửa
                    onChange={(e) => handleChange({ target: { name: 'location.street', value: e.target.value } })} 
                    required
                    size="small"
                />

                <Divider sx={{ my: 2 }} />
                </Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Phương thức bán *
                </Typography>

                <FormControl fullWidth margin="normal" size="small">
                    <InputLabel id="methodSale-label">Hình thức Bán</InputLabel>
                    <Select
                        labelId="methodSale-label" name="methodSale"
                        value={postData.methodSale} label="Hình thức Bán"
                        onChange={(e) => handleChange(e as { target: { name: string, value: any } })}
                        >
                            <MenuItem value={SaleMethodValue.FixedPrice}>Mua ngay</MenuItem>
                            <MenuItem value={SaleMethodValue.Auction}>Đấu giá</MenuItem>
                        </Select>
                </FormControl>
                </Paper>

                    {/* CÁC NÚT HÀNH ĐỘNG */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2] }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Hành động
                        </Typography>

                        {/* NÚT TẠO PDF */}
                        <Button
                            variant="outlined"
                            startIcon={pdfGenerating ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
                            onClick={handleGeneratePdf}
                            disabled={pdfGenerating || isSubmitting}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            {pdfGenerating ? 'Đang tạo PDF...' : 'Tạo Bản Tóm Tắt PDF'}
                        </Button>

                        {/* NÚT XEM TRƯỚC VÀ TẢI XUỐNG */}
                        {generatedPdfFile && (
                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Button
                                    variant="text"
                                    color="secondary"
                                    startIcon={<VisibilityIcon />}
                                    onClick={handleViewPdf}
                                    disabled={isSubmitting}
                                    sx={{ flexGrow: 1 }}
                                >
                                    Xem trước
                                </Button>
                                <Button
                                    variant="text"
                                    color="secondary"
                                    startIcon={<FileDownloadIcon />}
                                    onClick={handleDownloadPdf}
                                    disabled={isSubmitting}
                                    sx={{ flexGrow: 1 }}
                                >
                                    Tải xuống
                                </Button>
                            </Stack>
                        )}

                        {/* XÁC NHẬN VÀ GỬI */}
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                            onClick={handleSubmit}
                            disabled={!generatedPdfFile || isSubmitting}
                            fullWidth
                            size="large"
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Xác nhận & Gửi Bài đăng (Kèm PDF)'}
                        </Button>
                        
                        {/* TRẠNG THÁI PDF */}
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
                            <AttachFileIcon fontSize="small" color="action" />
                            {generatedPdfFile ? (
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <CheckCircleIcon color="success" fontSize="small" />
                                    <Typography variant="caption" color="success.main" fontWeight="bold">
                                        PDF đã tạo: **{generatedPdfFile.name}**
                                    </Typography>
                                </Stack>
                            ) : (
                                <Typography variant="caption" color="error">
                                    Chưa có file PDF (Bắt buộc)
                                </Typography>
                            )}
                        </Stack>
                    </Paper>
                </Stack>
            </Stack>
        </Box>

        
        <LocationPopover
            open={Boolean(locationAnchorEl)}
            handleClose={handleLocationClose}
            anchorEl={locationAnchorEl}
            onSelect={handleLocationSelect}
            // Sử dụng các giá trị đã tra cứu từ useMemo
            currentCity={currentProvince}
            currentDistrict={currentDistrictObj}
        />
        </React.Fragment>
    );
};

export default CreatePostPage;