import React from 'react';

interface UpgradeBannerProps {
  feature:     string;
  requiredTier: 'Professional' | 'Enterprise';
}

export default function UpgradeBanner({ feature, requiredTier }: UpgradeBannerProps) {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isMainAdmin = storedUser.roleId === 2;

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 
                    border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-white shadow-sm">
      <div className="text-4xl">🔒</div>
      <h3 className="text-lg font-semibold text-gray-700">{feature}</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        This feature requires the{' '}
        <span className="font-bold text-blue-600">{requiredTier}</span> plan or higher.
      </p>
      {isMainAdmin ? (
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold 
                     hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate-to-billing'));
          }}
        >
          Upgrade Plan
        </button>
      ) : (
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          Contact your Organization Admin to upgrade
        </p>
      )}
    </div>
  );
}
