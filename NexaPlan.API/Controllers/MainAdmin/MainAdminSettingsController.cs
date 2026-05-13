using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.MainAdmin
{
    [Route("api/main-admin")]
    [ApiController]
    public class MainAdminSettingsController : MainAdminBaseController
    {
        public MainAdminSettingsController(AppDbContext context) : base(context) { }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var settings = await _context.TenantSettings.FirstOrDefaultAsync(s => s.TenantID == tenantId);
            if (settings == null)
            {
                settings = new TenantSetting { TenantID = tenantId, FiscalYearStartMonth = 1, DefaultCurrency = "PHP", RequireMFA = false };
                _context.TenantSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            var tenant = await _context.Tenants.FindAsync(tenantId);

            return Ok(new {
                settingsId = settings.SettingsID,
                fiscalYearStartMonth = settings.FiscalYearStartMonth,
                defaultCurrency = settings.DefaultCurrency,
                requireMfa = settings.RequireMFA,
                totalCompanyBudget = tenant?.TotalCompanyBudget ?? 0,
                // Company Details
                companyName = tenant?.CompanyName ?? "",
                contactPerson = tenant?.ContactPerson ?? "",
                contactEmail = tenant?.ContactEmail ?? "",
                phone = tenant?.Phone ?? ""
            });
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsDto request)
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var settings = await _context.TenantSettings.FirstOrDefaultAsync(s => s.TenantID == tenantId);
            if (settings == null)
            {
                settings = new TenantSetting { TenantID = tenantId };
                _context.TenantSettings.Add(settings);
            }

            settings.FiscalYearStartMonth = request.FiscalYearStartMonth;
            settings.DefaultCurrency = request.DefaultCurrency;
            settings.RequireMFA = request.RequireMfa;

            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant != null)
            {
                tenant.TotalCompanyBudget = request.TotalCompanyBudget;
                tenant.CompanyName = request.CompanyName;
                tenant.ContactPerson = request.ContactPerson;
                tenant.ContactEmail = request.ContactEmail;
                tenant.Phone = request.Phone;
            }

            _context.AuditLogs.Add(new AuditLog { 
                TenantID = tenantId, 
                UserID = GetUserId(), 
                ActionType = "SETTINGS_UPDATED", 
                TargetResources = $"Company: {request.CompanyName}, Budget: ₱{request.TotalCompanyBudget:N0}", 
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", 
                TimeStamp = DateTime.UtcNow 
            });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Settings saved successfully." });
        }

        // ── Company Budget ──────────────────────────────────────────────────
        [HttpGet("budget")]
        public async Task<IActionResult> GetBudget()
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null) return NotFound();
            return Ok(new { totalCompanyBudget = tenant.TotalCompanyBudget });
        }

        [HttpPut("budget")]
        public async Task<IActionResult> SetBudget([FromBody] SetBudgetRequest request)
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null) return NotFound();
            if (request.TotalCompanyBudget < 0) return BadRequest(new { message = "Budget cannot be negative." });
            tenant.TotalCompanyBudget = request.TotalCompanyBudget;
            _context.AuditLogs.Add(new AuditLog
            {
                TenantID = tenantId, UserID = GetUserId(),
                ActionType = "COMPANY_BUDGET_SET",
                TargetResources = $"TotalCompanyBudget=₱{request.TotalCompanyBudget:N0}",
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                TimeStamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Company budget updated successfully." });
        }
    }

    public record SetBudgetRequest(decimal TotalCompanyBudget);
}
