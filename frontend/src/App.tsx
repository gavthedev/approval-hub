import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import {Dashboard} from "./pages/Dashboard";
import Home from "./pages/Home";
import {Layout} from "./components/Layout";
import CompanyRequests from "./pages/CompanyRequests";
import InviteClaim from "./pages/InviteClaim";
import ProtectedRoute from "./components/ProtectedRoute";
import CompanySettings from "./pages/CompanySettings";
import NewRequest from "./pages/NewRequest";
import RequestDetail from "./pages/RequestDetail";

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
                    <Route path="/" element={<Home/>}/>
                    <Route path="/companies" element={<Dashboard/>}/>
                    <Route path="/company/:slug" element={<CompanyRequests/>}/>
                    <Route path="/company/:slug/settings" element={<CompanySettings/>}/>
                    <Route path="/company/:slug/new-request/:ticketTypeId" element={<NewRequest/>}/>
                    <Route path="/company/:slug/requests/:id" element={<RequestDetail/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}