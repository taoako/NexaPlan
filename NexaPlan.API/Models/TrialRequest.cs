using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class TrialRequest
    {
        [Key]
        public int TrialRequestID { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";            // Pending | Approved | Rejected
        [MaxLength(255)]
        public string? PasswordHash { get; set; }
        public string ReviewNotes { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = "low";             // low | medium | high
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
        public int? ProvisionedTenantID { get; set; }              // links to Tenant after approval
    }
}
