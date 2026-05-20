using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.FinanceManager
{
    /// <summary>
    /// Shared base for all Finance Manager controllers.
    /// Provides tenant/user resolution from headers.
    /// </summary>
    [Authorize]
    public abstract class FinanceManagerBaseController : ControllerBase
    {
        protected readonly AppDbContext _context;

        protected FinanceManagerBaseController(AppDbContext context)
        {
            _context = context;
        }

        protected int GetTenantId()
        {
            var tenantIdClaim = User.FindFirst("tenantId")?.Value;
            if (int.TryParse(tenantIdClaim, out int tidFromClaim) && tidFromClaim > 0)
            {
                return tidFromClaim;
            }
            if (Request.Headers.TryGetValue("X-Tenant-Id", out var h) && int.TryParse(h, out int tid)) return tid;
            if (Request.Query.TryGetValue("tenantId", out var q) && int.TryParse(q, out int qtid)) return qtid;
            return 0;
        }

        protected int GetUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value 
                           ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int uidFromClaim) && uidFromClaim > 0)
            {
                return uidFromClaim;
            }
            if (Request.Headers.TryGetValue("X-User-Id", out var h) && int.TryParse(h, out int uid)) return uid;
            if (Request.Query.TryGetValue("userId", out var q) && int.TryParse(q, out int quid)) return quid;
            return 0;
        }

        /// <summary>Bug Fix: Reads X-Forwarded-For before falling back to RemoteIpAddress.</summary>
        protected string GetClientIp()
        {
            var forwarded = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwarded))
                return forwarded.Split(',')[0].Trim();
            var realIp = HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(realIp))
                return realIp;
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        protected IActionResult NoTenant() => BadRequest(new { message = "tenantId is required in X-Tenant-Id header." });
        protected IActionResult NoUser() => BadRequest(new { message = "userId is required in X-User-Id header." });
    }
}
