using Microsoft.AspNetCore.Mvc;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.MainAdmin
{
    /// <summary>
    /// Shared base for all Main Admin controllers.
    /// Provides tenant resolution from the X-Tenant-Id header.
    /// </summary>
    public abstract class MainAdminBaseController : ControllerBase
    {
        protected readonly AppDbContext _context;

        protected MainAdminBaseController(AppDbContext context)
        {
            _context = context;
        }

        protected int GetTenantId()
        {
            if (Request.Headers.TryGetValue("X-Tenant-Id", out var h) && int.TryParse(h, out int tid)) return tid;
            if (Request.Query.TryGetValue("tenantId", out var q) && int.TryParse(q, out int qtid)) return qtid;
            return 0;
        }

        protected IActionResult NoTenant() => BadRequest(new { message = "tenantId is required in X-Tenant-Id header." });
    }
}
