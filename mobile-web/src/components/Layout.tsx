import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Grid, ScanLine, User } from 'lucide-react';

export const Layout = () => {
    const location = useLocation();

    const NAV_ITEMS = [
        { path: '/', icon: Home, label: 'בית' },
        { path: '/gallery', icon: Grid, label: 'גלריה' },
        { path: '/scanner', icon: ScanLine, label: 'סריקה' },
        { path: '/profile', icon: User, label: 'פרופיל' },
    ];

    return (
        <div className="min-h-screen bg-offwhite flex flex-col">
            <main className="flex-1 overflow-y-auto pb-24">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-gold-dark' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-gold/10' : 'bg-transparent'
                                    }`}>
                                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};
