import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  GitBranch,
  Lock,
  Shield,
  Target,
  TrendingUp,
  Users,
  RefreshCw
} from 'lucide-react';
import type { PricingPlan } from '../api/superAdminApi';
import { getPricing } from '../api/superAdminApi';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onSelectPlan: (plan: string) => void;
  isLoggedIn?: boolean;
  userRole?: number;
}

export function LandingPage({ onNavigate, onSelectPlan, isLoggedIn, userRole }: LandingPageProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const navigateToDashboard = () => {
    if (!userRole) return onNavigate('login');
    switch (userRole) {
      case 1: onNavigate('admin-dashboard'); break;
      case 2: onNavigate('main-admin'); break;
      case 3: onNavigate('finance-manager'); break;
      case 4: onNavigate('dept-head'); break;
      case 5: onNavigate('auditor'); break;
      default: onNavigate('main-admin');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getPricing();
        setPlans(data);
      } catch (err) {
        console.error('Failed to load pricing:', err);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, []);
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const startTrial = () => {
    onSelectPlan('trial');
    onNavigate('register');
  };

  const selectPlan = (plan: string) => {
    onSelectPlan(plan);
    onNavigate('register');
  };

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-8">
        <div className="flex items-center">
          <span className="font-black text-2xl">
            <span className="text-[#0052FF]">Nexa</span>
            <span className="text-[#0A192F]">Plan</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection('features')}
            className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('ai-engine')}
            className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
          >
            AI Engine
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection('customers')}
            className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
          >
            Customers
          </button>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <button
              onClick={navigateToDashboard}
              className="bg-[#0052FF] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-100 flex items-center gap-2"
            >
              <Target className="w-4 h-4" /> Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('login')}
                className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
              >
                Log In
              </button>
              <button
                onClick={startTrial}
                className="bg-[#0A192F] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-all duration-300"
              >
                Start Free Trial
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="bg-white pt-24 pb-16 relative overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#0052FF]/25 bg-[#0052FF]/5 mb-7">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0052FF]" />
            <span className="text-[11px] font-bold text-[#0052FF] tracking-widest uppercase">Built for Philippine Enterprises</span>
          </div>

          <h1 className="text-[56px] lg:text-[72px] font-black text-[#0A192F] leading-[1.03] tracking-tight mb-6">
            Budget Intelligence,
            <br />
            <span className="text-[#0052FF]">Finally Automated.</span>
          </h1>

          <p className="text-[18px] text-slate-500 leading-relaxed mb-10 max-w-[560px] mx-auto">
            Enterprise finance platform built for Philippine companies. Automate multi-level approvals, predict spend with 94% AI accuracy, and give every department head real-time visibility.
          </p>

          <div className="flex gap-3.5 mb-12 justify-center">
            {isLoggedIn ? (
              <button
                onClick={navigateToDashboard}
                className="group flex items-center gap-2 bg-[#0052FF] text-white px-9 py-4 rounded-xl font-bold text-[16px] hover:bg-[#0041cc] transition-all"
                style={{ boxShadow: '0 8px 30px rgba(0,82,255,0.35)' }}
              >
                Return to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={startTrial}
                  className="group flex items-center gap-2 bg-[#0052FF] text-white px-7 py-3.5 rounded-xl font-bold text-[15px] hover:bg-[#0041cc] transition-all"
                  style={{ boxShadow: '0 4px 20px rgba(0,82,255,0.28)' }}
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-[15px] text-[#0A192F] border-2 border-[#d1d5db] hover:border-[#0052FF] hover:text-[#0052FF] transition-all"
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-5 mb-16 justify-center">
            <div className="flex -space-x-2.5">
              {([
                ['MS', '#0052FF'],
                ['JD', '#0A192F'],
                ['CR', '#10B981'],
                ['LA', '#D97706'],
                ['AK', '#6366f1'],
              ] as [string, string][]).map(([init, color], i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {init}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 mb-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg key={i} viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-yellow-400">
                    <path d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1-3-2.9 4.2-.8z" />
                  </svg>
                ))}
              </div>
              <div className="text-[12px] text-slate-500">Trusted by 80+ enterprise teams</div>
            </div>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl" style={{ boxShadow: '0 24px 64px rgba(10,25,47,0.13)' }}>
              <img
                src="https://images.unsplash.com/photo-1758691736483-5f600b509962?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBc2lhbiUyMGZpbmFuY2lhbCUyMGRpc3RyaWN0fGVufDF8fHx8MTc3NzQ2MzU3OHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Finance team reviewing enterprise budget data"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="pt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {([
              { n: '94.2%', l: 'AI Forecast Accuracy' },
              { n: '< 48h', l: 'Approval Cycle' },
              { n: '85 hrs', l: 'Saved Per Month' },
            ] as { n: string; l: string }[]).map(({ n, l }) => (
              <div key={l}>
                <div className="text-[32px] font-black text-[#0052FF]">{n}</div>
                <div className="text-[13px] text-slate-500 mt-1">{l}</div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-10 flex items-center gap-1.5 justify-center">
            <Lock className="w-3 h-3" />
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </div>
      </section>

      <section id="customers" className="bg-[#F7F8FA] py-16 px-8 border-y border-[#d1d5db]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mb-8">Trusted by finance teams across the Philippines</p>
          <div className="flex justify-center items-center gap-12 mb-14 flex-wrap">
            {['MODULUS VISENTRA', 'DAVAO AGRIBUSINESS', 'PRIME FINANCIAL', 'CEBU HOLDINGS', 'MANILA FINTECH'].map((n) => (
              <div key={n} className="text-[14px] font-black text-slate-300 tracking-widest">{n}</div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-5">
            {([
              { val: '94.2%', label: 'AI Forecast Accuracy', sub: 'Random Forest model' },
              { val: '< 48h', label: 'Approval Cycle', sub: 'Down from 2 weeks' },
              { val: '85 hrs', label: 'Saved Per Month', sub: 'Per finance team' },
              { val: '12+', label: 'Departments Supported', sub: 'Per enterprise client' },
            ] as { val: string; label: string; sub: string }[]).map(({ val, label, sub }) => (
              <div key={label} className="bg-white rounded-xl p-6 border border-[#d1d5db] text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="text-[32px] font-black text-[#0052FF] mb-1">{val}</div>
                <div className="text-[14px] font-bold text-slate-900">{label}</div>
                <div className="text-[12px] text-slate-500 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-bold text-[#0052FF] uppercase tracking-widest text-center mb-4">Platform Capabilities</p>
          <h2 className="text-[40px] font-black text-[#0A192F] text-center max-w-xl mx-auto leading-tight mb-14">
            Everything you need to command your budget.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {([
              { icon: Calculator, title: 'Intelligent Allocation', desc: 'Distribute targeted funding to specific departments with full transparency. Track every peso with granular visibility.' },
              { icon: GitBranch, title: 'Scenario Planning', desc: 'Clone base budgets to run optimistic and pessimistic what-if driver models. Prepare for any financial outcome.' },
              { icon: Target, title: 'Real-Time Variance', desc: 'Instantly compare approved budgets against actual transactions. Spot deviations before they escalate.' },
              { icon: Shield, title: 'RBAC Access Control', desc: 'Role-based permissions across 5 user levels. Every action is logged, attributed, and immutably stored.' },
              { icon: TrendingUp, title: 'AI Forecasting', desc: '94.2% accurate Random Forest model. Bootstrap confidence intervals narrow near observed data.' },
              { icon: BarChart3, title: 'Compliance Audit Trail', desc: 'Cryptographically verified, immutable log of every financial action across the entire organization.' },
            ] as { icon: React.ElementType; title: string; desc: string }[]).map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                className="bg-white p-7 rounded-2xl border border-[#d1d5db] hover:border-[#0052FF]/30 hover:-translate-y-0.5 transition-all duration-200 group"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div className="w-11 h-11 bg-[#EEF3FF] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#0052FF] transition-colors duration-200">
                  <Icon className="w-5 h-5 text-[#0052FF] group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-[17px] font-bold text-[#0A192F] mb-2.5">{title}</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative h-60 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1776628051931-44de1aa44f38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtb2Rlcm4lMjBnbGFzcyUyMG9mZmljZSUyMGJ1aWxkaW5nJTIwYWVyaWFsJTIwY2l0eSUyMGZpbmFuY2lhbCUyMGRpc3RyaWN0fGVufDF8fHx8MTc3NzQ2MzU3OHww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Modern financial district"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F]/85 via-[#0A192F]/55 to-[#0A192F]/15 flex items-center px-16">
          <div className="max-w-lg">
            <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-2">Customer Story</p>
            <p className="text-white text-[20px] font-bold leading-snug">"NexaPlan cut our approval cycle from 2 weeks to 48 hours. Our CFO called it the best infrastructure decision this year."</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0052FF] flex items-center justify-center font-bold text-white text-[11px] shrink-0">MS</div>
              <div>
                <div className="text-white font-bold text-[13px]">Maria Santos</div>
                <div className="text-white/50 text-[12px]">CFO, Davao Agribusiness Corp.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="ai-engine" className="py-24 px-8 bg-[#0A192F]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="inline-block px-4 py-2 bg-blue-500/10 rounded-full border border-blue-400/30 mb-6">
              <span className="text-blue-400 text-sm font-bold uppercase tracking-wide">Powered by Scikit-Learn</span>
            </div>
            <h2 className="text-5xl font-extrabold text-white mt-6 leading-tight">
              Stop guessing.<br />Start predicting.
            </h2>
            <p className="text-slate-300 mt-6 text-lg leading-relaxed">
              Our dedicated Python microservice analyzes your historical transaction data to automatically predict future departmental expenses. Machine learning models continuously improve accuracy with every budget cycle.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {[
                'Linear regression for trend analysis',
                'Seasonal pattern detection',
                'Anomaly detection for outliers',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-200 font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full max-w-md">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-700" />
                  <span className="text-yellow-800 text-xs font-bold uppercase tracking-wide">AI can make mistakes</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-slate-500 font-semibold mb-2">Q3 2026 Operating Expenses</div>
                <div className="text-4xl font-black text-[#0052FF]">₱412,500.00</div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-600">
                    <span className="font-bold text-green-500">+8.2%</span> from Q2 actual
                  </span>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4">
                {[
                  { label: 'Model Confidence', value: '87%', color: '#0052FF', width: '87%' },
                  { label: 'Data Quality', value: '92%', color: '#10B981', width: '92%' },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">{metric.label}</span>
                      <span style={{ color: metric.color }}>{metric.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: metric.width, backgroundColor: metric.color }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase mb-3">Predicted by Department</div>
                <div className="space-y-2 text-sm">
                  {[
                    { name: 'Operations', value: '₱185,000' },
                    { name: 'Marketing', value: '₱122,500' },
                    { name: 'IT Infrastructure', value: '₱105,000' },
                  ].map((row) => (
                    <div key={row.name} className="flex justify-between">
                      <span className="text-slate-600">{row.name}</span>
                      <span className="font-bold text-[#0A192F]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-8 bg-slate-50">
        <h2 className="text-5xl font-extrabold text-[#0A192F] text-center mb-4">Transparent pricing for scaling businesses.</h2>
        <p className="text-xl text-slate-600 text-center max-w-2xl mx-auto">
          All plans include 14-day free trial. No credit card required. Cancel anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mt-16">
          {loadingPlans ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-10 h-10 text-[#0052FF] animate-spin mb-4" />
              <p className="text-slate-500 font-bold">Synchronizing latest pricing tiers...</p>
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.planID}
                className={`p-8 rounded-2xl border-2 transition-all duration-300 relative ${
                  plan.isPopular 
                    ? 'bg-[#0A192F] border-[#0052FF] shadow-2xl transform scale-105 z-10' 
                    : 'bg-white border-slate-200 hover:border-[#0052FF] hover:shadow-xl'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0052FF] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <div className={`text-sm font-bold uppercase tracking-wide mb-2 ${plan.isPopular ? 'text-blue-400' : 'text-slate-500'}`}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-black ${plan.isPopular ? 'text-white' : 'text-[#0A192F]'}`}>
                      ₱{plan.monthlyPrice.toLocaleString()}
                    </span>
                    <span className={`font-semibold ${plan.isPopular ? 'text-slate-300' : 'text-slate-500'}`}>/month</span>
                  </div>
                  <p className={`text-sm mt-2 ${plan.isPopular ? 'text-slate-400' : 'text-slate-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <button
                  onClick={() => selectPlan(plan.name.toLowerCase())}
                  className={`w-full py-3 rounded-lg font-bold transition-all duration-300 mb-6 ${
                    plan.isPopular 
                      ? 'bg-[#0052FF] text-white hover:bg-blue-600' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Purchase Plan
                </button>

                <div className="space-y-3">
                  {plan.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <span className={plan.isPopular ? 'text-white' : 'text-slate-700'}>
                        {benefit.benefitText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className="text-sm text-slate-500">
            All prices in Philippine Peso (₱). Billed monthly or save 15% with annual billing. Volume discounts available for 50+ users.
          </p>
        </div>
      </section>

      <section className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-extrabold text-[#0A192F] text-center mb-16">Built for enterprise security and scale.</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-[#0052FF]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#0A192F] mb-3">Real-Time Analytics</h3>
              <p className="text-slate-600">Live dashboards update instantly as transactions flow through your system. No manual refreshes needed.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#0052FF]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#0A192F] mb-3">Multi-Tier Approvals</h3>
              <p className="text-slate-600">Configure complex approval workflows with role-based permissions and automated routing.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#0052FF]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#0A192F] mb-3">Bank-Grade Security</h3>
              <p className="text-slate-600">256-bit encryption, SOC 2 Type II certified, and full audit trails for every budget change.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-8 bg-gradient-to-br from-[#0A192F] to-slate-800 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-extrabold text-white mb-6">Ready to transform your budgeting process?</h2>
          <p className="text-xl text-slate-300 mb-10">
            Join hundreds of finance teams who have eliminated spreadsheet chaos and gained complete budget visibility.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={startTrial}
              className="bg-[#0052FF] text-white px-8 py-4 rounded-xl font-bold text-lg hover:-translate-y-1 shadow-lg transition-all duration-300"
            >
              Start Your 14-Day Free Trial
            </button>
            <button className="bg-white/10 border-2 border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300">
              Schedule a Demo
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-6">No credit card required • Setup in under 5 minutes • Cancel anytime</p>
        </div>
      </section>

      <footer className="bg-[#0A192F] border-t border-slate-700 py-12 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="font-black text-2xl mb-4">
              <span className="text-[#0052FF]">Nexa</span>
              <span className="text-white">Plan</span>
            </div>
            <p className="text-slate-400 text-sm">Enterprise budgeting powered by machine learning.</p>
          </div>

          <div>
            <div className="text-white font-bold mb-4">Product</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">AI Engine</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-bold mb-4">Company</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-bold mb-4">Legal</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Data Processing</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Compliance</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-700 text-center text-slate-500 text-sm">
          <p>&copy; 2026 NexaPlan. All rights reserved. Made with precision in Manila, Philippines.</p>
        </div>
      </footer>
    </div>
  );
}
