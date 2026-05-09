import React, { useState, useEffect } from 'react';
import { Download, FileText, Lock, Eye, CheckCircle2 } from 'lucide-react';
import { auditorApi } from '../../../../api/auditorApi';

import { useAuditorModal } from '../ComplianceAuditSystem';

export function FinancialStatementsView() {
  const { showAlert } = useAuditorModal();
  const [statements, setStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessHistory, setAccessHistory] = useState<any[]>([]);
  const [viewingHistoryId, setViewingHistoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      const data = await auditorApi.getStatements();
      setStatements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number, name: string) => {
    try {
      await auditorApi.logAccess(id, 'Download');
      showAlert('Success', `Downloading: ${name}\n\nAccess has been logged securely.`, 'success');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to download statement', 'error');
    }
  };

  const handleViewHistory = async (id: number) => {
    if (viewingHistoryId === id) {
      setViewingHistoryId(null);
      return;
    }
    try {
      const history = await auditorApi.getAccessLog(id);
      setAccessHistory(history);
      setViewingHistoryId(id);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to fetch access history', 'error');
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-[28px] font-black text-slate-900">Financial Statements</h2>
        <p className="text-slate-500 mt-1 font-medium">Read-only repository of finalized and hashed financial records.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 shadow-sm">Loading statements...</div>
        ) : statements.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                  <FileText className="w-7 h-7 text-[#4F46E5]" />
                </div>
                <div>
                  <h3 className="font-black text-[17px] text-slate-900 leading-tight">{doc.name}</h3>
                  <div className="flex items-center gap-4 mt-1.5 text-sm font-medium text-slate-500">
                    <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">{doc.fileType}</span>
                    <span>{doc.date}</span>
                    <span>{doc.fileSize}</span>
                  </div>
                  {/* Integrity Hash */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-bold text-slate-500">SHA-256:</span>
                    <span className="font-mono text-slate-400 truncate max-w-[250px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200" title={doc.sha256Hash}>
                      {doc.sha256Hash}
                    </span>
                  </div>
                  {/* Tax Capitalized */}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="font-bold text-amber-600">Total Tax Capitalized:</span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {doc.totalTaxCapitalized != null
                        ? `₱${Number(doc.totalTaxCapitalized).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'N/A — reconcile expenses to populate'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewHistory(doc.id)}
                    className="p-2.5 text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                    title="View Access History"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc.id, doc.name)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Access History Panel */}
            {viewingHistoryId === doc.id && (
              <div className="bg-slate-50 border-t border-slate-200 p-5 animate-in slide-in-from-top-2">
                <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Access Tracking Log
                </div>
                {accessHistory.length === 0 ? (
                  <div className="text-sm text-slate-500 italic">No access records found.</div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-auto pr-2">
                    {accessHistory.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${log.accessType === 'Download' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {log.accessType}
                          </span>
                          <span className="font-bold text-slate-700">{log.accessor}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 text-xs">
                          <span className="font-mono">{log.ip}</span>
                          <span>{log.accessedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
