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
    }
}