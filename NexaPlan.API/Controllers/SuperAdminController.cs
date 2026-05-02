using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers
{
    [Route("api/super-admin")]
    [ApiController]
    public class SuperAdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SuperAdminController(AppDbContext context)
        {
            _context = context;
        }

        // ═══════════════════════════════════════════════
        // DASHBOARD SUMMARY
        // ═══════════════════════════════════════════════

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var tenants = await _context.Tenants.ToListAsync();
            var users = await _context.Users.Where(u => u.RoleID == 2).ToListAsync();
            var invoices = await _context.Invoices.ToListAsync();
            var trials = await _context.TrialRequests.Where(t => t.Status == "Pending").ToListAsync();

            var activeTenants = tenants.Where(t => t.IsActive && !t.IsArchived).ToList();

            var tierPrices = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
            {
                { "Starter", 4950m },
                { "Professional", 12900m },
                { "Enterprise", 29900m }
            };

            var totalMrr = activeTenants.Sum(t =>
                tierPrices.TryGetValue(t.SubscriptionTier, out var price) ? price : 0m);

            var overdueInvoices = invoices.Where(i => !i.Status && i.DueDate < DateTime.UtcNow).ToList();

            return Ok(new SuperAdminSummaryDto(
                TotalTenants: tenants.Count(t => !t.IsArchived),
                ActiveTenants: activeTenants.Count,
                TrialAccounts: tenants.Count(t => t.RegistrationStatus == "Pending" || t.RegistrationStatus == "Trial"),
                OverdueAccounts: overdueInvoices.Select(i => i.TenantID).Distinct().Count(),
                TotalMrr: totalMrr,
                TotalAdmins: users.Count,
                MfaEnabledAdmins: users.Count(u => u.MfaEnabled),
                LockedAdmins: users.Count(u => u.IsLocked),
                PendingTrials: trials.Count,
                TotalInvoices: invoices.Count,
                OverdueAmount: overdueInvoices.Sum(i => i.Amount)
            ));
        }

        // ═══════════════════════════════════════════════
        // TENANTS CRUD
        // ═══════════════════════════════════════════════

        [HttpGet("tenants")]
        public async Task<IActionResult> GetTenants([FromQuery] string? search = null)
        {
            var tenants = await _context.Tenants
                .Where(t => !t.IsArchived)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var users = await _context.Users.ToListAsync();
            var invoices = await _context.Invoices.ToListAsync();

            var tierPrices = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
            {
                { "Starter", 4950m },
                { "Professional", 12900m },
                { "Enterprise", 29900m },
                { "Trial", 0m }
            };

            var result = tenants.Select(t =>
            {
                var userCount = users.Count(u => u.TenantID == t.TenantID);
                var mrr = tierPrices.TryGetValue(t.SubscriptionTier, out var p) ? p : 0m;
                var latestInvoice = invoices
                    .Where(i => i.TenantID == t.TenantID)
                    .OrderByDescending(i => i.InvoiceID)
                    .FirstOrDefault();

                string status;
                string statusColor;
                if (!t.IsActive && t.RegistrationStatus == "Pending")
                {
                    status = "Trial"; statusColor = "yellow";
                }
                else if (latestInvoice != null && !latestInvoice.Status && latestInvoice.DueDate < DateTime.UtcNow)
                {
                    status = "Overdue"; statusColor = "red";
                }
                else if (t.IsActive)
                {
                    status = "Active"; statusColor = "green";
                }
                else
                {
                    status = t.RegistrationStatus; statusColor = "yellow";
                }

                return new SuperAdminTenantDto(
                    t.TenantID, t.CompanyName, t.SubscriptionTier, t.OrgType,
                    t.ContactPerson, t.ContactEmail, t.Phone,
                    t.IsActive, t.IsArchived, t.RegistrationStatus,
                    userCount, mrr, status, statusColor, t.CreatedAt);
            })
            .Where(t => string.IsNullOrWhiteSpace(search)
                || t.CompanyName.Contains(search, StringComparison.OrdinalIgnoreCase)
                || t.ContactEmail.Contains(search, StringComparison.OrdinalIgnoreCase))
            .ToList();

            return Ok(result);
        }

        [HttpPost("tenants")]
        public async Task<IActionResult> ProvisionTenant(ProvisionTenantDto request)
        {
            // 1. Create the tenant
            var tenant = new Tenant
            {
                CompanyName = request.OrgName,
                SubscriptionTier = request.Tier,
                OrgType = request.OrgType,
                ContactPerson = $"{request.AdminFirstName} {request.AdminLastName}",
                ContactEmail = request.AdminEmail,
                IsActive = true,
                RegistrationStatus = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            // 2. Create the Main Admin user
            var tempPassword = $"NexaPlan_{Guid.NewGuid().ToString("N")[..8]}!";
            var user = new User
            {
                Name = $"{request.AdminFirstName} {request.AdminLastName}",
                Email = request.AdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                TenantID = tenant.TenantID,
                RoleID = 2, // Main Admin
                IsActive = true
            };

            _context.Users.Add(user);

            // 3. Log it
            _context.AuditLogs.Add(new AuditLog
            {
                TenantID = tenant.TenantID,
                UserID = 0, // Super Admin
                ActionType = "PROVISION_TENANT",
                TargetResources = $"Tenant: {tenant.CompanyName}, Admin: {request.AdminEmail}",
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                TimeStamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Tenant '{tenant.CompanyName}' provisioned. Temp password: {tempPassword}",
                tenantId = tenant.TenantID,
                tempPassword
            });
        }

        [HttpPut("tenants/{id:int}")]
        public async Task<IActionResult> UpdateTenant(int id, UpdateTenantDto request)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound();

            tenant.CompanyName = request.CompanyName;
            tenant.ContactPerson = request.ContactPerson;
            tenant.ContactEmail = request.ContactEmail;
            tenant.Phone = request.Phone;
            tenant.SubscriptionTier = request.SubscriptionTier;
            tenant.RegistrationStatus = request.RegistrationStatus;
            tenant.IsActive = request.RegistrationStatus == "Active";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Tenant updated." });
        }

        [HttpDelete("tenants/{id:int}")]
        public async Task<IActionResult> ArchiveTenant(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound();

            tenant.IsArchived = true;
            tenant.ArchivedAt = DateTime.UtcNow;
            tenant.IsActive = false;
            tenant.RegistrationStatus = "Archived";

            // Block all users under this tenant
            var users = await _context.Users.Where(u => u.TenantID == id).ToListAsync();
            foreach (var u in users) u.IsActive = false;

            _context.AuditLogs.Add(new AuditLog
            {
                TenantID = id,
                UserID = 0,
                ActionType = "ARCHIVE_TENANT",
                TargetResources = tenant.CompanyName,
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                TimeStamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Tenant archived. Data retained for 30-day grace period." });
        }

        // ═══════════════════════════════════════════════
        // ADMIN ACCOUNTS (Main Admins only)
        // ═══════════════════════════════════════════════

        [HttpGet("admins")]
        public async Task<IActionResult> GetAdmins()
        {
            var admins = await _context.Users
                .Include(u => u.Tenant)
                .Where(u => u.RoleID == 2)
                .OrderByDescending(u => u.UserID)
                .ToListAsync();

            var result = admins.Select(a => new SuperAdminAdminDto(
                a.UserID,
                a.Name,
                string.IsNullOrEmpty(a.Email) ? a.Name : a.Email,
                a.Tenant?.CompanyName ?? "Unknown",
                a.MfaEnabled,
                a.IsLocked,
                a.LastLoginAt.HasValue ? FormatTimeAgo(a.LastLoginAt.Value) : "Never",
                a.IsLocked ? "locked" : (a.IsActive ? "active" : "inactive")
            )).ToList();

            return Ok(result);
        }

        [HttpPost("admins")]
        public async Task<IActionResult> CreateAdmin(CreateAdminDto request)
        {
            // Find or validate the tenant
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t =>
                t.CompanyName.Contains(request.Org, StringComparison.OrdinalIgnoreCase));

            int tenantId = tenant?.TenantID ?? 0;

            if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Name == request.Email))
                return BadRequest(new { message = "Email already in use." });

            var tempPassword = $"NexaPlan_{Guid.NewGuid().ToString("N")[..8]}!";
            var user = new User
            {
                Name = $"{request.FirstName} {request.LastName}",
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                TenantID = tenantId,
                RoleID = 2,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Admin created. Temp password: {tempPassword}", userId = user.UserID, tempPassword });
        }

        [HttpPut("admins/{id:int}")]
        public async Task<IActionResult> UpdateAdmin(int id, UpdateAdminDto request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.Name = request.Name;
            user.Email = request.Email;

            // Try to map org name to tenant
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t =>
                t.CompanyName.Contains(request.Org, StringComparison.OrdinalIgnoreCase));
            if (tenant != null) user.TenantID = tenant.TenantID;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Admin updated." });
        }

        [HttpPut("admins/{id:int}/lock")]
        public async Task<IActionResult> LockAdmin(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.IsLocked = true;
            user.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Admin locked." });
        }

        [HttpPut("admins/{id:int}/unlock")]
        public async Task<IActionResult> UnlockAdmin(int id, [FromQuery] bool resetPassword = false)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.IsLocked = false;
            user.IsActive = true;
            user.FailedLoginAttempts = 0;

            string? newPassword = null;
            if (resetPassword)
            {
                newPassword = $"NexaPlan_{Guid.NewGuid().ToString("N")[..8]}!";
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = resetPassword ? "Admin unlocked with password reset." : "Admin unlocked.", newPassword });
        }

        // ═══════════════════════════════════════════════
        // TRIAL REQUESTS
        // ═══════════════════════════════════════════════

        [HttpGet("trial-requests")]
        public async Task<IActionResult> GetTrialRequests()
        {
            var requests = await _context.TrialRequests
                .OrderByDescending(t => t.SubmittedAt)
                .ToListAsync();

            var result = requests.Select(r => new SuperAdminTrialDto(
                r.TrialRequestID, r.CompanyName, r.ContactName, r.Email,
                r.Phone, r.Status, r.ReviewNotes, r.RiskLevel, r.SubmittedAt
            )).ToList();

            return Ok(result);
        }

        [HttpPut("trial-requests/{id:int}/approve")]
        public async Task<IActionResult> ApproveTrialRequest(int id, TrialReviewActionDto request)
        {
            var trial = await _context.TrialRequests.FindAsync(id);
            if (trial == null) return NotFound();

            trial.Status = "Approved";
            trial.ReviewNotes = request.Notes ?? "Approved by Super Admin.";
            trial.ReviewedAt = DateTime.UtcNow;

            // Provision a new tenant for this trial
            var tenant = new Tenant
            {
                CompanyName = trial.CompanyName,
                SubscriptionTier = "Trial",
                OrgType = "Corporate",
                ContactPerson = trial.ContactName,
                ContactEmail = trial.Email,
                Phone = trial.Phone,
                IsActive = true,
                RegistrationStatus = "Trial",
                CreatedAt = DateTime.UtcNow
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            trial.ProvisionedTenantID = tenant.TenantID;

            // Create Main Admin user
            var tempPassword = $"Trial_{Guid.NewGuid().ToString("N")[..8]}!";
            _context.Users.Add(new User
            {
                Name = trial.ContactName,
                Email = trial.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                TenantID = tenant.TenantID,
                RoleID = 2,
                IsActive = true
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Trial approved. 14-day countdown started. Temp password: {tempPassword}" });
        }

        [HttpPut("trial-requests/{id:int}/reject")]
        public async Task<IActionResult> RejectTrialRequest(int id, TrialReviewActionDto request)
        {
            var trial = await _context.TrialRequests.FindAsync(id);
            if (trial == null) return NotFound();

            trial.Status = "Rejected";
            trial.ReviewNotes = request.Notes ?? "Rejected by Super Admin.";
            trial.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Trial rejected. Domain '{trial.Email.Split('@').LastOrDefault()}' flagged." });
        }

        // ═══════════════════════════════════════════════
        // INVOICES
        // ═══════════════════════════════════════════════

        [HttpGet("invoices")]
        public async Task<IActionResult> GetInvoices()
        {
            var tenants = await _context.Tenants.ToDictionaryAsync(t => t.TenantID, t => t);
            var invoices = await _context.Invoices.OrderByDescending(i => i.InvoiceID).ToListAsync();

            var result = invoices.Select(inv =>
            {
                tenants.TryGetValue(inv.TenantID, out var tenant);
                var status = inv.Status ? "Paid" : (inv.DueDate < DateTime.UtcNow ? "Overdue" : "Pending");
                if (!string.IsNullOrEmpty(inv.StatusLabel) && inv.StatusLabel == "Refunded") status = "Refunded";

                return new SuperAdminInvoiceDto(
                    inv.InvoiceID,
                    $"INV-{inv.InvoiceID:D6}",
                    inv.TenantID,
                    tenant?.CompanyName ?? "Unknown",
                    inv.Amount,
                    string.IsNullOrEmpty(inv.PaymentMethod) ? "Credit Card" : inv.PaymentMethod,
                    inv.PayMongoPaymentIntentId,
                    inv.DueDate,
                    status,
                    status == "Paid" ? "green" : status == "Overdue" ? "red" : status == "Refunded" ? "gray" : "yellow"
                );
            }).ToList();

            return Ok(result);
        }

        [HttpPut("invoices/{id:int}/refund")]
        public async Task<IActionResult> RefundInvoice(int id, [FromQuery] decimal? partialAmount = null)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            invoice.StatusLabel = "Refunded";
            invoice.Status = false;

            if (partialAmount.HasValue && partialAmount.Value < invoice.Amount)
            {
                invoice.Amount -= partialAmount.Value;
                invoice.StatusLabel = "Partial Refund";
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Refund processed for INV-{id:D6}." });
        }

        // ═══════════════════════════════════════════════
        // SYSTEM CONFIGURATION
        // ═══════════════════════════════════════════════

        [HttpGet("config")]
        public async Task<IActionResult> GetConfig()
        {
            var configs = await _context.SystemConfigs.ToListAsync();
            var dict = configs.ToDictionary(c => c.ConfigKey, c => c.ConfigValue);
            return Ok(dict);
        }

        [HttpPut("config")]
        public async Task<IActionResult> UpdateConfig([FromBody] Dictionary<string, string> updates)
        {
            foreach (var kvp in updates)
            {
                var existing = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == kvp.Key);
                if (existing != null)
                {
                    existing.ConfigValue = kvp.Value;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.SystemConfigs.Add(new SystemConfig
                    {
                        ConfigKey = kvp.Key,
                        ConfigValue = kvp.Value,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Configuration saved." });
        }

        // ═══════════════════════════════════════════════
        // HELPERS
        // ═══════════════════════════════════════════════

        private static string FormatTimeAgo(DateTime dateTime)
        {
            var span = DateTime.UtcNow - dateTime;
            if (span.TotalMinutes < 1) return "Just now";
            if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes}m ago";
            if (span.TotalHours < 24) return $"{(int)span.TotalHours}h ago";
            if (span.TotalDays < 7) return $"{(int)span.TotalDays}d ago";
            return dateTime.ToString("MMM dd, yyyy");
        }
    }
}
