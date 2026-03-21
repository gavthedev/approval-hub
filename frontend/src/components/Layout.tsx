import {useEffect, useState} from "react";
import client from "../api/client";

export default function Layout({children}: {children: React.ReactNode}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        client.get("/me/").then((res) => setUser(res.data)).catch(console.error);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <div
                className={`${
                    sidebarOpen ? "w-64 p-4" : "w-0 p-0"
                } bg-gray-800 text-white transition-all border-t border-gray-600 duration-300 flex flex-col overflow-hidden`}
            >
                {sidebarOpen && (
                    <>
                        {/* top part of side bar */}
                        <div className="flex-1">
                            <a href="/" className="block mb-4 hover:text-gray-400 font-bold">
                                Approval Hub
                            </a>
                            <nav>
                                <a href="/" className="block py-2 border-t border-gray-600 hover:text-gray-300">
                                    My Companies
                                </a>
                            </nav>
                        </div>

                        {/* bottom part of side bar */}
                        {user && (
                            <div className="border-t border-gray-700 pt-4 pb-2">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div
                                        className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">
                                        {user?.first_name?.[0]}
                                    </div>
                                    <p className="text-sm font-medium">{user.first_name}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-gray-100 p-8">
                <button
                    className="mb-4 text-2xl hover:text-gray-600"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    ☰
                </button>
                {children}
            </div>
        </div>
    );
}
