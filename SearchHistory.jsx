import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function SearchHistory({ searches, onLoadSearch }) {
  if (!searches || searches.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500" />
          Recent Searches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {searches.slice(0, 5).map((search, index) => (
          <motion.button
            key={search.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onLoadSearch(search)}
            className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 
                       border border-slate-200 hover:border-slate-300
                       transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1 mb-1">
                  {search.drugs_checked?.slice(0, 3).map((drug, i) => (
                    <span 
                      key={i}
                      className="text-sm font-medium text-slate-700"
                    >
                      {drug.name}{i < Math.min(search.drugs_checked.length, 3) - 1 && ','}
                    </span>
                  ))}
                  {search.drugs_checked?.length > 3 && (
                    <span className="text-sm text-slate-500">
                      +{search.drugs_checked.length - 3} more
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{format(new Date(search.created_date), 'MMM d, h:mm a')}</span>
                  {search.interactions_found > 0 ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      {search.interactions_found} interaction{search.interactions_found > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      No interactions
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 
                                     group-hover:translate-x-1 transition-all" />
            </div>
          </motion.button>
        ))}
      </CardContent>
    </Card>
  );
}
