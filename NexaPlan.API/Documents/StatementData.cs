using System;
using System.Collections.Generic;
using NexaPlan.API.Models;

namespace NexaPlan.API.Documents
{
    public class StatementData
    {
        public string Title { get; set; } = string.Empty;
        public string StatementType { get; set; } = string.Empty;
        public string PeriodLabel { get; set; } = string.Empty;
        public int FiscalYear { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string GeneratorName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyEmail { get; set; } = string.Empty;
        public string CompanyPhone { get; set; } = string.Empty;
        public string SubscriptionTier { get; set; } = string.Empty;
        public string Sha256Hash { get; set; } = string.Empty;

        // Summary figures
        public decimal TotalAllocated { get; set; }
        public decimal TotalCommitted { get; set; }
        public decimal TotalActual { get; set; }
        public decimal TotalTax { get; set; }
        public decimal TotalVariance { get; set; }
        public decimal UtilizationPct { get; set; }
        public decimal PendingRisk { get; set; }

        // Detail rows
        public List<DeptRow> DeptRows { get; set; } = new();
        public List<BudgetProposal> PendingProposals { get; set; } = new();
        public List<AuditLog> RecentLogs { get; set; } = new();
    }

    public class DeptRow
    {
        public int DepartmentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal AllocatedCap { get; set; }
        public decimal Committed { get; set; }
        public decimal ActualSpent { get; set; }
        public decimal TaxPaid { get; set; }
        public decimal Variance { get; set; }
        public decimal UtilizationPct { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
