import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Lock, Mail, Loader2 } from 'lucide-react';

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            setError('שגיאה בהתחברות. אנא בדוק את הפרטים ונסה שוב.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-sm space-y-12 animate-fade-in-up">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gold rounded-full mx-auto flex items-center justify-center shadow-lg shadow-gold/30 mb-6">
                        <span className="text-3xl font-serif font-bold text-white">RM</span>
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-charcoal tracking-tight">Rema Mulla</h1>
                    <p className="text-gray-400 font-light tracking-wide uppercase text-sm">Staff Access</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gold transition-colors" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pr-12 pl-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all text-right placeholder-gray-400 font-medium"
                                placeholder="אימייל"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gold transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pr-12 pl-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all text-right placeholder-gray-400 font-medium"
                                placeholder="סיסמה"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-charcoal hover:bg-black text-white py-4 rounded-2xl font-bold shadow-xl shadow-charcoal/20 transition-all flex items-center justify-center gap-3 disabled:opacity-70 active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <span>התחבר למערכת</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
