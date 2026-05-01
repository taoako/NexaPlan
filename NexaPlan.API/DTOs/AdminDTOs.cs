namespace NexaPlan.API.DTOs
{
    public record TenantAdminDto(
        int TenantID,
        string CompanyName,
        string SubscriptionTier,
        bool IsActive,
        string RegistrationStatus,
        DateTime CreatedAt,
        int UserCount,
        string PrimaryAdminEmail,
        string BillingStatus);

    public record TenantUpsertDto(
        string CompanyName,
        string SubscriptionTier,
        bool IsActive,
        string RegistrationStatus);

    public record UserAdminDto(
        int UserID,
        string Name,
        string Email,
        string RoleName,
        int TenantID,
        string TenantName,
        bool IsActive);

    public record UserUpsertDto(
        string Name,
        string Email,
        string Password,
        int TenantID,
        int RoleID,
        bool IsActive);

    public record TrialRequestAdminDto(
        int TenantID,
        string CompanyName,
        string Email,
        string SubscriptionTier,
        bool IsActive,
        string RegistrationStatus,
        DateTime SubmittedAt,
        string PaymentStatus,
        string InvoiceStatus);

    public record InvoiceAdminDto(
        int InvoiceID,
        string InvoiceNumber,
        int TenantID,
        string CompanyName,
        string SubscriptionTier,
        decimal Amount,
        DateTime BillingDate,
        DateTime DueDate,
        string Status);

    public record TrialReviewDto(string? Notes);
}