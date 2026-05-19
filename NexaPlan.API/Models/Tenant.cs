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
        public decimal TotalCompanyBudget { get; set; } = 0;

        // Super Admin extensions
        public string OrgType { get; set; } = "Corporate";          // Corporate | Government
        public string OrgLabel { get; set; } = "Department";        // Department | Bureau
        public string ContactPerson { get; set; } = string.Empty;    // Main admin display name
        public string ContactEmail { get; set; } = string.Empty;     // Main admin email
        public string Phone { get; set; } = string.Empty;
        public bool IsArchived { get; set; } = false;
        public DateTime? ArchivedAt { get; set; }

        // Part 2.1 — Security Policy Settings
        public int SessionTimeoutMinutes { get; set; } = 30;
        public int MinPasswordLength { get; set; } = 8;
        public int MaxFailedLoginAttempts { get; set; } = 5;

        // Part 2.2 — Notification Preferences (JSON)
        public string? NotificationPreferences { get; set; } = "{\"emailOnBudgetOverrun\":true,\"emailOnScenarioActivated\":true,\"emailOnProposalSubmitted\":false,\"emailOnReconciliationCleared\":false,\"emailOnUserInvited\":true}";
    }
}