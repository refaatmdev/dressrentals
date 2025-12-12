import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const Profile = () => {
    const { user, logout } = useAuth();

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-serif font-bold text-charcoal">פרופיל אישי</h2>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center text-gold-dark text-xl font-bold">
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                    <h3 className="font-bold text-lg">{user?.displayName}</h3>
                    <p className="text-gray-500">{user?.email}</p>
                    <p className="text-sm text-gold-dark font-medium mt-1">
                        {user?.role === 'admin' ? 'מנהל מערכת' : 'צוות'}
                    </p>
                </div>
            </div>

            <button
                onClick={() => logout()}
                className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
                <LogOut size={20} />
                <span>התנתק</span>
            </button>
        </div>
    );
};
