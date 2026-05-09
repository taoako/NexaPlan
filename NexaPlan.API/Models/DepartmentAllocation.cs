using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class DepartmentAllocation
    {
        [Key]
        public int AllocationID { get; set; }
        public int TenantID { get; set; }
        public int DepartmentID { get; set; }
        public int FiscalYear { get; set; }
        public decimal TotalAllocatedCap { get; set; }
        public int SetByAdminID { get; set; }
        public DateTime SetAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }
        [ForeignKey("SetByAdminID")]
        public User? SetByAdmin { get; set; }
    }
}
