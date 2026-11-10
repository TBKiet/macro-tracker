'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const formattedDate = format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi });
  // Capitalize first letter
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex items-center justify-between bg-[#13131a] border border-[#27272f] rounded-xl px-4 py-3">
      <button
        onClick={() => onDateChange(subDays(selectedDate, 1))}
        className="p-2 rounded-lg hover:bg-[#1e1e2a] text-[#71717a] hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[#a3e635]" />
        <span className="font-medium text-white">{displayDate}</span>
        {isToday(selectedDate) && (
          <span className="text-xs bg-[#a3e635]/10 text-[#a3e635] px-2 py-0.5 rounded-full">
            Hôm nay
          </span>
        )}
      </div>

      <button
        onClick={() => onDateChange(addDays(selectedDate, 1))}
        className={cn(
          "p-2 rounded-lg transition-colors",
          isToday(selectedDate)
            ? "text-[#27272f] cursor-not-allowed"
            : "hover:bg-[#1e1e2a] text-[#71717a] hover:text-white"
        )}
        disabled={isToday(selectedDate)}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
