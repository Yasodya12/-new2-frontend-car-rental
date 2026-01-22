import { Route, Routes, useNavigate } from "react-router-dom";
import { DefaultLayout } from "./view/common/DefaultLayout/DefaultLayout.tsx";
import { Login } from "./view/page/Login/Login.tsx";
import { Register } from "./view/page/Register/Register.tsx";
import { ForgotPassword } from "./view/page/ForgotPassword/ForgotPassword.tsx";
import { isTokenExpired, getUserFromToken } from "./auth/auth.ts";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCredentials } from "./slices/authSlice.ts";
import type { AppDispatch } from "./store/store.ts";

function App() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token || isTokenExpired(token)) {
            // Only redirect if not already on public routes
            const publicRoutes = ['/login', '/register', '/forgot-password'];
            if (!publicRoutes.includes(window.location.pathname)) {
                alert('You are not logged in. Please log in to continue.');
                navigate('/login');
            }
        } else {
            // Restore state from localStorage
            const userData = getUserFromToken(token);
            const role = localStorage.getItem('role');
            dispatch(setCredentials({
                user: userData,
                role: role || userData.role,
                token: token
            }));
        }
    }, [dispatch, navigate]);

    return (
        <>
            <Routes>
                <Route path="/*" element={<DefaultLayout />}></Route>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />}></Route>
                <Route path="/forgot-password" element={<ForgotPassword />}></Route>
            </Routes>
        </>
    )
}

export default App
