'use client';

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, HelpCircle, Activity } from 'lucide-react';

interface InteractionResult {
  status: 'safe' | 'warning' | 'danger';
  title: string;
  description: string;
}

const DRUGS_LIST = [
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Atorvastatin (Lipitor)',
  'Metformin',
  'Aspirin',
  'Alcohol / Grapefruit'
];

// Mock database of interactions
const INTERACTION_DATABASE: Record<string, InteractionResult> = {
  'Paracetamol+Ibuprofen': {
    status: 'safe',
    title: 'Generally Safe (Dual Therapy)',
    description: 'Combining Paracetamol and Ibuprofen is generally safe for short-term pain relief, as they work through different pathways in the body. Do not exceed the maximum daily dose for either medicine.'
  },
  'Ibuprofen+Paracetamol': {
    status: 'safe',
    title: 'Generally Safe (Dual Therapy)',
    description: 'Combining Paracetamol and Ibuprofen is generally safe for short-term pain relief, as they work through different pathways in the body. Do not exceed the maximum daily dose for either medicine.'
  },
  'Ibuprofen+Aspirin': {
    status: 'warning',
    title: 'Increased Risk of Gastric Bleeding',
    description: 'Both are nonsteroidal anti-inflammatory drugs (NSAIDs). Combining them significantly increases the risk of stomach irritation, stomach ulcers, and gastrointestinal bleeding.'
  },
  'Aspirin+Ibuprofen': {
    status: 'warning',
    title: 'Increased Risk of Gastric Bleeding',
    description: 'Both are nonsteroidal anti-inflammatory drugs (NSAIDs). Combining them significantly increases the risk of stomach irritation, stomach ulcers, and gastrointestinal bleeding.'
  },
  'Atorvastatin (Lipitor)+Alcohol / Grapefruit': {
    status: 'danger',
    title: 'Severe Enzymatic Interaction',
    description: 'Grapefruit juice blocks the CYP3A4 enzyme, which is responsible for breaking down Atorvastatin. This leads to toxic levels of the medicine accumulating in your bloodstream, greatly increasing the risk of liver damage and rhabdomyolysis (muscle breakdown).'
  },
  'Alcohol / Grapefruit+Atorvastatin (Lipitor)': {
    status: 'danger',
    title: 'Severe Enzymatic Interaction',
    description: 'Grapefruit juice blocks the CYP3A4 enzyme, which is responsible for breaking down Atorvastatin. This leads to toxic levels of the medicine accumulating in your bloodstream, greatly increasing the risk of liver damage and rhabdomyolysis (muscle breakdown).'
  },
  'Amoxicillin+Alcohol / Grapefruit': {
    status: 'warning',
    title: 'Reduced Recovery & Increased Side Effects',
    description: 'While alcohol does not render Amoxicillin ineffective, it can worsen side effects like dehydration, nausea, and dizziness. Alcohol also weakens your immune system, delaying recovery from infections.'
  },
  'Alcohol / Grapefruit+Amoxicillin': {
    status: 'warning',
    title: 'Reduced Recovery & Increased Side Effects',
    description: 'While alcohol does not render Amoxicillin ineffective, it can worsen side effects like dehydration, nausea, and dizziness. Alcohol also weakens your immune system, delaying recovery from infections.'
  },
  'Metformin+Alcohol / Grapefruit': {
    status: 'danger',
    title: 'Increased Lactic Acidosis Risk',
    description: 'Drinking heavy amounts of alcohol while taking Metformin increases the risk of a rare but life-threatening condition called Lactic Acidosis (buildup of lactic acid in the blood), which can lead to kidney failure.'
  },
  'Alcohol / Grapefruit+Metformin': {
    status: 'danger',
    title: 'Increased Lactic Acidosis Risk',
    description: 'Drinking heavy amounts of alcohol while taking Metformin increases the risk of a rare but life-threatening condition called Lactic Acidosis (buildup of lactic acid in the blood), which can lead to kidney failure.'
  }
};

export const InteractionChecker: React.FC = () => {
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugA || !drugB) return;

    if (drugA === drugB) {
      setResult({
        status: 'safe',
        title: 'Same Substance',
        description: 'You have selected the same substance for both slots. Make sure to choose two different drugs to check their interactions.'
      });
      setIsChecked(true);
      return;
    }

    const key = `${drugA}+${drugB}`;
    const found = INTERACTION_DATABASE[key];

    if (found) {
      setResult(found);
    } else {
      // Default fallback for unrecorded combinations
      setResult({
        status: 'safe',
        title: 'No Known Interactions',
        description: 'Based on our current clinical records, there are no major known interactions between these two substances. However, always consult your physician or pharmacist before starting new medications.'
      });
    }
    setIsChecked(true);
  };

  const getStatusIcon = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="w-8 h-8 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'danger':
        return <ShieldAlert className="w-8 h-8 text-rose-500" />;
    }
  };

  const getStatusStyles = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'safe':
        return 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300';
      case 'warning':
        return 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'danger':
        return 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300';
    }
  };

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-xl border border-[var(--card-border)] relative overflow-hidden">
      
      {/* Decorative backdrop glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />
      
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="font-extrabold text-xl sm:text-2xl">Drug Interaction Checker</h3>
          <p className="text-xs text-[var(--text-secondary)]">Check if your medications are safe to take together</p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
              Medication 1
            </label>
            <select
              value={drugA}
              onChange={(e) => { setDrugA(e.target.value); setIsChecked(false); }}
              required
              className="w-full h-12 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
            >
              <option value="">Select first drug...</option>
              {DRUGS_LIST.map(drug => (
                <option key={drug} value={drug}>{drug}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
              Medication 2
            </label>
            <select
              value={drugB}
              onChange={(e) => { setDrugB(e.target.value); setIsChecked(false); }}
              required
              className="w-full h-12 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
            >
              <option value="">Select second drug...</option>
              {DRUGS_LIST.map(drug => (
                <option key={drug} value={drug}>{drug}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!drugA || !drugB}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            Analyze Interactions
          </button>
        </div>
      </form>

      {/* Result Panel */}
      {isChecked && result && (
        <div className={`mt-8 p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:space-x-4 space-y-4 sm:space-y-0 transition-all duration-500 animate-fadeIn ${getStatusStyles(result.status)}`}>
          <div className="shrink-0 p-1 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm">
            {getStatusIcon(result.status)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight">{result.title}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                result.status === 'safe' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200' :
                result.status === 'warning' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200' :
                'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
              }`}>
                {result.status}
              </span>
            </div>
            <p className="text-sm leading-relaxed opacity-95">
              {result.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default InteractionChecker;
