import React from 'react';
import { Button } from "@/components/ui/button";
import { X, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SelectedDrugsList({ drugs, onRemove }) {
  if (drugs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 
                        flex items-center justify-center">
          <Pill className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">No medications selected</p>
        <p className="text-sm text-slate-400 mt-1">
          Search and add at least 2 medications to check for interactions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Selected Medications ({drugs.length})
        </h3>
        {drugs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => drugs.forEach(d => onRemove(d.rxcui))}
            className="text-slate-500 hover:text-red-600 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {drugs.map((drug) => (
            <motion.div
              key={drug.rxcui}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group flex items-center gap-2 px-4 py-2.5 
                         bg-gradient-to-r from-blue-50 to-indigo-50 
                         border border-blue-200 rounded-xl
                         hover:border-blue-300 transition-all duration-200"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-medium text-slate-800">{drug.name}</span>
              <button
                onClick={() => onRemove(drug.rxcui)}
                className="p-1 rounded-full hover:bg-blue-200/50 
                           transition-colors ml-1"
              >
                <X className="h-4 w-4 text-slate-500 group-hover:text-red-500" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {drugs.length === 1 && (
        <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
          Add at least one more medication to check for interactions
        </p>
      )}
    </div>
  );
}
