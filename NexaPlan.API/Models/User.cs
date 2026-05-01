using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class User
    {
        [Key]
        public int UserID { get; set; }
        public int TenantID { get; set; }
        public int RoleID { get; set; }
        public int? DepartmentID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool IsActive { get; set; }

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
        [ForeignKey("RoleID")]
        public Role? Role { get; set; }
        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }
    }
}