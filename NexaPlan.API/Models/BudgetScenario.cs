using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class BudgetScenario
    {
        [Key]
        public int ScenarioID { get; set; }
        public int DepartmentID { get; set; }
        public string ScenarioName { get; set; } = string.Empty;
        public int TargetYear { get; set; }
        public decimal InflationAssumption { get; set; }
        public decimal ProjectedSpend { get; set; }
        public DateTime CreatedAt { get; set; }

        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }
    }
}