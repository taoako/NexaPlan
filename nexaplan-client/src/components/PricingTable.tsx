import React from 'react';
import { Check } from 'lucide-react';

interface PricingTableProps {
  onStartTrial: () => void;
  onSelectPlan: (plan: string) => void;
}

export function PricingTable({ onStartTrial, onSelectPlan }: PricingTableProps) {
  return (
    <section id="pricing" className="py-24 px-8 bg-slate-50">
      <h2 className="text-5xl font-extrabold text-[#0A192F] text-center mb-4">
        Transparent pricing for scaling businesses.
      </h2>
      <p className="text-xl text-slate-600 text-center max-w-2xl mx-auto">
        All plans include 14-day free trial. No credit card required. Cancel anytime.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mt-16">
        <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 hover:border-[#0052FF] hover:shadow-xl transition-all duration-300">
          <div className="mb-6">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Starter</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-[#0A192F]">P4,950</span>
              <span className="text-slate-500 font-semibold">/month</span>
            </div>
            <p className="text-sm text-slate-600 mt-2">Perfect for small teams starting their budget journey</p>
          </div>

          <button
            onClick={() => onStartTrial()}
            className="w-full bg-slate-100 text-[#0A192F] py-3 rounded-lg font-bold hover:bg-slate-200 transition-all duration-300 mb-6"
          >
            Start Free Trial
          </button>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Up to 3 budget managers</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">5 department allocations</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Basic forecasting (12 months)</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Email support</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Monthly exports (PDF/Excel)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0A192F] p-8 rounded-2xl border-2 border-[#0052FF] shadow-2xl transform scale-105 relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0052FF] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
            Most Popular
          </div>

          <div className="mb-6">
            <div className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-2">Professional</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">P12,900</span>
              <span className="text-slate-300 font-semibold">/month</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">For growing companies with complex budget needs</p>
          </div>

          <button
            onClick={() => onSelectPlan('professional')}
            className="w-full bg-[#0052FF] text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-all duration-300 mb-6"
          >
            Choose Professional
          </button>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-white">Up to 15 budget managers</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-white">Unlimited departments</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-white"><strong>AI forecasting (24 months)</strong></span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-white"><strong>Multi-scenario planning</strong></span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-white">Real-time variance alerts</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-white">Priority support (4-hour SLA)</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-white">API access</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 hover:border-[#0052FF] hover:shadow-xl transition-all duration-300">
          <div className="mb-6">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Enterprise</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-[#0A192F]">P29,900</span>
              <span className="text-slate-500 font-semibold">/month</span>
            </div>
            <p className="text-sm text-slate-600 mt-2">For large organizations requiring full control</p>
          </div>

          <button
            onClick={() => onSelectPlan('enterprise')}
            className="w-full bg-[#0A192F] text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all duration-300 mb-6"
          >
            Choose Enterprise
          </button>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Unlimited users</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Unlimited departments and projects</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700"><strong>Advanced ML forecasting (36 months)</strong></span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700"><strong>Custom model training</strong></span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">White-label deployment</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Dedicated account manager</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">24/7 phone and chat support</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">SSO and advanced security</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-12 text-center">
        <p className="text-sm text-slate-500">
          All prices in Philippine Peso (P). Billed monthly or save 15% with annual billing. Volume discounts available for 50+ users.
        </p>
      </div>
    </section>
  );
}
