import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus, X, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DrugSearchInput({ onAddDrug, disabled }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [manualInput, setManualInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const searchDrugs = async () => {
      if (query.length < 2) { setSuggestions([]); return; }
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=10`
        );
        const data = await response.json();
        if (data.approximateGroup?.candidate) {
          const drugs = data.approximateGroup.candidate
            .filter(d => d.rxcui && d.name)
            .map((d, i) => ({ rxcui: `${d.rxcui}-${i}`, name: d.name }))
            .slice(0, 8);
          setSuggestions(drugs);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    const debounce = setTimeout(searchDrugs, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (drug) => {
    onAddDrug(drug);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter' && selectedIndex >= 0) { e.preventDefault(); handleSelect(suggestions[selectedIndex]); }
    else if (e.key === 'Escape') { setShowSuggestions(false); setSelectedIndex(-1); }
  };

  const handleManualAdd = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    onAddDrug({ name: trimmed, rxcui: `manual-${Date.now()}` });
    setManualInput('');
  };

  return (
    <div className="space-y-3">
      {/* Manual input row */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type a drug name and press Add (e.g. Aspirin)"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleManualAdd(); }}
          disabled={disabled}
          className="h-12 rounded-xl border-white/30 bg-white/20 text-white 
                     placeholder:text-white/60 focus:bg-white/30 focus:border-white/60"
        />
        <Button
          type="button"
          onClick={handleManualAdd}
          disabled={disabled || !manualInput.trim()}
          className="h-12 px-5 rounded-xl bg-white text-blue-700 font-semibold 
                     hover:bg-blue-50 shrink-0 flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-white/30" />
        <span className="text-white/60 text-xs">or search by name</span>
        <div className="flex-1 h-px bg-white/30" />
      </div>

      {/* Search input with dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search medications (e.g., Aspirin, Lisinopril, Metformin)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setSelectedIndex(-1); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="pl-12 pr-12 h-14 text-lg rounded-2xl border-slate-200 
                       focus:border-blue-500 focus:ring-blue-500/20 
                       bg-white shadow-sm transition-all duration-200
                       placeholder:text-slate-400"
          />
          {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
          )}
          {query && !isLoading && (
            <button
              onClick={() => { setQuery(''); setSuggestions([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            {suggestions.map((drug, index) => (
              <button
                key={drug.rxcui}
                onClick={() => handleSelect(drug)}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center justify-between",
                  "hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0",
                  selectedIndex === index && "bg-blue-50"
                )}
              >
                <div>
                  <p className="font-medium text-slate-900">{drug.name}</p>
                  <p className="text-sm text-slate-500">RxCUI: {drug.rxcui.split('-')[0]}</p>
                </div>
                <Plus className="h-5 w-5 text-blue-500" />
              </button>
            ))}
          </div>
        )}

        {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isLoading && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl p-6 text-center">
            <p className="text-slate-500">No medications found for "{query}"</p>
            <p className="text-sm text-slate-400 mt-1">Try the manual input above</p>
          </div>
        )}
      </div>
    </div>
  );
}
