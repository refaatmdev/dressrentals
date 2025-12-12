import { useState, useEffect, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    createColumnHelper,
    type SortingState
} from '@tanstack/react-table';
import { rentalService } from '../services/rentalService';
import type { Rental } from '../types';
import { Loader2, Plus, Search, MessageCircle, Edit, Calendar as CalendarIcon, List } from 'lucide-react';
import { format } from 'date-fns';
import { AddRentalModal } from '../components/AddRentalModal';
import { RentalCalendar, type CalendarEvent } from '../components/RentalCalendar';

export const RentalsManager = () => {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

    useEffect(() => {
        fetchRentals();
    }, []);

    const fetchRentals = async () => {
        setLoading(true);
        try {
            const data = await rentalService.getAllRentals();
            setRentals(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rental: Rental) => {
        setSelectedRental(rental);
        setIsAddModalOpen(true);
    };

    const handleWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        // Assuming IL country code if missing, but usually we just use the number
        // If it starts with 0, replace with 972
        let formattedPhone = cleanPhone;
        if (cleanPhone.startsWith('0')) {
            formattedPhone = '972' + cleanPhone.substring(1);
        }
        window.open(`https://wa.me/${formattedPhone}`, '_blank');
    };

    const handleModalClose = () => {
        setIsAddModalOpen(false);
        setSelectedRental(null);
    };

    const calendarEvents: CalendarEvent[] = useMemo(() => {
        return rentals
            .filter(r => r.eventDate)
            .map(rental => {
                const eventDate = rental.eventDate instanceof Date
                    ? rental.eventDate
                    : (rental.eventDate as any).toDate();

                const start = new Date(eventDate);
                const end = rental.returnDate
                    ? (rental.returnDate instanceof Date ? rental.returnDate : (rental.returnDate as any).toDate())
                    : new Date(start.getTime() + (2 * 60 * 60 * 1000));

                return {
                    id: rental.id,
                    title: `${rental.clientName} - ${rental.dressName}`,
                    start,
                    end,
                    resource: rental
                };
            });
    }, [rentals]);

    const columnHelper = createColumnHelper<Rental>();

    const columns = useMemo(() => [
        columnHelper.accessor('status', {
            header: 'סטטוס',
            cell: info => {
                const status = info.getValue();
                const colors = {
                    active: 'bg-gold/20 text-gold-dark',
                    completed: 'bg-emerald-100 text-emerald-800',
                    cancelled: 'bg-red-100 text-red-800',
                    pending: 'bg-orange-100 text-orange-800'
                };
                const labels = {
                    active: 'פעיל',
                    completed: 'הושלם',
                    cancelled: 'בוטל',
                    pending: 'ממתין'
                };
                return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100'}`}>
                        {labels[status as keyof typeof labels] || status}
                    </span>
                );
            }
        }),
        columnHelper.accessor('dressName', {
            header: 'שמלה',
            cell: info => <span className="font-medium text-gray-800">{info.getValue()}</span>
        }),
        columnHelper.accessor('clientName', {
            header: 'לקוח',
            cell: info => (
                <div>
                    <div className="font-medium text-gray-800">{info.getValue()}</div>
                    <div className="text-xs text-gray-500">{info.row.original.clientPhone}</div>
                </div>
            )
        }),
        columnHelper.accessor('eventDate', {
            header: 'תאריך אירוע',
            cell: info => {
                const date = info.getValue();
                return date ? format(date instanceof Date ? date : (date as any).toDate(), 'dd/MM/yyyy') : '-';
            }
        }),
        columnHelper.accessor('returnDate', {
            header: 'תאריך החזרה',
            cell: info => {
                const date = info.getValue();
                return date ? format(date instanceof Date ? date : (date as any).toDate(), 'dd/MM/yyyy') : '-';
            }
        }),
        columnHelper.accessor('finalPrice', {
            header: 'תשלום',
            cell: info => {
                const total = info.getValue();
                const paid = info.row.original.paidAmount || 0;
                const balance = total - paid;

                return (
                    <div className="text-sm">
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">סה"כ:</span>
                            <span className="font-medium">₪{total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">שולם:</span>
                            <span className="text-emerald-600">₪{paid.toLocaleString()}</span>
                        </div>
                        {balance > 0 && (
                            <div className="flex justify-between gap-2 text-red-600 font-bold mt-1 border-t border-red-100 pt-1">
                                <span>יתרה:</span>
                                <span>₪{balance.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                );
            }
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: info => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleWhatsApp(info.row.original.clientPhone)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                        title="WhatsApp"
                    >
                        <MessageCircle size={18} />
                    </button>
                    <button
                        onClick={() => handleEdit(info.row.original)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                        title="ערוך"
                    >
                        <Edit size={18} />
                    </button>
                </div>
            )
        })
    ], []);

    const table = useReactTable({
        data: rentals,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-charcoal mb-2">ניהול השכרות</h1>
                    <p className="text-gray-500">צפה ונהל את כל חוזי ההשכרה</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm flex">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'table'
                                    ? 'bg-gold text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <List size={18} />
                            טבלה
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'calendar'
                                    ? 'bg-gold text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <CalendarIcon size={18} />
                            לוח שנה
                        </button>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-gold text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-gold/20 hover:bg-gold-dark transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        השכרה חדשה
                    </button>
                </div>
            </div>

            {viewMode === 'table' ? (
                <>
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="חיפוש לפי שם לקוח, טלפון או שמלה..."
                                className="w-full pl-4 pr-10 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-gold/20"
                                value={globalFilter}
                                onChange={e => setGlobalFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <th key={header.id} className="p-4 font-bold text-sm">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {table.getRowModel().rows.map(row => (
                                        <tr key={row.id} className="hover:bg-gold/5 transition-colors">
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id} className="p-4 align-top">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {rentals.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                לא נמצאו השכרות
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <RentalCalendar events={calendarEvents} />
            )}

            <AddRentalModal
                isOpen={isAddModalOpen}
                onClose={handleModalClose}
                onSuccess={fetchRentals}
                initialData={selectedRental}
            />
        </div>
    );
};
