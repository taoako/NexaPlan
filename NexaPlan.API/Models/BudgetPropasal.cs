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
        public bool Status { get; set; }

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }
        [ForeignKey("CreatedBy")]
        public User? Creator { get; set; }
    }
}