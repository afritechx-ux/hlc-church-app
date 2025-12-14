export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}

export interface Department {
    id: string;
    name: string;
    description?: string;
}

export interface DepartmentMember {
    id: string;
    department: Department;
    role: string;
}

export interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    departments: DepartmentMember[];
}

export interface EngagementScore {
    attendanceScore: number;
    servingScore: number;
    givingScore: number;
    lastCalculatedAt: string;
}

export interface GivingFund {
    id: string;
    name: string;
    description?: string;
}

export interface Donation {
    id: string;
    amount: string;
    date: string;
    method: string;
    fund: GivingFund;
}

export interface ServiceOccurrence {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    templateId: string;
}

export interface AttendanceRecord {
    id: string;
    checkInTime: string;
    method: string;
    serviceOccurrence: ServiceOccurrence;
}
