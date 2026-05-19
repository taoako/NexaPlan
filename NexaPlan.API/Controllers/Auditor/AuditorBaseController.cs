using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.Auditor
{
    /// <summary>
    /// Shared base for all Auditor controllers.
    /// Resolves tenant and user from request headers — consistent with MainAdmin/DeptHead/FinanceManager base controllers.
    /// </summary>
    [Authorize]
    public abstract class AuditorBaseController : ControllerBase
    {
        protected readonly AppDbContext _context;

        protected AuditorBaseController(AppDbContext context)
        {
            _context = context;
        }

        protected int GetTenantId()
        {
            if (Request.Headers.TryGetValue("X-Tenant-Id", out var h) && int.TryParse(h, out int tid)) return tid;
            if (Request.Query.TryGetValue("tenantId", out var q) && int.TryParse(q, out int qtid)) return qtid;
            return 0;
        }

        protected int GetUserId()
        {
            if (Request.Headers.TryGetValue("X-User-Id", out var h) && int.TryParse(h, out int uid)) return uid;
            if (Request.Query.TryGetValue("userId", out var q) && int.TryParse(q, out int quid)) return quid;
            return 0;
        }

        /// <summary>
        /// Bug Fix: IP address resolution that handles X-Forwarded-For (proxy/load balancer) correctly.
        /// Falls back to X-Real-IP then to RemoteIpAddress (which may be ::1 on localhost).
        /// </summary>
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
        protected IActionResult NoUser()   => BadRequest(new { message = "userId is required in X-User-Id header." });
    }
}
