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

            return Ok(new {
                settingsId = settings.SettingsID,
                fiscalYearStartMonth = settings.FiscalYearStartMonth,
                defaultCurrency = settings.DefaultCurrency,
                requireMfa = settings.RequireMFA
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

            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = "SETTINGS_UPDATED", TargetResources = "System Settings", IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", TimeStamp = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Settings saved." });
        }
    }
}
