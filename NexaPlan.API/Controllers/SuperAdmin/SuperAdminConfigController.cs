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
}
