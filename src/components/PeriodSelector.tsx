import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { usePeriodStore } from '../store/period-store';
import { PeriodPreset } from '../types';
import { formatInputDate } from '../lib/format';

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'this_week', label: 'Esta semana' },
  { key: 'this_month', label: 'Este mês' },
  { key: 'last_3_months', label: 'Últimos 3 meses' },
  { key: 'this_year', label: 'Este ano' },
  { key: 'custom', label: 'Personalizado' },
];

export const PeriodSelector: React.FC = () => {
  const { preset, customFrom, customTo, setPeriod, getRange } = usePeriodStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  const range = getRange();

  const [fromVal, setFromVal] = useState<string>(
    customFrom ? customFrom.split('T')[0] : formatInputDate(range.from)
  );
  const [toVal, setToVal] = useState<string>(
    customTo ? customTo.split('T')[0] : formatInputDate(range.to)
  );

  const handleSelectPreset = (p: PeriodPreset) => {
    if (p === 'custom') {
      setShowCustomModal(true);
      setIsOpen(false);
    } else {
      setPeriod(p);
      setIsOpen(false);
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromVal && toVal) {
      setPeriod('custom', new Date(`${fromVal}T00:00:00`), new Date(`${toVal}T23:59:59`));
      setShowCustomModal(false);
    }
  };

  return (
    <div className="relative inline-block text-left" id="period-selector-container">
      {/* Selector Trigger Button */}
      <button
        id="period-selector-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-border bg-card text-foreground hover:bg-accent transition-colors shadow-xs"
      >
        <CalendarIcon className="w-4 h-4 text-primary" />
        <span>{range.label}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="period-selector-dropdown"
            className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-52 rounded-md shadow-lg bg-card border border-border z-30 py-1"
          >
            <div className="px-3 py-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Selecionar Período
            </div>
            {PRESETS.map((item) => {
              const isSelected = preset === item.key;
              return (
                <button
                  key={item.key}
                  id={`period-option-${item.key}`}
                  type="button"
                  onClick={() => handleSelectPreset(item.key)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-accent/60 transition-colors ${
                    isSelected ? 'text-primary font-medium bg-accent/40' : 'text-foreground'
                  }`}
                >
                  <span>{item.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Custom Period Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-md p-5 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Período Personalizado</h3>
            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={fromVal}
                  onChange={(e) => setFromVal(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={toVal}
                  onChange={(e) => setToVal(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Aplicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
