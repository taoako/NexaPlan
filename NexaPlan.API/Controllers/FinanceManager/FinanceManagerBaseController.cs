using Microsoft.AspNetCore.Mvc;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.FinanceManager
{
    /// <summary>
    /// Shared base for all Finance Manager controllers.
    /// Provides tenant/user resolution from headers.
    /// </summary>
    public abstract class FinanceManagerBaseController : ControllerBase
    {
        protected readonly AppDbContext _context;

        protected FinanceManagerBaseController(AppDbContext context)
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

        protected IActionResult NoTenant() => BadRequest(new { message = "tenantId is required in X-Tenant-Id header." });
        protected IActionResult NoUser() => BadRequest(new { message = "userId is required in X-User-Id header." });
    }
}
