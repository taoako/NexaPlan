using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class WorkflowRule
    {
        [Key]
        public int RuleID { get; set; }
        public int TenantID { get; set; }
        public int? DepartmentID { get; set; }
        public decimal MinAmount { get; set; }
        public int RequiredRoleID { get; set; }

        [ForeignKey("RequiredRoleID")]
        public Role? RequiredRole { get; set; }
    }
}