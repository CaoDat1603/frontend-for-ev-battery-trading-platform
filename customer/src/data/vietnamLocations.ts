// src/data/vietnamLocations.ts

export interface District {
    id: number;
    name: string;
}

export interface Province {
    id: number;
    name: string;
    districts: District[];
}

export const VIETNAM_PROVINCES: Province[] = [
    {
        id: 1,
        name: 'Hồ Chí Minh',
        districts: [
            { id: 101, name: 'Quận 1' },
            { id: 102, name: 'Quận 3' },
            { id: 103, name: 'Quận 5' },
            { id: 104, name: 'Quận Bình Thạnh' },
            { id: 105, name: 'Thành phố Thủ Đức' },
        ],
    },
    {
        id: 2,
        name: 'Hà Nội',
        districts: [
            { id: 201, name: 'Quận Ba Đình' },
            { id: 202, name: 'Quận Hoàn Kiếm' },
            { id: 203, name: 'Quận Cầu Giấy' },
            { id: 204, name: 'Quận Hà Đông' },
        ],
    },
    {
        id: 3,
        name: 'Đà Nẵng',
        districts: [
            { id: 301, name: 'Quận Hải Châu' },
            { id: 302, name: 'Quận Thanh Khê' },
            { id: 303, name: 'Quận Sơn Trà' },
        ],
    },
    // Trong môi trường thực tế, bạn sẽ có TẤT CẢ 63 Tỉnh/Thành phố ở đây
];