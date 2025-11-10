import React, { useState, useEffect, useMemo } from 'react';
import { 
    Popover, Box, Typography, List, ListItem, ListItemText, 
    TextField, InputAdornment, Button 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// ✅ CẦN ĐẢM BẢO ĐƯỜNG DẪN NÀY ĐÚNG TRONG DỰ ÁN CỦA BẠN
import { VIETNAM_PROVINCES, type Province, type District } from '../../data/vietnamLocations'; 
// Nếu component này nằm trong src/components, thì đường dẫn là ../data/vietnamLocations

// --- INTERFACES VÀ TYPES ---
// Phải dùng interfaces Province/District đã import từ file data
export interface LocationPopoverProps {
    open: boolean;
    handleClose: () => void;
    anchorEl: HTMLElement | null; 
    // Hàm onSelect sẽ trả về đối tượng Province/District đã chọn
    onSelect: (province: Province | null, district: District | null) => void;
    currentCity: Province | null; // Tên cũ là currentCity, kiểu mới là Province
    currentDistrict: District | null; // Tên cũ là currentDistrict, kiểu mới là District
}

// --- COMPONENT CHÍNH ---
const LocationPopover: React.FC<LocationPopoverProps> = ({ 
    open, handleClose, anchorEl, onSelect, currentCity, currentDistrict 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    // Lưu trữ tỉnh đang được chọn để hiển thị danh sách quận huyện
    const [selectedCity, setSelectedCity] = useState<Province | null>(null);

    // Đồng bộ state nội bộ với prop bên ngoài (khi popover mở lần đầu hoặc khi dữ liệu parent thay đổi)
    useEffect(() => {
        if (open) {
            setSelectedCity(currentCity);
            setSearchTerm('');
        }
    }, [open, currentCity]);

    // Quyết định đang ở chế độ chọn Tỉnh hay Quận/Huyện
    const isSelectingDistrict = !!selectedCity;
    
    // Danh sách dữ liệu hiển thị (Tỉnh hoặc Quận/Huyện)
    const dataList = isSelectingDistrict ? selectedCity.districts : VIETNAM_PROVINCES;

    // Lọc dữ liệu
    const filteredData = useMemo(() => {
        if (!searchTerm) return dataList;
        return dataList.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, dataList]);

    // Xử lý khi nhấn vào một mục trong danh sách
    const handleItemClick = (item: Province | District) => {
        setSearchTerm(''); // Reset tìm kiếm
        if (!isSelectingDistrict) {
            // Đang chọn Tỉnh/Thành phố
            setSelectedCity(item as Province);
        } else {
            // Đang chọn Quận/Huyện
            onSelect(selectedCity, item as District);
            handleClose();
        }
    };
    
    // Nút quay lại/hủy chọn
    const handleBackOrClear = () => {
        if (isSelectingDistrict) {
            setSelectedCity(null); // Quay lại chọn tỉnh
        } else {
            // Hủy chọn hoàn toàn
            onSelect(null, null);
            handleClose();
        }
        setSearchTerm('');
    };

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ style: { minWidth: 300 } }} // Đặt chiều rộng tối thiểu cho Popover
        >
            <Box sx={{ p: 2, minWidth: 300, maxHeight: 400, overflow: 'auto' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    {isSelectingDistrict ? `Chọn Quận/Huyện (${selectedCity?.name})` : 'Chọn Tỉnh/Thành phố'}
                </Typography>
                
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Tìm kiếm địa điểm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 1 }}
                />

                <List dense disablePadding>
                    {filteredData.map((item) => (
                        <ListItem 
                            key={item.id} 
                            onClick={() => handleItemClick(item)}
                            sx={{
                                '&:hover': { backgroundColor: 'action.hover' },
                                // Đánh dấu mục đã chọn
                                backgroundColor: (isSelectingDistrict && currentDistrict?.name === item.name) || (!isSelectingDistrict && currentCity?.name === item.name)
                                    ? 'action.selected' : 'transparent',
                            }}
                        >
                            <ListItemText primary={item.name} />
                        </ListItem>
                    ))}
                    {filteredData.length === 0 && (
                        <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', py: 1 }}>
                            Không tìm thấy kết quả.
                        </Typography>
                    )}
                </List>
                
                <Button 
                    onClick={handleBackOrClear}
                    size="small"
                    fullWidth
                    variant="outlined"
                    color={isSelectingDistrict ? "secondary" : "inherit"}
                    sx={{ mt: 2 }}
                >
                    {isSelectingDistrict ? `Quay lại chọn Tỉnh` : 'Hủy bỏ/Xóa địa điểm'}
                </Button>
            </Box>
        </Popover>
    );
};

export default LocationPopover;