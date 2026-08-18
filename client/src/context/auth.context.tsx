import { createContext, useContext, useEffect, useState } from "react";

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
    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedUser = localStorage.getItem("user");
            const storedToken = localStorage.getItem("token");
            if (storedUser && storedToken && storedToken !== "undefined" && storedToken !== "null") {
                return JSON.parse(storedUser);
            }
        } catch {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        }
        return null;
    });

    const [token, setToken] = useState<string | null>(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken && storedToken !== "undefined" && storedToken !== "null") {
            return storedToken;
        }
        return null;
    });

    const [isLoading] = useState(false);

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
    };

    // Listen for 401 events dispatched by the axios interceptor
    // This gracefully clears the session without a hard page redirect
    useEffect(() => {
        const handleForceLogout = () => logout();
        window.addEventListener('auth:logout', handleForceLogout);
        return () => window.removeEventListener('auth:logout', handleForceLogout);
    }, []);

    const login = (userData: User, newToken: string) => {
        if (!newToken || newToken === "undefined" || newToken === "null") return;
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", newToken);
        setUser(userData);
        setToken(newToken);
    };

    const isAuthenticated = Boolean(token && token !== "undefined" && token !== "null");

    return (
        <authContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated }}>
            {children}
        </authContext.Provider>
    );
};

export const useAuth = () => {
     const context=useContext(authContext);
     if(context === undefined){
        throw new Error("useAuth must be used within an AuthProvider");
     }
     return context;
}  




