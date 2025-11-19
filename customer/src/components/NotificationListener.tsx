// Trong file NotificationListener.tsx
import { useEffect, useState, useRef } from "react"; 
import { startSignalRConnection } from "../services/SignalRService";

// Định nghĩa Interface cho thông báo
interface NotificationItem {
    id: number;
    title: string;
    message: string;
    isVisible: boolean; // Trạng thái để kiểm soát việc đóng
    // ... các trường khác từ SignalR data
}

// Giả định file âm thanh
const NOTIFICATION_SOUND_URL = '/sounds/notification_alert.mp3'; 

export const NotificationListener = () => {
    // State quản lý NotificationItem
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    
    // Refs để quản lý ID và Audio Element
    const nextId = useRef(0); 
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Lấy userId từ localStorage
    const userIdStr = localStorage.getItem("userId");
    const userId = userIdStr ? parseInt(userIdStr) : null;
    
    // =======================================================
    // 2. Logic Tắt (Dismiss) Thông báo
    // =======================================================
    const handleDismiss = (idToDismiss: number) => {
        // Đặt isVisible thành false để kích hoạt hiệu ứng đóng
        setNotifications(prev => 
            prev.map(noti => 
                noti.id === idToDismiss ? { ...noti, isVisible: false } : noti
            )
        );
        
        // Xóa hẳn khỏi state sau 0.5s (cho phép animation đóng chạy)
        setTimeout(() => {
            setNotifications(prev => prev.filter(noti => noti.id !== idToDismiss));
        }, 500); 
    };

    // =======================================================
    // 3. Logic Kết nối và Xử lý Thông báo mới
    // =======================================================
    useEffect(() => {
        if (!userId) return;

        // Khởi tạo Audio Element lần đầu tiên
        if (!audioRef.current) {
            audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        }

        startSignalRConnection(userId, (data) => {
            
            // 🔊 PHÁT ÂM THANH
            audioRef.current?.play().catch(error => {
                console.error("Lỗi khi phát âm thanh:", error);
            });
            
            // Tạo đối tượng NotificationItem mới
            const newNoti: NotificationItem = {
                id: nextId.current++,
                title: data.title || "Thông báo mới",
                message: data.message || "Không có nội dung.",
                isVisible: true,
            };
            
            // Cập nhật State
            setNotifications(prev => [newNoti, ...prev]);

            // ⏱️ TỰ ĐỘNG TẮT SAU 5 GIÂY
            setTimeout(() => {
                handleDismiss(newNoti.id);
            }, 10000); 
        });

        // Giữ nguyên: ❌ KHÔNG cleanup (theo yêu cầu của bạn)
    }, [userId]);

    // =======================================================
    // 4. Cấu trúc JSX/CSS để Hiển thị Đẹp và có Nút X
    // =======================================================
    return (
        <div 
            style={{ 
                position: "fixed", 
                bottom: 10, 
                right: 10, 
                zIndex: 1000 // Đảm bảo luôn nằm trên
            }}
        >
            {notifications
                // Lọc để chỉ hiển thị các thông báo đang trong quá trình hiển thị/đóng
                .map((noti) => (
                    <div 
                        key={noti.id} 
                        // CSS cho hộp thông báo
                        style={{
                            backgroundColor: '#fff',
                            borderLeft: '5px solid #007bff',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                            borderRadius: '4px',
                            padding: '15px',
                            marginBottom: '10px',
                            width: '300px',
                            position: 'relative',
                            // Hiệu ứng mờ dần (đóng) và trượt
                            opacity: noti.isVisible ? 1 : 0, 
                            transform: noti.isVisible ? 'translateX(0)' : 'translateX(100%)', 
                            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
                        }}
                    >
                        {/* Nút Đóng (X) */}
                        <button 
                            onClick={() => handleDismiss(noti.id)} 
                            style={{
                                position: 'absolute',
                                top: 5,
                                right: 5,
                                background: 'none',
                                border: 'none',
                                fontSize: '1.2em',
                                cursor: 'pointer',
                                color: '#aaa',
                            }}
                            disabled={!noti.isVisible}
                        >
                            &times;
                        </button>

                        {/* Nội dung Thông báo */}
                        <h4 style={{ margin: '0 0 5px 0', color: '#007bff' }}>
                            🔔 {noti.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9em', color: '#333' }}>
                            {noti.message}
                        </p>
                    </div>
            ))}
        </div>
    );
};