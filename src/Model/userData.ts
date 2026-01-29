export interface UserData {
    _id?: string
    name: string,
    email: string,
    password: string
    role: string
    profileImage?: string | null | undefined
    nic?: string
    contactNumber?: string
    dateOfBirth?: string | Date | null
    gender?: string | null
    averageRating?: number
    totalRatings?: number
    experience?: number
    provincesVisited?: { province: string; count: number }[]
    isAvailable?: boolean
    isApproved?: boolean
    location?: {
        lat?: number
        lng?: number
        address?: string
    }
    routeTripCount?: number;
}