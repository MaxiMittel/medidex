import apiClient from "./apiClient";
import { TokenDto } from "../../types/apiDTOs";

export const login = async (username: string, password: string): Promise<TokenDto> => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("grant_type", "password");
    
    
    try {
        const response = await apiClient.post<TokenDto>("/login", formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        return response.data; 
    } catch (error) {
        console.error("Login failed in authApi:", error);
        throw error; 
    }
}