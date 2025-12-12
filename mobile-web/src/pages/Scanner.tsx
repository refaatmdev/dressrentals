import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import { dressService } from '../services/dressService';
import { ScanLine, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Scanner = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleScan = async (result: string) => {
        if (!result) return;

        setLoading(true);
        setError('');

        try {
            // Try to find dress by ID directly first (if QR contains ID)
            let dress = await dressService.getDress(result);

            // If not found by ID, try looking up by QR value field
            if (!dress) {
                dress = await dressService.getDressByQr(result);
            }

            if (dress) {
                // Check debounce (60 seconds)
                const lastScanKey = `last_scan_${dress.id}`;
                const lastScanTime = localStorage.getItem(lastScanKey);
                const now = Date.now();

                if (!lastScanTime || now - parseInt(lastScanTime) > 60000) {
                    // Record scan
                    // Pass the current user's ID (staff ID)
                    dressService.recordScan(dress.id, dress.modelName, user?.uid).catch(console.error);
                    localStorage.setItem(lastScanKey, now.toString());
                    localStorage.setItem(lastScanKey, now.toString());
                }

                navigate(`/dress/${dress.id}`);
            } else {
                setError('לא נמצאה שמלה עם הקוד הזה');
            }
        } catch (err) {
            console.error('Scan error:', err);
            setError('שגיאה בסריקה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-serif font-bold mb-2">סריקת שמלה</h1>
                <p className="text-gray-400 text-sm">סרקי את הברקוד המצורף לשמלה</p>
            </div>

            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden rounded-3xl mx-4 mb-4 border border-white/10 shadow-2xl shadow-gold/5">
                <div className="w-full h-full absolute inset-0">
                    <QrScanner
                        onScan={(result) => {
                            if (result && result.length > 0) {
                                handleScan(result[0].rawValue);
                            }
                        }}
                        onError={(error) => console.error(error)}
                        styles={{
                            container: { width: '100%', height: '100%' },
                            video: { width: '100%', height: '100%', objectFit: 'cover' }
                        }}
                        components={{
                            onOff: true,
                            torch: true,
                            zoom: true,
                            finder: true
                        }}
                    />
                </div>

                {/* Overlay UI */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-64 h-64 border-2 border-gold/50 rounded-3xl relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-gold -mt-1 -ml-1 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-gold -mt-1 -mr-1 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-gold -mb-1 -ml-1 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-gold -mb-1 -mr-1 rounded-br-xl"></div>

                        <div className="absolute inset-0 flex items-center justify-center animate-pulse opacity-50">
                            <ScanLine size={48} className="text-gold" />
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                        <Loader2 className="animate-spin text-gold mb-4" size={48} />
                        <p className="font-bold text-lg">מחפש שמלה...</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mx-4 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 animate-fade-in-up">
                    <AlertCircle size={24} />
                    <span className="font-medium">{error}</span>
                </div>
            )}
        </div>
    );
};
