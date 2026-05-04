using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class BudgetProposal
    {
        [Key]
        public int ProposalID { get; set; }
        public int TenantID { get; set; }
        public int DepartmentID { get; set; }
        public int CreatedBy { get; set; }
        public int FiscalYear { get; set; }
        public decimal TotalAmount { get; set; }

        // Extended fields for full proposal lifecycle
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "Equipment";
        public string ProposalStatus { get; set; } = "Draft"; // Draft | Pending | ChangesRequested | Approved | Rejected | Frozen
        public string Priority { get; set; } = "High";        // Mission Critical | High | Low
        public string Justification { get; set; } = string.Empty;
        public string? ReviewNotes { get; set; }              // Finance Manager feedback
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }
        [ForeignKey("CreatedBy")]
        public User? Creator { get; set; }
    }
}