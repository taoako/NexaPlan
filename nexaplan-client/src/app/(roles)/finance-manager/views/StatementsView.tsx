import React, { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle2, Loader2, AlertCircle, RefreshCw, FileSignature } from 'lucide-react';
import { financeManagerApi } from '../../../../api/financeManagerApi';

interface Statement {
  id: number;
  title: string;
  statementType: string;
  filePath: string;
  fileSize: string;
  sha256Hash: string;
  taxAmount: number;
  createdAt: string;
  createdBy: number;
}

export function StatementsView() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for generation modal (simplified for inline use)
  const [generateTitle, setGenerateTitle] = useState('Q1 2026 Executive Summary');
  const [generateType, setGenerateType] = useState('Executive Summary');
  const [generateYear, setGenerateYear] = useState(2026);

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeManagerApi.getStatements();
      setStatements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      const newStatement = await financeManagerApi.generateStatement(
        generateTitle,
        generateType,
        generateYear
      );
      setStatements(prev => [newStatement, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate statement');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: number, title: string) => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5214'}/api/finance-manager/statements/${id}/download`, {
        headers: {
          'X-Tenant-Id': user.tenantId?.toString() || '',
          'X-User-Id': user.userId?.toString() || ''
        }
      });
      
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      setError(err.message || 'Failed to download statement');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-blue-600" />
            Financial Statements
          </h1>
          <p className="text-slate-500 mt-1">Generate and manage official, cryptographically signed financial records.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={fetchStatements}
            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Generation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <h2 className="text-lg font-bold text-slate-900 mb-4">Generate New Statement</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Statement Title</label>
            <input 
              type="text" 
              value={generateTitle}
              onChange={e => setGenerateTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              placeholder="e.g. Q1 2026 Executive Summary"
            />
          </div>
          
          <div className="w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Type</label>
            <select 
              value={generateType}
              onChange={e => setGenerateType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            >
              <option value="Executive Summary">Executive Summary</option>
              <option value="Variance Report">Variance Report</option>
              <option value="Annual Audit">Annual Audit</option>
            </select>
          </div>
          
          <div className="w-[120px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Fiscal Year</label>
            <input 
              type="number" 
              value={generateYear}
              onChange={e => setGenerateYear(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="h-[46px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {generating ? 'Generating PDF...' : 'Generate Document'}
          </button>
        </div>
      </div>

      {/* Statements List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900">Document Archive</h2>
          <div className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-100 rounded-md">
            {statements.length} Records
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading document archive...</p>
          </div>
        ) : statements.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium text-slate-600">No statements generated yet</p>
            <p className="text-sm mt-1">Use the panel above to generate your first financial statement.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {statements.map(stmt => (
              <div key={stmt.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{stmt.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                        {stmt.statementType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(stmt.createdAt).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>{stmt.fileSize}</span>
                      <span>•</span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tax Cap: {formatCurrency(stmt.taxAmount)}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                      SHA256: {stmt.sha256Hash.substring(0, 32)}...
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownload(stmt.id, stmt.title)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all shadow-sm opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
