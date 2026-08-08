import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

interface User {
    _id: string,
    name: string,
    email: string
}
interface authContextType {
    user: User | null;
    token: string | null
    isLoading: boolean;
    login: (userData: User, token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const authContext = createContext<authContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser))
            setToken(storedToken)
            api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
        }
        setIsLoading(false);
    }, [])

    const login = (userData: User, newToken: string) => {
        setUser(userData)
        setToken(newToken)
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("token", newToken)
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    }
    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        delete api.defaults.headers.common["Authorization"];
    }
    return <authContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated: !!token }}>
        {children}
    </authContext.Provider>
}

export const useAuth = () => {
     const context=useContext(authContext);
     if(context === undefined){
        throw new Error("useAuth must be used within an AuthProvider");
     }
     return context;
}  




