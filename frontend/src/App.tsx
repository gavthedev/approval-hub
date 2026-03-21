import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CompanyRequests from "./pages/CompanyRequests";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute.tsx"

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/company/:slug" element={
                    <ProtectedRoute>
                        <Layout><CompanyRequests /></Layout>
                    </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}