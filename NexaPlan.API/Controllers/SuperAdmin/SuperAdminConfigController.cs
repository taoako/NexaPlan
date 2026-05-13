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
            return Ok(configs.GroupBy(c => c.ConfigKey).ToDictionary(g => g.Key, g => g.First().ConfigValue));
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

        // ─── Pricing Plans CRUD ─────────────────────────────────────────────
        [HttpGet("pricing-plans")]
        public async Task<IActionResult> GetPricingPlans()
        {
            var plans = await _context.PricingPlans
                .Include(p => p.Benefits)
                .ToListAsync();
            return Ok(plans);
        }

        [HttpPost("pricing-plans")]
        public async Task<IActionResult> CreatePricingPlan([FromBody] PricingPlan plan)
        {
            plan.CreatedAt = DateTime.UtcNow;
            plan.UpdatedAt = DateTime.UtcNow;
            _context.PricingPlans.Add(plan);
            await _context.SaveChangesAsync();
            return Ok(plan);
        }

        [HttpPut("pricing-plans/{id}")]
        public async Task<IActionResult> UpdatePricingPlan(int id, [FromBody] PricingPlan planUpdate)
        {
            var existing = await _context.PricingPlans
                .Include(p => p.Benefits)
                .FirstOrDefaultAsync(p => p.PlanID == id);
            
            if (existing == null) return NotFound();

            existing.Name = planUpdate.Name;
            existing.Description = planUpdate.Description;
            existing.MonthlyPrice = planUpdate.MonthlyPrice;
            existing.AnnualPrice = planUpdate.AnnualPrice;
            existing.MaxSeats = planUpdate.MaxSeats;
            existing.IsPopular = planUpdate.IsPopular;
            existing.IsActive = planUpdate.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;

            // Simple benefit sync: remove old, add new
            _context.PricingBenefits.RemoveRange(existing.Benefits);
            existing.Benefits = planUpdate.Benefits.Select(b => new PricingBenefit {
                BenefitText = b.BenefitText,
                IsIncluded = b.IsIncluded
            }).ToList();

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("pricing-plans/{id}")]
        public async Task<IActionResult> DeletePricingPlan(int id)
        {
            var plan = await _context.PricingPlans.FindAsync(id);
            if (plan == null) return NotFound();
            _context.PricingPlans.Remove(plan);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Plan deleted." });
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
            var plans = await _context.PricingPlans
                .Where(p => p.IsActive)
                .Include(p => p.Benefits)
                .OrderBy(p => p.MonthlyPrice)
                .ToListAsync();

            if (!plans.Any())
            {
                // Seed some defaults if empty
                var defaults = new List<PricingPlan>
                {
                    new PricingPlan { Name = "Starter", Description = "Perfect for small teams", MonthlyPrice = 4950, AnnualPrice = 4207.5m, MaxSeats = 15, IsPopular = false, Benefits = new() { new() { BenefitText = "Up to 3 budget managers" }, new() { BenefitText = "5 department allocations" }, new() { BenefitText = "Basic forecasting (12 months)" }, new() { BenefitText = "Email support" } } },
                    new PricingPlan { Name = "Professional", Description = "For growing companies", MonthlyPrice = 12900, AnnualPrice = 10965, MaxSeats = 50, IsPopular = true, Benefits = new() { new() { BenefitText = "Up to 15 budget managers" }, new() { BenefitText = "Unlimited departments" }, new() { BenefitText = "AI forecasting (24 months)" }, new() { BenefitText = "Multi-scenario planning" }, new() { BenefitText = "Priority support" } } },
                    new PricingPlan { Name = "Enterprise", Description = "For large organizations", MonthlyPrice = 29900, AnnualPrice = 25415, MaxSeats = 200, IsPopular = false, Benefits = new() { new() { BenefitText = "Unlimited users" }, new() { BenefitText = "Advanced ML forecasting" }, new() { BenefitText = "Custom model training" }, new() { BenefitText = "24/7 phone & chat support" } } }
                };
                _context.PricingPlans.AddRange(defaults);
                await _context.SaveChangesAsync();
                plans = defaults;
            }

            return Ok(plans);
        }
    }
}
