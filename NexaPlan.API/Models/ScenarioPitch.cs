using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class ScenarioPitch
    {
        [Key]
        public int     PitchId           { get; set; }
        public int     DepartmentId      { get; set; }
        public int     TenantId          { get; set; }
        public int?    ScenarioId        { get; set; }  // FK → BudgetScenario (nullable for custom slider pitches)
        public decimal CustomMultiplier  { get; set; }
        public string  PitchTitle        { get; set; } = string.Empty;
        public string  Justification     { get; set; } = string.Empty;
        public string  PitchDecisions    { get; set; } = "[]"; // JSON array stored as string
        public string  Status            { get; set; } = "Pending Review"; // "Pending Review" | "Acknowledged"
        public int     SubmittedByUserId { get; set; }
        public DateTime SubmittedAt      { get; set; } = DateTime.UtcNow;

        [ForeignKey("DepartmentId")]
        public Department? Department { get; set; }

        [ForeignKey("TenantId")]
        public Tenant? Tenant { get; set; }

        [ForeignKey("ScenarioId")]
        public BudgetScenario? Scenario { get; set; }
    }
}
