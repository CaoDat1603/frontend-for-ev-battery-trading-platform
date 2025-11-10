import React, { useState, useEffect, useMemo } from 'react';
import { 
    Popover, Box, Typography, List, ListItem, ListItemText, 
    TextField, InputAdornment, Button 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// ✅ CẦN ĐẢM BẢO ĐƯỜNG DẪN NÀY ĐÚNG TRONG DỰ ÁN CỦA BẠN
import { VIETNAM_PROVINCES, type Province, type District } from '../../data/vietnamLocations'; 

// --- INTERFACES VÀ TYPES ---

export interface AllDistrictOption extends District {
    isAllDistrict: true;
}

type DisplayItem = Province | District | AllDistrictOption;

// Hằng số cho lựa chọn "Tất cả Quận/Huyện" (tìm kiếm trong toàn tỉnh đó)
const ALL_DISTRICT_OPTION: AllDistrictOption = {
    id: -1 as any, 
    name: 'Tất cả Quận/Huyện',
    isAllDistrict: true,
};

// HẰNG SỐ MỚI: Cho phép CHỌN TỈNH/THÀNH PHỐ và thoát khỏi Popover ngay lập tức
const SELECT_CITY_ONLY_OPTION: AllDistrictOption = {
    id: -2 as any, // ID duy nhất khác với ALL_DISTRICT_OPTION
    name: '✅ Chọn Tỉnh/Thành phố này', 
    isAllDistrict: true, 
} as any; 

export interface LocationPopoverProps {
    open: boolean;
    handleClose: () => void;
    anchorEl: HTMLElement | null; 
    // Hàm onSelect: trả về Tỉnh (hoặc null cho Toàn quốc) và Quận/Huyện (hoặc null cho Tất cả Districts)
    onSelect: (province: Province | null, district: District | null) => void;
    currentCity: Province | null; 
    currentDistrict: District | null; 
    initialLocations: Province[]; 
}

// --- COMPONENT CHÍNH: LocationPropsPopover ---
const LocationPropsPopover: React.FC<LocationPopoverProps> = ({ 
    open, handleClose, anchorEl, onSelect, currentCity, currentDistrict, 
    initialLocations 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState<Province | null>(null);

    // Đồng bộ state nội bộ với prop bên ngoài
    useEffect(() => {
        if (open) {
            setSelectedCity(currentCity); 
            setSearchTerm('');
        }
    }, [open, currentCity]);

    // Quyết định đang ở chế độ chọn Tỉnh hay Quận/Huyện
    const isSelectingDistrict = !!selectedCity && selectedCity.districts.length > 0;
    
    // --- Logic tạo danh sách dữ liệu (Đã thêm SELECT_CITY_ONLY_OPTION) ---
    const dataList = useMemo((): DisplayItem[] => {
        if (!isSelectingDistrict) {
            // Trường hợp 1: Đang chọn Tỉnh/Thành phố
            return initialLocations;
        }
        
        if (selectedCity && selectedCity.districts) {
            // Trường hợp 2: Đang chọn Quận/Huyện
            // Chèn mục "Chọn Tỉnh này" và "Tất cả Quận/Huyện" vào đầu
            return [SELECT_CITY_ONLY_OPTION, ALL_DISTRICT_OPTION, ...selectedCity.districts];
        }
        return [];
    }, [isSelectingDistrict, selectedCity, initialLocations]);

    // Lọc dữ liệu
    const filteredData = useMemo((): DisplayItem[] => {
        if (!searchTerm) return dataList;
        return dataList.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, dataList]);

    // --- LOGIC QUAN TRỌNG: Xử lý khi nhấn vào một mục trong danh sách (Đã sửa) ---
    const handleItemClick = (item: DisplayItem) => {
        setSearchTerm(''); 
        
        if (!isSelectingDistrict) {
            // Trường hợp 1: Đang chọn Tỉnh/Thành phố
            
            if (item.id === 0) { // Toàn quốc (Giả sử id: 0)
                 onSelect(item as Province, null); 
                 handleClose();
            } else {
                // Chọn Tỉnh cụ thể, chuyển sang chế độ chọn Quận/Huyện
                setSelectedCity(item as Province);
            }
        } else {
            // Trường hợp 2: Đang chọn Quận/Huyện
            
            // 🛑 LOGIC MỚI: Nếu chọn "Chọn Tỉnh/Thành phố này"
            if (item.id === SELECT_CITY_ONLY_OPTION.id) {
                // onSelect(Tỉnh đang chọn, null) -> Lựa chọn Tỉnh mà không chọn Quận/Huyện cụ thể
                onSelect(selectedCity, null); 
                handleClose();
                return;
            }

            // Logic cho "Tất cả Quận/Huyện" hoặc Quận/Huyện cụ thể
            if ((item as AllDistrictOption).isAllDistrict) {
                // Xử lý ALL_DISTRICT_OPTION (-1)
                onSelect(selectedCity, null); 
            } else {
                // Chọn Quận/Huyện cụ thể
                onSelect(selectedCity, item as District);
            }
            handleClose();
        }
    };
    
    // Nút quay lại/hủy chọn
    const handleBackOrClear = () => {
        setSearchTerm('');
        if (isSelectingDistrict) {
            setSelectedCity(null); // Quay lại chọn tỉnh
        } else {
            // Hủy chọn hoàn toàn (thiết lập về Toàn quốc/null)
            onSelect(null, null); 
            handleClose();
        }
    };

    // Hàm kiểm tra mục đã chọn (để highlight)
    const isItemSelected = (item: DisplayItem) => {
        // Kiểm tra Tỉnh đang chọn (hoặc Toàn quốc nếu currentCity là null)
        if (!isSelectingDistrict) {
            return currentCity?.id === item.id || (currentCity === null && item.id === 0);
        } 
        
        // Kiểm tra Quận/Huyện đang chọn
        else {
            // Kiểm tra "Chọn Tỉnh này" và "Tất cả Quận/Huyện" (Khi currentDistrict là null)
            if (currentDistrict === null) {
                 return currentCity?.id === selectedCity?.id && 
                        (item.id === ALL_DISTRICT_OPTION.id || item.id === SELECT_CITY_ONLY_OPTION.id);
            }
            
            // Kiểm tra Quận/Huyện cụ thể
            return currentDistrict?.id === item.id;
        }
    }

    // --- RENDER POPVER ---
    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ style: { minWidth: 300 } }} 
        >
            <Box sx={{ p: 2, minWidth: 300, maxHeight: 400, overflow: 'auto' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    {isSelectingDistrict 
                        ? `Chọn Quận/Huyện (${selectedCity?.name})` 
                        : 'Chọn Tỉnh/Thành phố'}
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
                                backgroundColor: isItemSelected(item) 
                                    ? 'action.selected' 
                                    : 'transparent',
                                // In đậm mục đặc biệt
                                fontWeight: (item.id === ALL_DISTRICT_OPTION.id || item.id === SELECT_CITY_ONLY_OPTION.id) 
                                    ? 'bold' : 'normal'
                            }}
                        >
                            <ListItemText 
                                primary={item.name} 
                                primaryTypographyProps={{ 
                                    fontWeight: (item.id === ALL_DISTRICT_OPTION.id || item.id === SELECT_CITY_ONLY_OPTION.id) 
                                        ? 'bold' : 'normal'
                                }}
                            />
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

export default LocationPropsPopover;