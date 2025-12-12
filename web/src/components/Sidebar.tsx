import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Shirt, ShoppingCart, BarChart3, Users, LogOut, Contact, Settings as SettingsIcon,
    Calendar, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    { label: 'לוח בקרה', path: '/', icon: LayoutDashboard },
    { label: 'קטלוג שמלות', path: '/catalog', icon: Shirt },
    { label: 'לקוחות', path: '/clients', icon: Contact },
    { label: 'ניהול השכרות', path: '/rentals', icon: FileText },
    { label: 'לוח שנה', path: '/calendar', icon: Calendar },
    { label: 'קופה', path: '/pos', icon: ShoppingCart },
    { label: 'דוחות', path: '/reports', icon: BarChart3 },
    { label: 'אנליטיקס', path: '/analytics', icon: BarChart3 },
    { label: 'צוות', path: '/staff', icon: Users },
    { label: 'הגדרות אתר', path: '/settings', icon: SettingsIcon },
];

export const Sidebar = () => {
    const { logout } = useAuth();
    return (
        <aside className="w-64 bg-white border-l border-gray-200 h-screen flex flex-col shadow-lg z-20">
            <div className="p-6 flex items-center justify-center border-b border-gray-100">
                <h1 className="text-2xl font-serif font-bold text-gold-dark">Rema Mulla</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-gold text-white shadow-md'
                                : 'text-gray-600 hover:bg-gold-light/10 hover:text-gold-dark'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span className="font-medium">התנתק</span>
                </button>
            </div>
        </aside>
    );
};
