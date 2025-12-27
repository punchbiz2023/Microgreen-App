import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

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
        // Sync with local storage
        if (token) {
            localStorage.setItem('token', token);
            // Set global header
            // @ts-ignore
            import('axios').then(axios => {
                axios.default.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                // Fetch User Details
                axios.default.get('http://localhost:8000/api/users/me')
                    .then(res => {
                        setUser(res.data);
                    })
                    .catch(err => {
                        console.error("Failed to fetch user", err);
                        // If 401, maybe logout?
                        if (err.response && err.response.status === 401) {
                            setToken(null);
                        }
                    });
            });
        } else {
            localStorage.removeItem('token');
            setUser(null);
            // Remove global header
            // @ts-ignore
            import('axios').then(axios => {
                delete axios.default.defaults.headers.common['Authorization'];
            });
        }
    }, [token]);

    const login = (newToken: string, username: string) => {
        setToken(newToken);
        // User will be fetched by useEffect, but we can set temp user
        // setUser({ username }); 
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
