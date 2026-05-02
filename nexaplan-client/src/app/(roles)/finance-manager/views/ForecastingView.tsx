import React, { useState } from 'react';
import {
  TrendingUp, AlertTriangle, Download, Calendar, Building2,
  Activity, ArrowUp, ArrowDown, Zap, CheckCircle2, Info
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, Cell
} from 'recharts';

// Historical + Forecast Data
const forecastData = [
  { month: 'Jan 25', actual: 320000, budget: 330000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Feb 25', actual: 335000, budget: 330000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Mar 25', actual: 328000, budget: 330000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Apr 25', actual: 342000, budget: 340000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'May 25', actual: 355000, budget: 345000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Jun 25', actual: 348000, budget: 345000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Jul 25', actual: 362000, budget: 350000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Aug 25', actual: 370000, budget: 355000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Sep 25', actual: 365000, budget: 355000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Oct 25', actual: 378000, budget: 360000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Nov 25', actual: 385000, budget: 365000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Dec 25', actual: 392000, budget: 370000, forecast: null, upperBound: null, lowerBound: null },
  { month: 'Jan 26', actual: null, budget: 375000, forecast: 398000, upperBound: 415000, lowerBound: 380000 },
  { month: 'Feb 26', actual: null, budget: 375000, forecast: 405000, upperBound: 425000, lowerBound: 385000 },
  { month: 'Mar 26', actual: null, budget: 380000, forecast: 410000, upperBound: 432000, lowerBound: 388000 },
  { month: 'Apr 26', actual: null, budget: 380000, forecast: 418000, upperBound: 442000, lowerBound: 394000 },
  { month: 'May 26', actual: null, budget: 385000, forecast: 425000, upperBound: 452000, lowerBound: 398000 },
  { month: 'Jun 26', actual: null, budget: 385000, forecast: 432000, upperBound: 462000, lowerBound: 402000 },
];

const varianceData = [
  { dept: 'IT', variance: 25000, color: '#EF4444' },
  { dept: 'Marketing', variance: -12000, color: '#10B981' },
  { dept: 'Sales', variance: 8000, color: '#EF4444' },
  { dept: 'HR', variance: -20000, color: '#10B981' },
  { dept: 'Operations', variance: -6000, color: '#10B981' },
  { dept: 'Legal', variance: 3000, color: '#EF4444' },
];

const aiInsights = [
  { id: 1, type: 'warning', title: 'Q3 Budget Overrun Risk Detected', description: 'Based on historical seasonal trends, the IT Department has an 85% probability of exceeding their Q3 budget by ₱15,000 due to software license renewals.', confidence: '85%' },
  { id: 2, type: 'optimization', title: 'Budget Reallocation Opportunity', description: 'HR Department is consistently tracking 10% below allocated budget for 4 consecutive months. Consider reallocating ₱20,000 to the central reserve.', confidence: '92%' },
  { id: 3, type: 'anomaly', title: 'Anomaly in Marketing Travel Expenses', description: 'Unusual spike detected in Marketing travel expenses compared to the previous 3-year baseline. Review recommended.', confidence: '78%' },
  { id: 4, type: 'success', title: 'Operations Efficiency Improvement', description: 'Operations Department showing consistent 8% under-budget trend for Q1-Q2. Forecast indicates sustained efficiency through EOY.', confidence: '94%' }
];

