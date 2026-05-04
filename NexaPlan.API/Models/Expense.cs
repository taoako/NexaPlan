using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class Expense
    {
        [Key]
        public int ExpenseID { get; set; }
        public int TenantID { get; set; }
        public int DepartmentID { get; set; }
        public int ProposalID { get; set; }
        public decimal Amount { get; set; }
        public string ReceiptUrl { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Reconciled, Rejected
        
        public int SubmittedBy { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public int? ReconciledBy { get; set; }
        public DateTime? ReconciledAt { get; set; }

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }
        [ForeignKey("ProposalID")]
        public BudgetProposal? Proposal { get; set; }
        [ForeignKey("SubmittedBy")]
        public User? Submitter { get; set; }
        [ForeignKey("ReconciledBy")]
        public User? Reconciler { get; set; }
    }
}
