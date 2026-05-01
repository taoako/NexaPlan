using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class Department
    {
        [Key]
        public int DepartmentID { get; set; }
        public int TenantID { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int? HeadUserID { get; set; }
        public decimal AnnualBudgetCap { get; set; }

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
    }
}