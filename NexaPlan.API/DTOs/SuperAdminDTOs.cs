namespace NexaPlan.API.DTOs
{
    // === TENANT DTOs ===
    public record SuperAdminTenantDto(
        int TenantID,
        string CompanyName,
        string SubscriptionTier,
        string OrgType,
        string ContactPerson,
        string ContactEmail,
        string Phone,
        bool IsActive,
        bool IsArchived,
        string RegistrationStatus,
        int UserCount,
        decimal Mrr,
        string Status,
        string StatusColor,
        DateTime CreatedAt);

    public record ProvisionTenantDto(
        string OrgName,
        string OrgType,
        string AdminFirstName,
        string AdminLastName,
        string AdminEmail,
        string Tier);

    public record UpdateTenantDto(
        string CompanyName,
        string ContactPerson,
        string ContactEmail,
        string Phone,
        string SubscriptionTier,
        string RegistrationStatus);

    // === ADMIN DTOs ===
    public record SuperAdminAdminDto(
        int UserID,
        string Name,
        string Email,
        string Org,
        bool MfaEnabled,
        bool IsLocked,
        string LastLogin,
        string Status);

    public record CreateAdminDto(
        string FirstName,
        string LastName,
        string Email,
        string Org);

    public record UpdateAdminDto(
        string Name,
        string Email,
        string Org);

    // === TRIAL REQUEST DTOs ===
    public record SuperAdminTrialDto(
        int TrialRequestID,
        string CompanyName,
        string ContactName,
        string Email,
        string Phone,
        string Status,
        string ReviewNotes,
        string RiskLevel,
        DateTime SubmittedAt);

    public record TrialReviewActionDto(string? Notes);

    // === INVOICE DTOs ===
    public record SuperAdminInvoiceDto(
        int InvoiceID,
        string InvoiceNumber,
        int TenantID,
        string TenantName,
        decimal Amount,
        string PaymentMethod,
        string PayMongoPaymentIntentId,
        DateTime DueDate,
        string Status,
        string StatusColor);

    // === CONFIG DTOs ===
    public record SystemConfigDto(string Key, string Value);

    // === SUMMARY ===
    public record SuperAdminSummaryDto(
        int TotalTenants,
        int ActiveTenants,
        int TrialAccounts,
        int OverdueAccounts,
        decimal TotalMrr,
        int TotalAdmins,
        int MfaEnabledAdmins,
        int LockedAdmins,
        int PendingTrials,
        int TotalInvoices,
        decimal OverdueAmount);
}
