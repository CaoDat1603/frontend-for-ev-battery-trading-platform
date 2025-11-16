export interface CreateUserDto {
    fullName: string;
    email?: string;
    phoneNumber?: string;
    password: string;
    avatarFile?: File;
}