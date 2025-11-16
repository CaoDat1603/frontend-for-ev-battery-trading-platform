// types/profileStatus.ts
export type ProfileStatus = "Unverified" | "Verified" | "Pending" | "Rejected";

// map từ số (backend trả) sang string (frontend hiển thị)
export const ProfileStatusLabel: Record<number, ProfileStatus> = {
    0: "Unverified",
    1: "Verified",
    2: "Pending",
    3: "Rejected",
};
export const UserStatus: Record<number, ProfileStatus> = {
    0: "Unverified",
    1: "Verified",
    2: "Pending",
    3: "Rejected",
};