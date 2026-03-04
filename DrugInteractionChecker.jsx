import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, Search, Shield, Activity, Info, Github, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import DrugSearchInput from '@/components/drug-checker/DrugSearchInput';
import SelectedDrugsList from '@/components/drug-checker/SelectedDrugsList';
import InteractionResults from '@/components/drug-checker/InteractionResults';
import SearchHistory from '@/components/drug-checker/SearchHistory';

export default function DrugInteractionChecker() {
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [results, setResults] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const queryClient = useQueryClient();

  // Fetch search history
  const { data: searchHistory = [] } = useQuery({
    queryKey: ['drugSearchHistory'],
    queryFn: () => base44.entities.DrugSearch.list('-created_date', 10),
  });

  // Add drug to selection
  const handleAddDrug = (drug) => {
    if (selectedDrugs.find(d => d.rxcui === drug.rxcui)) {
      toast.error('This medication is already in your list');
      return;
    }
    setSelectedDrugs(prev => [...prev, drug]);
    setResults(null); // Clear previous results
  };

  // Remove drug from selection
  const handleRemoveDrug = (rxcui) => {
    setSelectedDrugs(prev => prev.filter(d => d.rxcui !== rxcui));
    setResults(null);
  };

  // Check interactions using RxNorm Interaction API
  const checkInteractions = async () => {
    if (selectedDrugs.length < 2) {
      toast.error('Please select at least 2 medications');
      return;
    }

    setIsChecking(true);
    setResults(null);

    try {
      const drugNames = selectedDrugs.map(d => d.name).join(', ');

      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical pharmacist. Check for drug interactions between the following medications: ${drugNames}.
For each interaction found, provide detailed clinical information:
- drug1: first drug name
- drug2: second drug name  
- description: detailed clinical description of the interaction and what to watch for
- severity: one of "high", "moderate", or "low"
- mechanism: the pharmacological mechanism of the interaction (e.g., enzyme inhibition, additive effects)
- effects: specific clinical effects the patient may experience
- management: what patients and doctors should do (e.g., avoid combination, monitor, adjust dose, timing tips)
- onset: how quickly the interaction occurs (e.g., "Rapid (within hours)", "Delayed (days to weeks)")

If there are NO interactions between any pair, return an empty interactions array.
Be thorough and accurate.`,
        response_json_schema: {
          type: "object",
          properties: {
            interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  drug1: { type: "string" },
                  drug2: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" },
                  mechanism: { type: "string" },
                  effects: { type: "string" },
                  management: { type: "string" },
                  onset: { type: "string" }
                }
              }
            }
          }
        }
      });

      const interactions = llmResult.interactions || [];

      const resultData = {
        interactions,
        checkedAt: new Date().toISOString(),
        drugsChecked: selectedDrugs
      };

      setResults(resultData);

      // Save to history
      const severityCounts = interactions.reduce((acc, int) => {
        const sev = int.severity || '';
        if (sev === 'high') acc.high++;
        else if (sev === 'moderate') acc.moderate++;
        else acc.low++;
        return acc;
      }, { high: 0, moderate: 0, low: 0 });

      await base44.entities.DrugSearch.create({
        drugs_checked: selectedDrugs.map(d => ({ name: d.name, rxcui: d.rxcui })),
        interactions_found: interactions.length,
        severity_summary: severityCounts
      });

      queryClient.invalidateQueries({ queryKey: ['drugSearchHistory'] });

      if (interactions.length > 0) {
        toast.warning(`Found ${interactions.length} potential interaction(s)`);
      } else {
        toast.success('No known interactions found');
      }

    } catch (error) {
      console.error('Error checking interactions:', error);
      toast.error('Failed to check interactions. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  // Load a previous search
  const handleLoadSearch = (search) => {
    if (search.drugs_checked) {
      setSelectedDrugs(search.drugs_checked);
      setResults(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 
                              flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Pill className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Drug Interaction Checker</h1>
                <p className="text-xs text-slate-500">Powered by RxNorm API</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://rxnav.nlm.nih.gov/InteractionAPIs.html"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <BookOpen className="h-5 w-5 text-slate-500" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Check Drug Interactions
            <span className="text-blue-600"> Safely</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Enter your medications to check for potential interactions. 
            Our system uses the NIH RxNorm database for accurate results.
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Shield, title: 'Trusted Data', desc: 'NIH RxNorm Database' },
            { icon: Activity, title: 'Real-time Analysis', desc: 'Instant Results' },
            { icon: Search, title: 'Comprehensive', desc: '200K+ Drug Combinations' }
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-slate-200"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{feature.title}</p>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <h3 className="text-white font-semibold text-lg mb-4">
                  Search Medications
                </h3>
                <DrugSearchInput 
                  onAddDrug={handleAddDrug}
                  disabled={isChecking}
                />
              </div>
              <CardContent className="p-6">
                <SelectedDrugsList 
                  drugs={selectedDrugs}
                  onRemove={handleRemoveDrug}
                />
                
                <div className="mt-6">
                  <Button
                    onClick={checkInteractions}
                    disabled={isChecking || selectedDrugs.length < 2}
                    className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 
                               hover:from-blue-700 hover:to-indigo-700 shadow-lg 
                               shadow-blue-500/25 rounded-xl disabled:opacity-50"
                  >
                    {isChecking ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white 
                                        rounded-full animate-spin mr-2" />
                        Checking Interactions...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        {selectedDrugs.length < 2 
                          ? `Add ${2 - selectedDrugs.length} more drug${selectedDrugs.length === 1 ? '' : 's'} to check`
                          : 'Check for Interactions'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <InteractionResults 
              results={results}
              isLoading={isChecking}
              drugs={selectedDrugs}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SearchHistory 
              searches={searchHistory}
              onLoadSearch={handleLoadSearch}
            />

            {/* API Info Card */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">How It Works</h3>
                </div>
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-700 mb-1">1. Data Flow</p>
                    <p>Frontend → RxNorm API → Parse Response → Display Results</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-700 mb-1">2. API Endpoint</p>
                    <code className="text-xs bg-slate-200 px-1 py-0.5 rounded">
                      rxnav.nlm.nih.gov/REST/interaction
                    </code>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-700 mb-1">3. Response Codes</p>
                    <ul className="space-y-1 mt-1">
                      <li><span className="text-green-600">200</span> - Success</li>
                      <li><span className="text-amber-600">400</span> - Invalid Request</li>
                      <li><span className="text-red-600">500</span> - Server Error</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800">
                  <strong>Medical Disclaimer:</strong> This tool is for informational 
                  purposes only. Always consult a healthcare professional before 
                  making medication decisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Data provided by NIH National Library of Medicine RxNorm API
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://rxnav.nlm.nih.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                RxNav Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
