import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

export const startSignalRConnection = (userId: number, onReceive: (data: any) => void) => {
    if (connection) return connection; // tránh tạo lại connection

    connection = new signalR.HubConnectionBuilder()
    .withUrl(`http://localhost:8107/hubs/notifications?userId=${userId}`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect()
    .build();


    connection.on("ReceiveNotification", (data) => {
        console.log("📩 Realtime notification:", data);
        onReceive(data);
    });

    connection.start()
        .then(() => console.log("SignalR connected"))
        .catch(err => console.error("SignalR connection error:", err));

    return connection;
};

export const stopSignalRConnection = () => {
    if (connection) {
        connection.stop();
        connection = null;
    }
};
