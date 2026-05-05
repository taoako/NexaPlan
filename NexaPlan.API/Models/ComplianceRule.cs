using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class ComplianceRule
    {
        [Key]
        public int RuleID { get; set; }
        public int TenantID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string RuleType { get; set; } = string.Empty;   // e.g. BudgetIncrease, OutsideHours, TwoTierApproval
        public decimal Threshold { get; set; } = 0;            // e.g. 15 for 15% YOY cap
        public bool IsActive { get; set; } = true;
        public bool IsSystemDefault { get; set; } = false;     // system rules cannot be deleted
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
        [ForeignKey("CreatedBy")]
        public User? Creator { get; set; }
    }
}
