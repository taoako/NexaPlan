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
        public decimal TaxPaid { get; set; } = 0; // VAT amount from receipt
        public string ReceiptUrl { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending_Reconciliation"; // Pending_Reconciliation, Reconciled, Rejected

        public int SubmittedBy { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpenseDate { get; set; } // When the expense was actually incurred

        public int? ReconciledBy { get; set; }
        public DateTime? ReconciledAt { get; set; }

        [NotMapped]
        public decimal ActualAmountPaid
        {
            get => Amount;
            set => Amount = value;
        }

        [NotMapped]
        public decimal TaxAmount
        {
            get => TaxPaid;
            set => TaxPaid = value;
        }

        [NotMapped]
        public string ReceiptFileURL
        {
            get => ReceiptUrl;
            set => ReceiptUrl = value;
        }

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
