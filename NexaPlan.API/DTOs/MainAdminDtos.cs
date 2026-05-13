namespace NexaPlan.API.DTOs
{
    // ─── User DTOs ───
    public record CreateUserDto(string Name, string Email, int RoleId, int DepartmentId, int RequestedByUserId);
    public record UpdateUserDto(string Name, string Email, int RoleId, int DepartmentId, int RequestedByUserId, string? TempPassword = null);
    public record BulkUserActionDto(List<int> UserIds, string Action, int? RoleId = null);

    // ─── Department DTOs ───
    public record CreateDepartmentDto(string Name, int HeadUserId);
    public record UpdateDepartmentDto(string Name, int HeadUserId);

    // ─── Settings DTOs ───
    public record UpdateSettingsDto(
        int FiscalYearStartMonth, 
        string DefaultCurrency, 
        bool RequireMfa, 
        decimal TotalCompanyBudget,
        string CompanyName,
        string ContactPerson,
        string ContactEmail,
        string Phone
    );

    // ─── Billing DTOs ───
    public record BillingActionDto(string Action, string? NewTier = null);
}
