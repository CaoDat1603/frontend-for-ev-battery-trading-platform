export interface NotificationResponse {
    notificationId: string;   // Guid
    userId: number;
    title: string;
    message: string;
    source: string;
    url?: string | null;
    createdAt: string;        // DateTimeOffset
    isRead: boolean;
}
