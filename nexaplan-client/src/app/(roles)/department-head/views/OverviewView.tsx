import React from 'react';

export function OverviewView() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-[#0A192F]">IT Department Overview</h1>
        <p className="text-slate-600 mt-2">Budget performance and departmental metrics</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Allocated Budget</div>
          <div className="text-3xl font-black text-slate-900 mb-1">₱850,000</div>
          <div className="text-sm text-[#6366F1]">FY 2026</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Spent to Date</div>
          <div className="text-3xl font-black text-slate-900 mb-1">₱524,000</div>
          <div className="text-sm text-slate-600">61.6% utilized</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Remaining</div>
          <div className="text-3xl font-black text-[#10B981] mb-1">₱326,000</div>
          <div className="text-sm text-slate-600">38.4% available</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Active Proposals</div>
          <div className="text-3xl font-black text-[#F59E0B] mb-1">2</div>
          <div className="text-sm text-slate-600">Under review</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Monthly Budget Utilization</h2>
        <div className="flex items-end gap-3 h-64 border-b border-slate-200 pb-4">
          {[45, 52, 48, 61, 55, 72, 68, 0, 0, 0, 0, 0].map((percent, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <div className="relative group">
                {percent > 0 ? (
                  <>
                    <div
                      className="bg-gradient-to-t from-[#6366F1] to-[#8B5CF6] rounded-t hover:from-[#8B5CF6] hover:to-[#6366F1] transition-all cursor-pointer"
                      style={{ height: `${(percent / 100) * 200}px` }}
                    ></div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {percent}%
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-100 rounded-t h-4"></div>
                )}
              </div>
              <div className="text-xs text-center text-slate-500 mt-2 font-semibold">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}