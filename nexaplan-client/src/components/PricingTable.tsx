import React, { useState, useEffect } from 'react';
import { Check, Zap, Shield, Rocket } from 'lucide-react';
import { apiUrl } from '../config/api';

interface PricingBenefit {
  benefitID: number;
  benefitText: string;
  isIncluded: boolean;
}

interface PricingPlan {
  planID: number;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  maxSeats: number;
  isPopular: boolean;
  benefits: PricingBenefit[];
}

interface PricingTableProps {
  onStartTrial: () => void;
  onSelectPlan: (plan: string) => void;
}

export function PricingTable({ onStartTrial, onSelectPlan }: PricingTableProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/pricing'))
      .then(res => res.json())
      .then(data => {
        setPlans(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load pricing:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Plans...</p>
      </div>
    );
  }

  return (
    <section id="pricing" className="py-24 px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-[#0A192F] mb-4 tracking-tight">
            Transparent pricing for scaling businesses.
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            All plans include 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.planID}
              className={`flex flex-col bg-white p-8 rounded-3xl border-2 transition-all duration-300 relative ${plan.isPopular
                ? 'border-[#0052FF] shadow-2xl scale-105 z-10'
                : 'border-slate-200 hover:border-[#0052FF]/50 hover:shadow-xl'
                }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0052FF] text-white px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  {plan.name === 'Starter' && <Rocket className="w-5 h-5 text-slate-400" />}
                  {plan.name === 'Professional' && <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />}
                  {plan.name === 'Enterprise' && <Shield className="w-5 h-5 text-indigo-600" />}
                  <span className={`text-sm font-black uppercase tracking-widest ${plan.isPopular ? 'text-blue-600' : 'text-slate-500'}`}>
                    {plan.name}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-[#0A192F]">₱{plan.monthlyPrice.toLocaleString()}</span>
                  <span className="text-slate-500 font-bold">/mo</span>
                </div>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed font-medium">
                  {plan.description}
                </p>
              </div>

              <button
                onClick={() => plan.name === 'Starter' ? onStartTrial() : onSelectPlan(plan.name.toLowerCase())}
                className={`w-full py-4 rounded-xl font-black transition-all duration-300 mb-8 shadow-lg ${plan.isPopular
                  ? 'bg-[#0052FF] text-white hover:bg-blue-600 shadow-blue-200'
                  : 'bg-[#0A192F] text-white hover:bg-slate-800 shadow-slate-200'
                  }`}
              >
                {plan.name === 'Starter' ? 'Start 14-Day Free Trial' : `Choose ${plan.name}`}
              </button>

              <div className="space-y-4 flex-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">What's Included</div>
                {plan.benefits.map((benefit) => (
                  <div key={benefit.benefitID} className="flex items-start gap-3">
                    <div className={`mt-1 p-0.5 rounded-full ${benefit.isIncluded ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <Check className={`w-3 h-3 ${benefit.isIncluded ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                    <span className={`text-sm ${benefit.isIncluded ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}`}>
                      {benefit.benefitText}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Maximum Seats</span>
                  <span className="text-[#0A192F]">{plan.maxSeats === 0 ? 'Unlimited' : plan.maxSeats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-16 text-center space-y-4">
          <p className="text-sm text-slate-500 font-medium">
            All prices in Philippine Peso (₱). Save up to 15% with annual billing.
            <span className="text-[#0052FF] cursor-pointer hover:underline ml-1">View annual pricing →</span>
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">Instant Setup</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
