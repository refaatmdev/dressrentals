import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Lock, Mail, Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const from = location.state?.from?.pathname || '/';

    // Fetch Logo
    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const docRef = doc(db, 'settings', 'global');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setLogoUrl(docSnap.data().logoUrl);
                }
            } catch (error) {
                console.error("Error fetching logo:", error);
            }
        };
        fetchLogo();
    }, []);

    // Redirect if user is already logged in (or becomes logged in)
    useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Navigation is handled by useEffect when user state updates
        } catch (err: any) {
            console.error('Login error:', err);
            setError('שגיאה בהתחברות. אנא בדוק את הפרטים ונסה שוב.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-offwhite relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-gold/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-gold-dark/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md p-8 glass rounded-2xl relative z-10 mx-4">
                <div className="text-center mb-8 flex flex-col items-center">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Rema Mulla Logo" className="יh-28 object-contain " />
                    ) : (
                        <h1 className="text-4xl font-serif font-bold text-charcoal mb-2">Rema Mulla</h1>
                    )}
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">אימייל</label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pr-10 pl-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">סיסמה</label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pr-10 pl-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gold hover:bg-gold-dark text-white font-bold rounded-xl shadow-lg shadow-gold/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                מתחבר...
                            </>
                        ) : (
                            'התחבר למערכת'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
