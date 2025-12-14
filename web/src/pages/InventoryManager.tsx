
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper
} from '@tanstack/react-table';
import { Plus, Search, QrCode, Edit2, Eye, ShoppingBag, Trash2, FileMinus, ArchiveRestore } from 'lucide-react';
import { dressService } from '../services/dressService';
import { rentalService } from '../services/rentalService';
import { AddDressModal } from '../components/catalog/AddDressModal';
import { DressDetailsModal } from '../components/catalog/DressDetailsModal';
import { RentDressModal } from '../components/rentals/RentDressModal';
import { QrCodeGenerator } from '../components/catalog/QrCodeGenerator';
import { PrintLabelButton } from '../components/catalog/PrintLabelButton';
import type { Dress } from '../types';

export const InventoryManager = () => {
    const [dresses, setDresses] = useState<Dress[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [globalFilter, setGlobalFilter] = useState(searchParams.get('search') || '');
    const [showArchived, setShowArchived] = useState(false);

    // Modals State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDress, setEditingDress] = useState<Dress | null>(null);
    const [viewingDress, setViewingDress] = useState<Dress | null>(null);
    const [rentingDress, setRentingDress] = useState<Dress | null>(null);
    const [selectedQr, setSelectedQr] = useState<string | null>(null);

    const fetchDresses = async () => {
        try {
            const data = await dressService.getAllDresses();
            setDresses(data);
        } catch (error) {
            console.error('Error fetching dresses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDresses();
    }, []);

    const recalculateCounts = async () => {
        if (!confirm('האם לחשב מחדש את מוני ההשכרות עבור כל השמלות? פעולה זו עשויה לקחת זמן.')) return;
        setLoading(true);
        try {
            const allRentals = await rentalService.getAllRentals();
            const allDresses = await dressService.getAllDresses();

            const counts: Record<string, number> = {};
            allRentals.forEach(r => {
                counts[r.dressId] = (counts[r.dressId] || 0) + 1;
            });

            await Promise.all(allDresses.map(dress => {
                const count = counts[dress.id] || 0;
                if (dress.rentalCount !== count) {
                    return dressService.updateDress(dress.id, { rentalCount: count });
                }
                return Promise.resolve();
            }));

            await fetchDresses();
            alert(`החישוב הסתיים בהצלחה.\nנמצאו ${allRentals.length} השכרות סה"כ.\nעודכנו נתונים עבור ${allDresses.length} שמלות.`);
        } catch (error) {
            console.error('Error recalculating:', error);
            alert('שגיאה בחישוב מחדש: ' + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (dress: Dress) => {
        const action = dress.isArchived ? 'לשחזר' : 'להעביר לארכיון';
        if (!confirm(`האם את בטוחה שברצונך ${action} את השמלה "${dress.modelName}"?`)) return;

        try {
            await dressService.archiveDress(dress.id, !dress.isArchived);
            await fetchDresses();
        } catch (error) {
            console.error('Error archiving dress:', error);
            alert('שגיאה בשינוי סטטוס ארכיון');
        }
    };

    const handleDelete = async (dress: Dress) => {
        if (!confirm(`האם את בטוחה שברצונך למחוק לצמיתות את השמלה "${dress.modelName}"?\nפעולה זו אינה הפיכה!`)) return;

        try {
            await dressService.deleteDress(dress.id);
            await fetchDresses();
        } catch (error) {
            console.error('Error deleting dress:', error);
            alert('שגיאה במחיקת השמלה');
        }
    };

    useEffect(() => {
        setGlobalFilter(searchParams.get('search') || '');
    }, [searchParams]);

    const handleEdit = (dress: Dress) => {
        setEditingDress(dress);
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingDress(null);
    };

    const filteredDresses = useMemo(() => {
        return dresses.filter(dress => showArchived ? dress.isArchived : !dress.isArchived);
    }, [dresses, showArchived]);

    const columnHelper = createColumnHelper<Dress>();

    const columns = useMemo(() => [
        columnHelper.accessor('imageUrl', {
            header: 'תמונה',
            cell: info => (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 cursor-pointer" onClick={() => setViewingDress(info.row.original)}>
                    <img src={info.getValue()} alt="Dress" className="w-full h-full object-cover" />
                </div>
            ),
        }),
        columnHelper.accessor('modelName', {
            header: 'שם הדגם',
            cell: info => <span className="font-bold text-gray-800 cursor-pointer hover:text-gold-dark" onClick={() => setViewingDress(info.row.original)}>{info.getValue()}</span>,
        }),
        columnHelper.accessor('status', {
            header: 'סטטוס',
            cell: info => {
                const status = info.getValue();
                const colors = {
                    available: 'bg-green-100 text-green-700',
                    rented: 'bg-red-100 text-red-700',
                    cleaning: 'bg-blue-100 text-blue-700',
                    repair: 'bg-orange-100 text-orange-700',
                };
                const labels = {
                    available: 'זמינה',
                    rented: 'מושכרת',
                    cleaning: 'בניקוי',
                    repair: 'בתיקון',
                };
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
                        {labels[status]}
                    </span>
                );
            },
        }),
        columnHelper.accessor('rentalPrice', {
            header: 'מחיר השכרה',
            cell: info => <span className="text-gray-900 font-medium">₪{(info.getValue() || 0).toLocaleString()}</span>,
        }),
        columnHelper.accessor('rentalCount', {
            header: 'סה״כ השכרות',
            cell: info => <span className="text-gray-600 font-medium">{info.getValue()}</span>,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'פעולות',
            cell: info => (
                <div className="flex items-center gap-1">
                    {!info.row.original.isArchived && info.row.original.status === 'available' && (
                        <button
                            onClick={() => setRentingDress(info.row.original)}
                            className="p-2 bg-gold/10 hover:bg-gold hover:text-white rounded-lg text-gold transition-all"
                            title="השכר שמלה"
                        >
                            <ShoppingBag size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => setViewingDress(info.row.original)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gold-dark transition-colors"
                        title="צפה בפרטים"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => handleEdit(info.row.original)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                        title="ערוך"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => setSelectedQr(info.row.original.qrCodeValue)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-charcoal transition-colors"
                        title="הצג QR"
                    >
                        <QrCode size={16} />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    <button
                        onClick={() => handleArchive(info.row.original)}
                        className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${info.row.original.isArchived ? 'text-green-600 hover:text-green-700' : 'text-orange-500 hover:text-orange-600'}`}
                        title={info.row.original.isArchived ? 'שחזר מארכיון' : 'העבר לארכיון'}
                    >
                        {info.row.original.isArchived ? <ArchiveRestore size={16} /> : <FileMinus size={16} />}
                    </button>
                    <button
                        onClick={() => handleDelete(info.row.original)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                        title="מחק לצמיתות"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        }),
    ], [showArchived]);

    const table = useReactTable({
        data: filteredDresses,
        columns,
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-charcoal">קטלוג שמלות</h1>
                    <p className="text-gray-500 mt-1">ניהול מלאי ועלויות ייצור</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${showArchived ? 'bg-charcoal text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <FileMinus size={20} />
                        <span>{showArchived ? 'הצג פעילים' : 'ארכיון'}</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingDress(null);
                            setIsAddModalOpen(true);
                        }}
                        className="bg-gold hover:bg-gold-dark text-white px-6 py-3 rounded-xl shadow-lg shadow-gold/20 flex items-center gap-2 transition-all"
                    >
                        <Plus size={20} />
                        <span>הוסף שמלה</span>
                    </button>
                </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={globalFilter}
                            onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="חיפוש לפי שם דגם..."
                            className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                        />
                    </div>
                    <button
                        onClick={recalculateCounts}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gold px-3 py-2 rounded-lg transition-all"
                        title="חשב מחדש מוני השכרות"
                    >
                        <span className="text-xs font-bold">↻</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {table.getRowModel().rows.map(row => (
                                <tr key={row.id} className={`hover:bg-gray-50/50 transition-colors ${row.original.isArchived ? 'bg-gray-50 opacity-60' : ''}`}>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {filteredDresses.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                                        לא נמצאו שמלות {showArchived ? 'בארכיון' : ''}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <span>מציג {table.getRowModel().rows.length} מתוך {filteredDresses.length} שמלות</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                        >
                            הקודם
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                        >
                            הבא
                        </button>
                    </div>
                </div>
            </div>

            <AddDressModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                onSuccess={fetchDresses}
                initialData={editingDress}
            />

            <DressDetailsModal
                dress={viewingDress}
                onClose={() => setViewingDress(null)}
            />

            <RentDressModal
                dress={rentingDress}
                onClose={() => setRentingDress(null)}
                onSuccess={() => {
                    setRentingDress(null);
                    fetchDresses();
                }}
            />

            {/* QR Code Modal */}
            {selectedQr && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedQr(null)}>
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-charcoal">
                            {dresses.find(d => d.qrCodeValue === selectedQr)?.modelName || 'קוד QR'}
                        </h3>
                        <QrCodeGenerator value={selectedQr} size={200} />
                        <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">{selectedQr}</p>
                        <div className="flex justify-center">
                            <PrintLabelButton
                                dressId={selectedQr}
                                dressName={dresses.find(d => d.qrCodeValue === selectedQr)?.modelName || 'קוד QR'}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
