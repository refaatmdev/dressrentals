import { useState, useEffect, useRef } from 'react';
import { Search, Shirt, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dressService } from '../services/dressService';
import { clientService } from '../services/clientService';
import { useAuth } from '../context/AuthContext';
import type { Dress, Client } from '../types';

export const TopBar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ dresses: Dress[], clients: Client[] }>({ dresses: [], clients: [] });
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults({ dresses: [], clients: [] });
                return;
            }

            const [allDresses, allClients] = await Promise.all([
                dressService.getAllDresses(),
                clientService.getAllClients()
            ]);

            const filteredDresses = allDresses.filter(d =>
                d.modelName.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 3);

            const filteredClients = allClients.filter(c =>
                c.fullName.toLowerCase().includes(query.toLowerCase()) ||
                c.phone.includes(query)
            ).slice(0, 3);

            setResults({ dresses: filteredDresses, clients: filteredClients });
            setShowResults(true);
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;
        // Default to inventory search if enter is pressed
        navigate(`/catalog?search=${query}`);
        setShowResults(false);
    };

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-96" ref={searchRef}>
                    <form onSubmit={handleSearchSubmit}>
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => query.length >= 2 && setShowResults(true)}
                            placeholder="חיפוש..."
                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                        />
                    </form>

                    {showResults && (results.dresses.length > 0 || results.clients.length > 0) && (
                        <div className="absolute top-full right-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                            {results.dresses.length > 0 && (
                                <div className="p-2">
                                    <p className="text-xs font-bold text-gray-400 px-2 py-1">שמלות</p>
                                    {results.dresses.map(dress => (
                                        <button
                                            key={dress.id}
                                            onClick={() => {
                                                navigate(`/catalog?search=${dress.modelName}`);
                                                setShowResults(false);
                                                setQuery('');
                                            }}
                                            className="w-full text-right px-2 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                        >
                                            <Shirt size={14} className="text-gold" />
                                            <span className="text-sm text-gray-700">{dress.modelName}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.clients.length > 0 && (
                                <div className="p-2 border-t border-gray-50">
                                    <p className="text-xs font-bold text-gray-400 px-2 py-1">לקוחות</p>
                                    {results.clients.map(client => (
                                        <button
                                            key={client.id}
                                            onClick={() => {
                                                navigate(`/clients?search=${client.fullName}`);
                                                setShowResults(false);
                                                setQuery('');
                                            }}
                                            className="w-full text-right px-2 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                        >
                                            <User size={14} className="text-blue-500" />
                                            <span className="text-sm text-gray-700">{client.fullName}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-bold text-gray-800">{user?.displayName || 'משתמש'}</p>
                        <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'מנהל מערכת' : 'צוות'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gold-light/20 flex items-center justify-center text-gold-dark font-bold border border-gold/20">
                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};
