import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setMonth, setYear, getYear, getMonth, addMonths, subMonths, addDays, subDays, addWeeks, subWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { rentalService } from '../services/rentalService';
import type { Rental } from '../types';
import { Loader2, ChevronRight, ChevronLeft, Calendar as CalendarIcon, List } from 'lucide-react';

const locales = {
    'he': he,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: Rental;
}

interface CustomToolbarProps {
    date: Date;
    view: View;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', newDate?: Date) => void;
    onView: (view: View) => void;
}

const CustomToolbar = ({ date, view, onNavigate, onView }: CustomToolbarProps) => {
    const goToBack = () => onNavigate('PREV');
    const goToNext = () => onNavigate('NEXT');
    const goToToday = () => onNavigate('TODAY');

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = setMonth(date, parseInt(e.target.value));
        onNavigate('DATE', newDate);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = setYear(date, parseInt(e.target.value));
        onNavigate('DATE', newDate);
    };

    const months = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];

    const currentYear = getYear(new Date());
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {/* Navigation & Date Selectors */}
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-50 rounded-lg p-1">
                    <button onClick={goToNext} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                        <ChevronRight size={20} />
                    </button>
                    <button onClick={goToToday} className="px-4 py-1 text-sm font-bold text-gold-dark hover:bg-white hover:shadow-sm rounded-md transition-all">
                        היום
                    </button>
                    <button onClick={goToBack} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <select
                        value={getMonth(date)}
                        onChange={handleMonthChange}
                        className="bg-gray-50 border-none text-gray-700 font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold/20 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={getYear(date)}
                        onChange={handleYearChange}
                        className="bg-gray-50 border-none text-gray-700 font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold/20 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* View Switcher */}
            <div className="flex bg-gray-50 rounded-lg p-1">
                <button
                    onClick={() => onView('month')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'month' ? 'bg-white shadow-sm text-gold-dark' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    חודש
                </button>
                <button
                    onClick={() => onView('week')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'week' ? 'bg-white shadow-sm text-gold-dark' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    שבוע
                </button>
                <button
                    onClick={() => onView('day')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'day' ? 'bg-white shadow-sm text-gold-dark' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    יום
                </button>
                <button
                    onClick={() => onView('agenda')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'agenda' ? 'bg-white shadow-sm text-gold-dark' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <List size={16} />
                    רשימה
                </button>
            </div>
        </div>
    );
};

const RentalsListView = ({ events }: { events: CalendarEvent[] }) => {
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="p-4">לקוח</th>
                            <th className="p-4">שמלה</th>
                            <th className="p-4">תאריך אירוע</th>
                            <th className="p-4">תאריך החזרה</th>
                            <th className="p-4">עיר</th>
                            <th className="p-4">סטטוס</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedEvents.map((event, index) => {
                            const rental = event.resource;
                            const isEven = index % 2 === 0;

                            return (
                                <tr
                                    key={event.id}
                                    className={`${isEven ? 'bg-white' : 'bg-gold/10'} hover:bg-gold/20 transition-colors`}
                                >
                                    <td className="p-4 font-medium text-gray-800">{rental.clientName}</td>
                                    <td className="p-4 text-gray-600">{rental.dressName}</td>
                                    <td className="p-4 text-gray-600">
                                        {format(event.start, 'dd/MM/yyyy')}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {rental.returnDate ? format(rental.returnDate instanceof Date ? rental.returnDate : (rental.returnDate as any).toDate(), 'dd/MM/yyyy') : '-'}
                                    </td>
                                    <td className="p-4 text-gray-600">{rental.eventCity || '-'}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${rental.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                                rental.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gold/20 text-gold-dark'}`}>
                                            {rental.status === 'completed' ? 'הושלם' :
                                                rental.status === 'cancelled' ? 'בוטל' : 'פעיל'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};



export const Calendar = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        fetchRentals();
    }, []);

    const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', newDate?: Date) => {
        let nextDate = newDate || date;

        if (action === 'TODAY') nextDate = new Date();
        else if (action === 'PREV') {
            if (view === 'month') nextDate = subMonths(date, 1);
            else if (view === 'week') nextDate = subWeeks(date, 1);
            else if (view === 'day') nextDate = subDays(date, 1);
        } else if (action === 'NEXT') {
            if (view === 'month') nextDate = addMonths(date, 1);
            else if (view === 'week') nextDate = addWeeks(date, 1);
            else if (view === 'day') nextDate = addDays(date, 1);
        }

        setDate(nextDate);
    };

    const fetchRentals = async () => {
        try {
            const rentals = await rentalService.getAllRentals();
            const calendarEvents = rentals
                .filter(r => r.eventDate) // Ensure date exists
                .map(rental => {
                    const eventDate = rental.eventDate instanceof Date
                        ? rental.eventDate
                        : (rental.eventDate as any).toDate();

                    const start = new Date(eventDate);
                    // For Agenda view, we want the event to appear on the start date
                    // If we want it to span multiple days, we set end date accordingly
                    const end = rental.returnDate
                        ? (rental.returnDate instanceof Date ? rental.returnDate : (rental.returnDate as any).toDate())
                        : new Date(start.getTime() + (2 * 60 * 60 * 1000));

                    return {
                        id: rental.id,
                        title: `${rental.clientName} - ${rental.dressName}`, // Fallback title
                        start,
                        end,
                        resource: rental
                    };
                });
            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error fetching rentals for calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        const rental = event.resource;
        let backgroundColor = '#D4AF37'; // Gold default

        if (rental.status === 'completed') backgroundColor = '#10B981'; // Green
        if (rental.status === 'cancelled') backgroundColor = '#EF4444'; // Red

        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: '0.85rem',
                padding: '2px 5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-6rem)] p-6 bg-offwhite flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-gold">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-charcoal">לוח השכרות</h1>
                        <p className="text-sm text-gray-500">צפה ונהל את כל האירועים וההשכרות</p>
                    </div>
                </div>

                <div className="flex gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-gray-600">הושלם</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 mx-2"></div>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gold"></span>
                            <span className="text-gray-600">פעיל</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 mx-2"></div>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="text-gray-600">בוטל</span>
                        </div>
                    </div>
                </div>
            </div>

            <CustomToolbar
                date={date}
                view={view}
                onNavigate={handleNavigate}
                onView={setView}
            />

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col" dir="ltr">
                {view === 'agenda' ? (
                    <div className="flex-1 overflow-auto" dir="rtl">
                        <RentalsListView events={events} />
                    </div>
                ) : (
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%', fontFamily: 'Heebo, sans-serif' }}
                        culture="he"
                        messages={{
                            next: "הבא",
                            previous: "הקודם",
                            today: "היום",
                            month: "חודש",
                            week: "שבוע",
                            day: "יום",
                            agenda: "רשימה",
                            date: "תאריך",
                            time: "שעה",
                            event: "אירוע",
                            noEventsInRange: "אין אירועים בטווח זה"
                        }}
                        eventPropGetter={eventStyleGetter}
                        views={['month', 'week', 'day']}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={(newDate) => setDate(newDate)}
                        rtl={true}
                        toolbar={false} // We use our custom toolbar outside
                    />
                )}
            </div>
        </div>
    );
};
