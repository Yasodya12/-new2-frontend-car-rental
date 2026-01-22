
import { jwtDecode } from "jwt-decode"
import type { UserData } from "../Model/userData.ts";
export const isTokenExpired = (token: string) => {
    try {
        const { exp } = jwtDecode(token);
        if (!exp) {
            return true;
        }
        return Date.now() >= exp * 1000;

    } catch (error) {
        console.error(error);
        return true;
    }
}

export const getUserFromToken = (token: string): UserData => {
    const decoded = jwtDecode<any>(token);
    return {
        ...decoded,
        _id: decoded.id
    };
}

