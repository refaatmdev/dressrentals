import { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
    isWithinInterval
} from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface DressAvailabilityCalendarProps {
    occupiedRanges: { start: Date; end: Date }[];
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
}

export const DressAvailabilityCalendar = ({
    occupiedRanges,
    selectedDate,
    onSelectDate
}: DressAvailabilityCalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronRight size={20} />
                </button>
                <span className="font-bold text-lg">
                    {format(currentMonth, 'MMMM yyyy', { locale: he })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={20} />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const startDate = startOfWeek(currentMonth, { locale: he }); // Starts on Sunday

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                    {format(addDays(startDate, i), 'EEEE', { locale: he }).substring(0, 1)}
                </div>
            );
        }
        return <div className="grid grid-cols-7 mb-2">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: he });
        const endDate = endOfWeek(monthEnd, { locale: he });

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;

                // Check availability
                const isOccupied = occupiedRanges.some(range =>
                    isWithinInterval(cloneDay, { start: range.start, end: range.end })
                );

                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isCurrentMonth = isSameMonth(day, monthStart);

                days.push(
                    <div
                        key={day.toString()}
                        className={`
                            relative h-10 flex items-center justify-center rounded-lg text-sm cursor-pointer transition-all
                            ${!isCurrentMonth ? 'text-gray-300' : ''}
                            ${isOccupied ? 'bg-red-50 text-red-400 cursor-not-allowed' : 'hover:bg-gold/10'}
                            ${isSelected ? 'bg-gold text-white font-bold shadow-md hover:bg-gold-dark' : ''}
                        `}
                        onClick={() => {
                            if (!isOccupied) {
                                onSelectDate(cloneDay);
                            }
                        }}
                    >
                        <span>{formattedDate}</span>
                        {isOccupied && (
                            <span className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full"></span>
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 justify-center">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gold"></div>
                    <span>נבחר</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span>תפוס</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full border border-gray-300"></div>
                    <span>פנוי</span>
                </div>
            </div>
        </div>
    );
};
