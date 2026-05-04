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

        // Super Admin extensions
        public string Email { get; set; } = string.Empty;
        public bool MfaEnabled { get; set; } = false;
        public bool IsLocked { get; set; } = false;
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LastLoginAt { get; set; }
        // Stores the last generated temp password so Main Admin can view it
        public string? LastTempPassword { get; set; }

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
        [ForeignKey("RoleID")]
        public Role? Role { get; set; }
        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }
    }
}