export function ForecastingView() {
  const [timeframe, setTimeframe] = useState('Trailing 12M + 6M Forecast');
  const [department, setDepartment] = useState('All Organization');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const handleExport = () => {
    alert(`Exporting forecast data as ${exportFormat.toUpperCase()}...`);
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
      
      {/* Sub-Header Context Bar */}
      <div className="bg-white border-b border-slate-200 flex items-center justify-between px-8 py-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
            >
              <option>Trailing 12M + 6M Forecast</option>
              <option>Trailing 6M + 3M Forecast</option>
              <option>YTD + EOY Forecast</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
            >
              <option>All Organization</option>
              <option>IT Department</option>
              <option>Marketing</option>
              <option>Sales</option>
              <option>HR</option>
              <option>Operations</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-[#10B981]/10 px-4 py-2 rounded-lg border border-[#10B981]/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
              <span className="text-sm font-bold text-slate-900">Forecasting Engine: Active</span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-sm text-slate-600">Model Accuracy: <span className="font-bold text-[#8B5CF6]">94.2%</span></span>
            </div>
          </div>
          
          <button onClick={handleExport} className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-md">
            <Download className="w-4 h-4" /> Export
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')} className="ml-2 bg-transparent border-l border-white/20 pl-2 outline-none text-slate-300">
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-8 space-y-6 overflow-auto">
        
        {/* Predictive KPIs */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Projected EOY Expenditure</div>
              <TrendingUp className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div className="text-4xl font-black text-slate-900 mb-2 font-mono">₱4,150,000</div>
            <div className="flex items-center gap-2 text-sm"><div className="flex items-center gap-1 text-[#8B5CF6] font-bold"><ArrowUp className="w-4 h-4" />4.2% above baseline forecast</div></div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">YTD Variance</div>
              <Activity className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-4xl font-black text-[#10B981] mb-2 font-mono">-₱45,000</div>
            <div className="flex items-center gap-2 text-sm"><div className="flex items-center gap-1 text-[#10B981] font-bold"><ArrowDown className="w-4 h-4" />Currently 1.5% under budget</div></div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Budget Depletion Risk</div>
              <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div className="text-4xl font-black text-[#F59E0B] mb-2">Medium</div>
            <div className="text-sm text-slate-600">IT and Marketing showing high Q4 velocity</div>
          </div>
        </div>

        {/* Forecasting Area Chart */}
        <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Expense Trajectory & Predictive Forecast</h2>
              <p className="text-sm text-slate-600 mt-1">AI-powered projection with confidence intervals</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#1A2B3C] rounded-full"></div><span className="text-sm text-slate-600">Actual</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-[#94A3B8] border-dashed rounded-full"></div><span className="text-sm text-slate-600">Budget</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#8B5CF6] rounded-full"></div><span className="text-sm text-slate-600">AI Forecast</span></div>
              <div className="flex items-center gap-2"><div className="w-8 h-3 bg-[#8B5CF6]/15 rounded"></div><span className="text-sm text-slate-600">Confidence Range</span></div>
            </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => `₱${value?.toLocaleString()}`} />
                <ReferenceLine x="Dec 25" stroke="#94A3B8" strokeDasharray="5 5" label={{ value: "Today", position: "top", fill: "#64748B", fontSize: 12 }} />
                <Area type="monotone" dataKey="upperBound" stroke="none" fill="url(#confidenceGradient)" />
                <Area type="monotone" dataKey="lowerBound" stroke="none" fill="url(#confidenceGradient)" />
                <Line type="monotone" dataKey="budget" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#1A2B3C" strokeWidth={3} dot={{ fill: '#1A2B3C', r: 4 }} />
                <Line type="monotone" dataKey="forecast" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Variance & Insights */}
        <div className="grid grid-cols-[60%_40%] gap-6 pb-12">
          {/* Departmental Variance */}
          <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm">
            <div className="mb-6"><h2 className="text-xl font-bold text-slate-900">YTD Variance by Department</h2><p className="text-sm text-slate-600 mt-1">Budget performance analysis</p></div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={varianceData} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="dept" tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`₱${value?.toLocaleString()}`, value > 0 ? 'Over Budget' : 'Under Budget']} />
                  <ReferenceLine x={0} stroke="#94A3B8" strokeWidth={2} />
                  <Bar dataKey="variance" radius={[0, 4, 4, 0]}>
                    {varianceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights Feed */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="mb-6"><h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Zap className="w-5 h-5 text-[#8B5CF6]" /> NexaPlan AI Insights Feed</h2><p className="text-sm text-slate-600 mt-1">Automated forecasting intelligence</p></div>
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {aiInsights.map((insight) => {
                const Icon = insight.type === 'warning' ? AlertTriangle : insight.type === 'optimization' ? TrendingUp : insight.type === 'anomaly' ? Activity : CheckCircle2;
                const colorClass = insight.type === 'warning' ? 'border-[#EF4444]/20 bg-[#EF4444]/5' : insight.type === 'optimization' ? 'border-[#8B5CF6]/20 bg-[#8B5CF6]/5' : insight.type === 'anomaly' ? 'border-[#F59E0B]/20 bg-[#F59E0B]/5' : 'border-[#10B981]/20 bg-[#10B981]/5';
                const iconColor = insight.type === 'warning' ? 'text-[#EF4444]' : insight.type === 'optimization' ? 'text-[#8B5CF6]' : insight.type === 'anomaly' ? 'text-[#F59E0B]' : 'text-[#10B981]';
                return (
                  <div key={insight.id} className={`p-4 rounded-lg border ${colorClass} hover:shadow-md transition-all`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-slate-900 mb-2">{insight.title}</h3>
                        <p className="text-sm text-slate-700 mb-3">{insight.description}</p>
                        <div className="flex items-center gap-2"><Info className="w-3 h-3 text-slate-400" /><span className="text-xs text-slate-600">AI Confidence: <span className="font-bold">{insight.confidence}</span></span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}