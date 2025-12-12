import { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setMonth, setYear, getYear, getMonth, addMonths, subMonths, addDays, subDays, addWeeks, subWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Rental } from '../types';
import { ChevronRight, ChevronLeft } from 'lucide-react';

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

export interface CalendarEvent {
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
            </div>
        </div>
    );
};

interface RentalCalendarProps {
    events: CalendarEvent[];
}

export const RentalCalendar = ({ events }: RentalCalendarProps) => {
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());

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

    return (
        <div className="h-[calc(100vh-16rem)] bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col" dir="ltr">
            <CustomToolbar
                date={date}
                view={view}
                onNavigate={handleNavigate}
                onView={setView}
            />
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
                toolbar={false}
            />
        </div>
    );
};
