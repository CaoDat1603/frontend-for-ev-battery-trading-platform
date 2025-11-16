import React, { createContext, useContext, useEffect, useState } from "react";
import { UserService } from "../services/userService";
import {AdminService} from "../services/adminService";
import type { ProfileStatus } from "../types/enum";

interface AdminContextValue {
    me: any | null;
    setMe: (me: any) => void;
    users: any[];
    loadingMe: boolean;
    loadingUsers: boolean;
    refreshUsers: (status?: ProfileStatus) => Promise<void>;
}
const BASE_URL = "http://localhost:8000";
const AdminContext = createContext<AdminContextValue | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [me, setMe] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingMe, setLoadingMe] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const fetchMe = async () => {
        setLoadingMe(true);
        try {
            const data = await UserService.getProfile();
            const normalized = {
                id: data.id,
                userStatus: data.userStatus,
                ProfileStatus: data.profileStatus,
                fullName: data.userFullName ?? "",
                email: data.email ?? "",
                phone: data.phone ?? "",
                contect: data.contactPhone ?? "",
                address: data.userAddress ?? "",
                userBirthday: data.userBirthday?.split("T")[0] ?? "",
                role: data.role ?? "Admin",
                avatarUrl: (data.avatar ?? "").startsWith("http")
                    ? data.avatar
                    : `${BASE_URL}/identity${data.avatar ?? ""}`,
            };

            setMe(normalized);
        } catch (err) {
            console.error("Error fetching admin profile:", err);
        } finally {
            setLoadingMe(false);
        }
    };

    const refreshUsers = async (status?: ProfileStatus) => {
        setLoadingUsers(true);
        try {
            const data = status
                ? await AdminService.getUsersByStatus(status)
                : await AdminService.searchUsers("");
            console.log("Fetched users:", data); // <-- log
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingUsers(false);
        }
    };


    useEffect(() => {
        fetchMe();
        refreshUsers("Pending");
    }, []);

    return (
        <AdminContext.Provider value={{ me, setMe, users, loadingMe, loadingUsers, refreshUsers }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const ctx = useContext(AdminContext);
    if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
    return ctx;
};
