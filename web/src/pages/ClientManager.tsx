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
import { Plus, Search, Edit2, Phone, MapPin, Trash2 } from 'lucide-react';
import { clientService } from '../services/clientService';
import { AddClientModal } from '../components/clients/AddClientModal';
import type { Client } from '../types';

export const ClientManager = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [globalFilter, setGlobalFilter] = useState(searchParams.get('search') || '');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const fetchClients = async () => {
        try {
            const data = await clientService.getAllClients();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        setGlobalFilter(searchParams.get('search') || '');
    }, [searchParams]);

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingClient(null);
    };

    const handleDelete = async (client: Client) => {
        if (!confirm(`האם את בטוחה שברצונך למחוק את הלקוחה "${client.fullName}"?\nפעולה זו אינה הפיכה!`)) return;

        try {
            await clientService.deleteClient(client.id);
            await fetchClients();
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('שגיאה במחיקת הלקוחה');
        }
    };

    const columnHelper = createColumnHelper<Client>();

    const columns = useMemo(() => [
        columnHelper.accessor('fullName', {
            header: 'שם מלא',
            cell: info => <span className="font-bold text-gray-800">{info.getValue()}</span>,
        }),
        columnHelper.accessor('phone', {
            header: 'טלפון',
            cell: info => (
                <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} />
                    <span dir="ltr">{info.getValue()}</span>
                </div>
            ),
        }),
        columnHelper.accessor('address', {
            header: 'כתובת',
            cell: info => (
                <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} />
                    <span>{info.getValue() || '-'}</span>
                </div>
            ),
        }),
        columnHelper.accessor('measurements', {
            header: 'מדידות',
            cell: info => {
                const m = info.getValue();
                if (!m) return <span className="text-gray-400 text-xs">אין נתונים</span>;
                return (
                    <div className="text-xs text-gray-500">
                        <span>חזה: {m.bust} | </span>
                        <span>מותן: {m.waist} | </span>
                        <span>אגן: {m.hips}</span>
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: 'פעולות',
            cell: info => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(info.row.original)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                        title="ערוך"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(info.row.original)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                        title="מחק לקוח"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        }),
    ], []);

    const table = useReactTable({
        data: clients,
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
                    <h1 className="text-3xl font-serif font-bold text-charcoal">ניהול לקוחות</h1>
                    <p className="text-gray-500 mt-1">מאגר לקוחות ומדידות</p>
                </div>
                <button
                    onClick={() => {
                        setEditingClient(null);
                        setIsAddModalOpen(true);
                    }}
                    className="bg-gold hover:bg-gold-dark text-white px-6 py-3 rounded-xl shadow-lg shadow-gold/20 flex items-center gap-2 transition-all"
                >
                    <Plus size={20} />
                    <span>הוסף לקוחה</span>
                </button>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={globalFilter}
                            onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="חיפוש לפי שם או טלפון..."
                            className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                        />
                    </div>
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
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <span>מציג {table.getRowModel().rows.length} מתוך {clients.length} לקוחות</span>
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

            <AddClientModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                onSuccess={fetchClients}
                initialData={editingClient}
            />
        </div>
    );
};
