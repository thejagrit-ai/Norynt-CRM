'use client';
// src/components/atoms/DatePicker.tsx — Global custom calendar popover & date picker.
import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface DatePickerProps {
  value?: string | Date | null; // ISO string 'YYYY-MM-DD' or Date object
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
  size?: 'sm' | 'md' | 'lg';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  label,
  required = false,
  disabled = false,
  error,
  className = '',
  minDate,
  maxDate,
  size = 'md',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const datePickerId = useId();

  // Selected date parsing
  const selectedDate = value ? (typeof value === 'string' ? new Date(value) : value) : null;
  const isValidDate = selectedDate && !isNaN(selectedDate.getTime());

  // View state (Year & Month being browsed)
  const initialYear = isValidDate ? selectedDate.getFullYear() : new Date().getFullYear();
  const initialMonth = isValidDate ? selectedDate.getMonth() : new Date().getMonth();
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const formatDisplay = (d: Date) => {
    const day = d.getDate();
    const month = MONTHS[d.getMonth()].slice(0, 3);
    const year = d.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSelectDay = (day: number) => {
    const chosen = new Date(viewYear, viewMonth, day);
    onChange(formatDateISO(chosen));
    setIsOpen(false);
  };

  const handlePreset = (preset: 'today' | 'tomorrow' | '1week' | '1month' | 'endQuarter') => {
    const now = new Date();
    if (preset === 'today') {
      onChange(formatDateISO(now));
    } else if (preset === 'tomorrow') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      onChange(formatDateISO(d));
    } else if (preset === '1week') {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      onChange(formatDateISO(d));
    } else if (preset === '1month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 1);
      onChange(formatDateISO(d));
    } else if (preset === 'endQuarter') {
      const currentMonth = now.getMonth();
      const endOfQMonth = Math.floor(currentMonth / 3) * 3 + 2;
      const lastDay = new Date(now.getFullYear(), endOfQMonth + 1, 0);
      onChange(formatDateISO(lastDay));
    }
    setIsOpen(false);
  };

  // Calendar Calculation
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const today = new Date();
  const isCurrentMonthView = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const todayDate = today.getDate();

  const sizeStyles = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2 px-3.5 text-xs sm:text-sm',
    lg: 'py-2.5 px-4 text-sm',
  };

  return (
    <div className={`relative flex flex-col gap-1.5 w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={datePickerId}
          className="text-xs font-semibold text-slate-300 flex items-center gap-1 select-none"
        >
          <span>{label}</span>
          {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={datePickerId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`group flex w-full items-center justify-between gap-2 rounded-xl border bg-slate-900/90 text-left transition-all duration-150 select-none shadow-sm focus:outline-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-500'
            : error
            ? 'border-rose-500/80 text-white focus:ring-2 focus:ring-rose-500/20'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 text-white'
            : 'border-slate-700/80 text-white hover:border-slate-600 hover:bg-slate-850/90'
        } ${sizeStyles[size]}`}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
          <CalendarIcon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isValidDate ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
            }`}
          />
          {isValidDate ? (
            <span className="font-medium text-white">{formatDisplay(selectedDate!)}</span>
          ) : (
            <span className="text-slate-500 font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isValidDate && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-3xl border border-slate-700/90 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-2xl animate-fade-in text-slate-100 flex flex-col gap-3">
          {/* Calendar Header: Month + Year Navigator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-white">{MONTHS[viewMonth]}</span>
              <span className="text-sm font-semibold text-slate-400">{viewYear}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-slate-400 uppercase py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous Month trailing days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
              const prevDay = daysInPrevMonth - firstDayOfMonth + idx + 1;
              return (
                <span
                  key={`prev-${idx}`}
                  className="h-8 w-8 flex items-center justify-center text-xs text-slate-600 rounded-xl pointer-events-none select-none"
                >
                  {prevDay}
                </span>
              );
            })}

            {/* Current Month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                isValidDate &&
                selectedDate!.getDate() === day &&
                selectedDate!.getMonth() === viewMonth &&
                selectedDate!.getFullYear() === viewYear;
              const isToday = isCurrentMonthView && todayDate === day;

              return (
                <button
                  key={`cur-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 text-xs rounded-xl flex items-center justify-center transition font-medium select-none relative ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : isToday
                      ? 'bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30 hover:bg-indigo-600 hover:text-white'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handlePreset('today')}
              className="px-2 py-1 text-[11px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePreset('tomorrow')}
              className="px-2 py-1 text-[11px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handlePreset('1week')}
              className="px-2 py-1 text-[11px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              +1 Week
            </button>
            <button
              type="button"
              onClick={() => handlePreset('1month')}
              className="px-2 py-1 text-[11px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              +1 Month
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-rose-400 mt-0.5">{error}</p>}
    </div>
  );
}
