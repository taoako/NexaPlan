using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class Tenant
    {
        [Key]
        public int TenantID { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string SubscriptionTier { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string RegistrationStatus { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }

        // Super Admin extensions
        public string OrgType { get; set; } = "Corporate";          // Corporate | Government
        public string ContactPerson { get; set; } = string.Empty;    // Main admin display name
        public string ContactEmail { get; set; } = string.Empty;     // Main admin email
        public string Phone { get; set; } = string.Empty;
        public bool IsArchived { get; set; } = false;
        public DateTime? ArchivedAt { get; set; }
    }
}