using Microsoft.AspNetCore.Mvc;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.DeptHead
{
    /// <summary>
    /// Shared base for all Department Head controllers.
    /// Provides tenant/user resolution from X-Tenant-Id and X-User-Id headers.
    /// </summary>
    public abstract class DeptHeadBaseController : ControllerBase
    {
        protected readonly AppDbContext _context;

        protected DeptHeadBaseController(AppDbContext context)
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

        protected async Task<int> GetDepartmentIdAsync()
        {
            var userId = GetUserId();
            var tenantId = GetTenantId();
            if (userId == 0 || tenantId == 0) return 0;

            var user = await _context.Users.FindAsync(userId);
            return user?.DepartmentID ?? 0;
        }
    }
}
