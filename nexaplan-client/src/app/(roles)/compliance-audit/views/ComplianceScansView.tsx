import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, XCircle, Settings, Plus, Trash2 } from 'lucide-react';
import { auditorApi } from '../../../../api/auditorApi';

import { useAuditorModal } from '../ComplianceAuditSystem';

export function ComplianceScansView({ onDeepLink }: { onDeepLink: (logId: number) => void }) {
  const { showAlert, showConfirm } = useAuditorModal();
  const [rules, setRules] = useState<any[]>([]);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null);

  // Custom rule modal state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', ruleType: 'BudgetIncrease', threshold: 15, description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesData, scanData] = await Promise.all([
        auditorApi.getComplianceRules(),
        auditorApi.runComplianceScan()
      ]);
      setRules(rulesData);
      setScanResults(scanData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auditorApi.createRule(newRule);
      setShowRuleModal(false);
      setNewRule({ name: '', ruleType: 'BudgetIncrease', threshold: 15, description: '' });
      showAlert('Success', 'Custom rule created successfully.', 'success');
      fetchData();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to create rule', 'error');
    }
  };

  const handleDeleteRule = (id: number) => {
    showConfirm('Delete Rule', 'Are you sure you want to delete this custom rule?', async () => {
      try {
        await auditorApi.deleteRule(id);
        showAlert('Success', 'Rule deleted successfully.', 'success');
        fetchData();
      } catch (err: any) {
        showAlert('Error', err.message || 'Failed to delete rule', 'error');
      }
    });
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-[28px] font-black text-slate-900">Automated Policy Checks</h2>
          <p className="text-slate-500 mt-1 font-medium">Real-time compliance monitoring and custom rule builder.</p>
        </div>
        <button
          onClick={() => setShowRuleModal(true)}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Settings className="w-4 h-4 text-[#4F46E5]" />
          Configure Rules
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Running compliance scans...</div>
        ) : scanResults.map(check => {
          const isCompliant = check.status === 'compliant';
          const ruleInfo = rules.find(r => r.id === check.id);
          
          return (
            <div key={check.id} className="p-6 transition-colors hover:bg-slate-50/50">
              <button
                onClick={() => setExpandedPolicy(expandedPolicy === check.id ? null : check.id)}
                className="w-full flex items-start gap-4 text-left"
              >
                {isCompliant ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[15px] font-black ${isCompliant ? 'text-slate-900' : 'text-red-900'}`}>
                      {check.name}
                    </span>
                    {!ruleInfo?.isSystemDefault && (
                      <span className="text-[10px] uppercase font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">Custom</span>
                    )}
                  </div>
                  <div className={`text-sm font-medium ${isCompliant ? 'text-slate-500' : 'text-red-600'}`}>
                    {check.details}
                  </div>
                  
                  {expandedPolicy === check.id && !isCompliant && check.deepLinkLogIds?.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg animate-in slide-in-from-top-2">
                      <div className="text-xs font-bold text-red-800 uppercase mb-2">Violating Audit Logs</div>
                      <div className="space-y-2">
                        {check.deepLinkLogIds.map((logId: number) => (
                          <div key={logId} className="flex justify-between items-center bg-white p-2.5 rounded border border-red-100">
                            <span className="text-sm font-mono text-slate-700">Log ID: #{logId}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeepLink(logId); }}
                              className="text-xs font-bold text-[#4F46E5] hover:underline"
                            >
                              View in Audit Trail →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {expandedPolicy === check.id && !ruleInfo?.isSystemDefault && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRule(check.id); }}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Custom Rule
                      </button>
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateRule} className="bg-white rounded-2xl p-8 max-w-lg w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#4F46E5]" />
              Configure Custom Rule
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Rule Name</label>
                <input required type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#4F46E5]" placeholder="e.g. Max Budget Request Limit" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Rule Type</label>
                <select value={newRule.ruleType} onChange={e => setNewRule({...newRule, ruleType: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#4F46E5]">
                  <option value="BudgetIncrease">Budget Cap Threshold</option>
                  <option value="OutsideHours">Outside Business Hours</option>
                  <option value="CustomParameter">Custom Parameter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Threshold / Value</label>
                <input required type="number" value={newRule.threshold} onChange={e => setNewRule({...newRule, threshold: parseFloat(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#4F46E5]" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowRuleModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white bg-[#4F46E5] hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 transition-all flex justify-center items-center gap-2">
                <Plus className="w-4 h-4" /> Add Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
