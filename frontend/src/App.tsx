import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import {Dashboard} from "./pages/Dashboard";
import {CompanyRequests} from "./pages/CompanyRequests";
import {Layout} from "./components/Layout";
import InviteClaim from "./pages/InviteClaim";
import ProtectedRoute from "./components/ProtectedRoute"

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/register" element={<Register/>}/>
                <Route path="/verify/:token" element={<Verify/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/invite/:token" element={<InviteClaim/>}/>
                <Route element={
                    <ProtectedRoute>
                        <Layout/>
                    </ProtectedRoute>
                }>
                    <Route path="/" element={<Dashboard/>}/>
                    <Route path="/company/:slug" element={<CompanyRequests/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}