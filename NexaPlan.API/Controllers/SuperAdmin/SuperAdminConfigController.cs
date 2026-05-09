using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.SuperAdmin
{
    [Route("api/super-admin")]
    [ApiController]
    public class SuperAdminConfigController : SuperAdminBaseController
    {
        public SuperAdminConfigController(AppDbContext context, IConfiguration configuration) : base(context, configuration) { }

        [HttpGet("config")]
        public async Task<IActionResult> GetConfig()
        {
            var configs = await _context.SystemConfigs.ToListAsync();
            return Ok(configs.ToDictionary(c => c.ConfigKey, c => c.ConfigValue));
        }

        [HttpPut("config")]
        public async Task<IActionResult> UpdateConfig([FromBody] Dictionary<string, string> updates)
        {
            foreach (var kvp in updates)
            {
                var existing = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == kvp.Key);
                if (existing != null)
                { existing.ConfigValue = kvp.Value; existing.UpdatedAt = DateTime.UtcNow; }
                else
                {
                    _context.SystemConfigs.Add(new SystemConfig {
                        ConfigKey = kvp.Key, ConfigValue = kvp.Value, UpdatedAt = DateTime.UtcNow
                    });
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Configuration saved." });
        }
    }

    // ─── Public pricing endpoint (no auth needed) ───────────────────────────
    [Route("api")]
    [ApiController]
    public class PricingController : ControllerBase
    {
        private readonly AppDbContext _context;
        public PricingController(AppDbContext context) { _context = context; }

        [HttpGet("pricing")]
        public async Task<IActionResult> GetPricing()
        {
            var pricingKeys = new[] {
                "price_starter_monthly", "price_starter_annual",
                "price_professional_monthly", "price_professional_annual",
                "price_enterprise_monthly", "price_enterprise_annual",
                "pricing_vat_inclusive"
            };
            var configs = await _context.SystemConfigs
                .Where(c => pricingKeys.Contains(c.ConfigKey))
                .ToListAsync();
            return Ok(configs.ToDictionary(c => c.ConfigKey, c => c.ConfigValue));
        }
    }
}
