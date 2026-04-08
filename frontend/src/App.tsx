import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CompanyRequests from "./pages/CompanyRequests";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute"

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/register" element={<Register/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout><Dashboard/></Layout>
                    </ProtectedRoute>
                }/>
                <Route path="/company/:slug" element={
                    <ProtectedRoute>
                        <Layout><CompanyRequests/></Layout>
                    </ProtectedRoute>
                }/>
            </Routes>
        </BrowserRouter>
    );
}