import { useState } from "react";

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
    };

    return (
        <div className="flex min-h-screen">
            <div className={`${sidebarOpen ? "w-64" : "w-0"} bg-gray-800 text-white p-4 transition-all duration-300`}>
                {sidebarOpen && (
                    <>
                        <a href="/" className="block mb-4 hover:text-gray-300">My Companies</a>
                        <button onClick={handleLogout} className="block hover:text-gray-300">Logout</button>
                    </>
                )}
            </div>

            <div className="flex-1 bg-gray-100 p-8">
                <button onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                {children}
            </div>
        </div>
    );
}