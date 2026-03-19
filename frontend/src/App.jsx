import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CompanyRequests from "./pages/CompanyRequests";
import Layout from "./components/Layout";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Layout><Dashboard /></Layout>} />
                <Route path="/company/:slug" element={<Layout><CompanyRequests/></Layout>} />
            </Routes>
        </BrowserRouter>
    );
}