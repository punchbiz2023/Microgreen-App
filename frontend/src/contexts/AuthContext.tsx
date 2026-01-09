import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

import api from '../services/api';

interface AuthContextType {
    token: string | null;
    user: any | null;
    login: (token: string, username: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<any | null>(null);

    useEffect(() => {
        // Sync with local storage and update API headers
        if (token) {
            localStorage.setItem('token', token);
            // Fetch User Details using centralized API
            api.get('/api/users/me')
                .then(res => {
                    setUser(res.data);
                })
                .catch(err => {
                    console.error("Failed to fetch user", err);
                    // If 401, logout
                    if (err.response && err.response.status === 401) {
                        setToken(null);
                        localStorage.removeItem('token');
                    }
                });
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    const login = (newToken: string, _username: string) => {
        setToken(newToken);
        // User will be fetched by useEffect
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
