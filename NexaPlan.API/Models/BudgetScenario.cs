using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class BudgetScenario
    {
        [Key]
        public int ScenarioID { get; set; }
        public int TenantID { get; set; }               // tenant-level scope
        public string ScenarioName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal AdjustmentMultiplier { get; set; } = 1.0m; // 0.8 = -20%, 1.3 = +30%
        public bool IsActive { get; set; } = false;
        public bool IsArchived { get; set; } = false;
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Legacy fields kept for backward compat
        public int DepartmentID { get; set; } = 0;
        public int TargetYear { get; set; } = DateTime.UtcNow.Year;
        public decimal InflationAssumption { get; set; } = 0;
        public decimal ProjectedSpend { get; set; } = 0;

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
        [ForeignKey("CreatedBy")]
        public User? Creator { get; set; }
    }
}