import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import SeverityBadge, { SeverityCard } from './SeverityBadge';
import { motion, AnimatePresence } from "framer-motion";
import { useState } from 'react';

function InteractionCard({ interaction, index }) {

  const severity = interaction.severity || 'low';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <SeverityCard severity={severity}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-bold text-slate-900">
                  {interaction.drug1}
                </span>
                <span className="text-slate-500">↔</span>
                <span className="font-bold text-slate-900">
                  {interaction.drug2}
                </span>
              </div>
              <SeverityBadge severity={severity} size="sm" />
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed">
            {interaction.description}
          </p>

          {(interaction.mechanism || interaction.effects || interaction.management || interaction.onset) && (
            <div className="mt-3 space-y-2">
              {interaction.mechanism && (
                <div className="p-3 bg-white/60 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mechanism</p>
                  <p className="text-sm text-slate-700">{interaction.mechanism}</p>
                </div>
              )}
              {interaction.effects && (
                <div className="p-3 bg-white/60 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Clinical Effects</p>
                  <p className="text-sm text-slate-700">{interaction.effects}</p>
                </div>
              )}
              {interaction.management && (
                <div className="p-3 bg-white/60 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Management</p>
                  <p className="text-sm text-slate-700">{interaction.management}</p>
                </div>
              )}
              {interaction.onset && (
                <div className="p-3 bg-white/60 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Onset</p>
                  <p className="text-sm text-slate-700">{interaction.onset}</p>
                </div>
              )}
            </div>
          )}

          {interaction.source && (
            <a
              href={interaction.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 
                         hover:text-blue-800 hover:underline"
            >
              Source: {interaction.source}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </SeverityCard>
    </motion.div>
  );
}

export default function InteractionResults({ results, isLoading, drugs }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 
                              rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-6 text-lg font-medium text-slate-700">
              Analyzing drug interactions...
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Checking {drugs.length} medications
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return null;
  }

  const interactions = results.interactions || [];
  const hasInteractions = interactions.length > 0;

  const severityCounts = interactions.reduce((acc, int) => {
    const sev = int.severity || 'low';
    if (sev === 'high') acc.high++;
    else if (sev === 'moderate') acc.moderate++;
    else acc.low++;
    return acc;
  }, { high: 0, moderate: 0, low: 0 });

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className={`${hasInteractions ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
        <div className="flex items-center gap-4">
          {hasInteractions ? (
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          )}
          <div>
            <CardTitle className="text-xl">
              {hasInteractions 
                ? `${interactions.length} Interaction${interactions.length > 1 ? 's' : ''} Found`
                : 'No Interactions Found'}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {hasInteractions 
                ? 'Review the interactions below and consult your healthcare provider'
                : 'No known interactions between the selected medications'}
            </p>
          </div>
        </div>

        {hasInteractions && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-amber-200">
            {severityCounts.high > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">{severityCounts.high} High Risk</span>
              </div>
            )}
            {severityCounts.moderate > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm font-medium">{severityCounts.moderate} Moderate</span>
              </div>
            )}
            {severityCounts.low > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">{severityCounts.low} Low Risk</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      {hasInteractions && (
        <CardContent className="p-6">
          <div className="space-y-4">
            <AnimatePresence>
              {interactions.map((interaction, index) => (
                <InteractionCard 
                  key={`${interaction.drug1}-${interaction.drug2}-${index}`}
                  interaction={interaction}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-800">Disclaimer:</strong> This information is for 
              educational purposes only and should not replace professional medical advice. 
              Always consult with your healthcare provider or pharmacist before making any 
              changes to your medications.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
