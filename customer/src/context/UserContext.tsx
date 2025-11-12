import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { UserService } from "../services/userService";

const BASE_URL = "http://localhost:8000"; // Cơ sở URL backend
export type ProfileStatus = "Unverified" | "Pending" | "Verified" | "Rejected";
export interface UserProfile {
    userId: number;
    userFullName: string;
    email: string;
    phone: string;
    userAddress: string;
    userBirthday: string;
    contactPhone: string;
    avatar: string;
    avatarUrl?: string; // full URL
    citizenIdCard: string;
    citizenIdCardUrl?: string;
    userStatus: string;
    profileStatus: ProfileStatus;
    rejectionReason: string | null;
}

interface UserContextType {
    user: UserProfile | null;
    setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    refreshUser: () => Promise<void>;
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Chuẩn hóa profile từ backend
    const normalizeProfile = (data: any): UserProfile => ({
        ...data,
        userFullName: data.userFullName ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        userAddress: data.userAddress ?? "",
        userBirthday: data.userBirthday?.split("T")[0] ?? "",
        contactPhone: data.contactPhone ?? "",
        avatar: data.avatar ?? "",
        avatarUrl: (data.avatar ?? "").startsWith("http")
            ? data.avatar
            : `${BASE_URL}/identity${data.avatar ?? ""}`,
        citizenIdCard: data.citizenIdCard ?? "",
        citizenIdCardUrl: (data.citizenIdCard ?? "").startsWith("http")
            ? data.citizenIdCard
            : `${BASE_URL}/identity${data.citizenIdCard ?? ""}`,
        userStatus: data.userStatus ?? "",
        profileStatus: data.profileStatus ?? "Unverified",
        rejectionReason: data.rejectionReason ?? null,
        followers: data.followers ?? 0,
        following: data.following ?? 0,
    });


    const refreshUser = async () => {
        try {
            const data = await UserService.getProfile();
            setUser(normalizeProfile(data));
        } catch (err) {
            console.error("Lỗi load user:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, refreshUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within a UserProvider");
    return ctx;
};
