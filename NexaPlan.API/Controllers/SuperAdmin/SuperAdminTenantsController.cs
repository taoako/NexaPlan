using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.SuperAdmin
{
    [Route("api/super-admin")]
    [ApiController]
    public class SuperAdminTenantsController : SuperAdminBaseController
    {
        public SuperAdminTenantsController(AppDbContext context, IConfiguration configuration) : base(context, configuration) { }

        private static readonly Dictionary<string, decimal> TierPrices = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Starter", 4950m }, { "Professional", 12900m }, { "Enterprise", 29900m }, { "Trial", 0m }
        };

        [HttpGet("tenants")]
        public async Task<IActionResult> GetTenants([FromServices] IHttpClientFactory clientFactory, [FromQuery] string? search = null)
        {
            await SyncPendingPaymentsAsync(clientFactory);
            var tenants = await _context.Tenants.Where(t => !t.IsArchived).OrderByDescending(t => t.CreatedAt).ToListAsync();
            var users = await _context.Users.ToListAsync();
            var invoices = await _context.Invoices.ToListAsync();

            var result = tenants.Select(t =>
            {
                var userCount = users.Count(u => u.TenantID == t.TenantID);
                var mrr = TierPrices.TryGetValue(t.SubscriptionTier, out var p) ? p : 0m;
                var latestInvoice = invoices.Where(i => i.TenantID == t.TenantID).OrderByDescending(i => i.InvoiceID).FirstOrDefault();
                string status, statusColor;

                if (!t.IsActive && t.RegistrationStatus == "Pending") { status = "Trial"; statusColor = "yellow"; }
                else if (latestInvoice != null && !latestInvoice.Status && latestInvoice.DueDate < DateTime.UtcNow) { status = "Overdue"; statusColor = "red"; }
                else if (t.IsActive) { status = "Active"; statusColor = "green"; }
                else { status = t.RegistrationStatus; statusColor = "yellow"; }

                return new SuperAdminTenantDto(t.TenantID, t.CompanyName, t.SubscriptionTier, t.OrgType,
                    t.ContactPerson, t.ContactEmail, t.Phone, t.IsActive, t.IsArchived, t.RegistrationStatus,
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
            var tenant = new Tenant
            {
                CompanyName = request.OrgName, SubscriptionTier = request.Tier, 
                OrgType = "Corporate", OrgLabel = "Department",
                ContactPerson = $"{request.AdminFirstName} {request.AdminLastName}",
                ContactEmail = request.AdminEmail, IsActive = true, RegistrationStatus = "Active", CreatedAt = DateTime.UtcNow
            };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            var tempPassword = $"NexaPlan_{Guid.NewGuid().ToString("N")[..8]}!";
            var user = new User
            {
                Name = $"{request.AdminFirstName} {request.AdminLastName}", Email = request.AdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                TenantID = tenant.TenantID, RoleID = 2, IsActive = true
            };
            _context.Users.Add(user);

            _context.AuditLogs.Add(new AuditLog {
                TenantID = tenant.TenantID, UserID = 0, ActionType = "PROVISION_TENANT",
                TargetResources = $"Tenant: {tenant.CompanyName}, Admin: {request.AdminEmail}",
                IPAddress = GetClientIp(), TimeStamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Tenant '{tenant.CompanyName}' provisioned.", tenantId = tenant.TenantID, tempPassword });
        }

        [HttpPut("tenants/{id:int}")]
        public async Task<IActionResult> UpdateTenant(int id, UpdateTenantDto request)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound();

            tenant.CompanyName = request.CompanyName; tenant.ContactPerson = request.ContactPerson;
            tenant.ContactEmail = request.ContactEmail; tenant.Phone = request.Phone;
            tenant.SubscriptionTier = request.SubscriptionTier; tenant.RegistrationStatus = request.RegistrationStatus;
            tenant.IsActive = request.RegistrationStatus == "Active";

            if (!string.IsNullOrWhiteSpace(request.TempPassword))
            {
                var mainAdmin = await _context.Users.FirstOrDefaultAsync(u => u.TenantID == id && u.RoleID == 2);
                if (mainAdmin != null) { mainAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.TempPassword); mainAdmin.IsLocked = false; mainAdmin.IsActive = true; }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Tenant updated successfully." });
        }

        [HttpDelete("tenants/{id:int}")]
        public async Task<IActionResult> ArchiveTenant(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound();

            tenant.IsArchived = true; tenant.ArchivedAt = DateTime.UtcNow;
            tenant.IsActive = false; tenant.RegistrationStatus = "Archived";

            var users = await _context.Users.Where(u => u.TenantID == id).ToListAsync();
            foreach (var u in users) u.IsActive = false;

            _context.AuditLogs.Add(new AuditLog {
                TenantID = id, UserID = 0, ActionType = "ARCHIVE_TENANT", TargetResources = tenant.CompanyName,
                IPAddress = GetClientIp(), TimeStamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tenant archived. Data retained for 30-day grace period." });
        }

        [HttpPost("tenants/{id:int}/impersonate")]
        public async Task<IActionResult> ImpersonateTenant(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound();

            var mainAdmin = await _context.Users.FirstOrDefaultAsync(u => u.TenantID == id && u.RoleID == 2);
            if (mainAdmin == null) return BadRequest(new { message = "No admin user found for this tenant." });

            return Ok(new {
                token = "impersonation_token_placeholder",
                email = mainAdmin.Email, tenantId = tenant.TenantID,
                userId = mainAdmin.UserID, role = "MainAdmin"
            });
        }
    }
}
