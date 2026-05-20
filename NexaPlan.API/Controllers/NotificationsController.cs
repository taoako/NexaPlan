using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using System.Security.Claims;

namespace NexaPlan.API.Controllers
{
    /// <summary>
    /// Serves notifications strictly scoped to the authenticated user's own UserID.
    /// The TenantID join ensures no cross-tenant leakage even if a UserID collision
    /// were to occur across tenants.
    /// </summary>
    [Authorize]
    [Route("api/notifications")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>Resolves the authenticated user's UserID from the JWT claims.</summary>
        private int GetUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var uid) ? uid : 0;
        }

        /// <summary>Resolves the authenticated user's TenantID from the JWT claims.</summary>
        private int GetTenantId()
        {
            var tenantIdClaim = User.FindFirst("tenantId")?.Value;
            return int.TryParse(tenantIdClaim, out var tid) ? tid : 0;
        }

        // GET /api/notifications
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
        {
            var userId   = GetUserId();
            var tenantId = GetTenantId();

            if (userId == 0)
                return Unauthorized(new { message = "Invalid authentication token." });

            // Verify the requesting user actually belongs to the resolved tenant
            // (defence-in-depth: prevents a crafted token with a mismatched tenantId).
            var userExists = await _context.Users
                .AnyAsync(u => u.UserID == userId && u.TenantID == tenantId);

            if (!userExists)
                return Forbid();

            var query = _context.Notifications
                .Join(_context.Users, n => n.UserID, u => u.UserID, (n, u) => new { n, u })
                .Where(c => c.u.TenantID == tenantId && c.n.UserID == userId)
                .OrderByDescending(c => c.n.CreatedAt)
                .Select(c => c.n)
                .AsQueryable();

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            var notifications = await query
                .Take(50)
                .Select(n => new
                {
                    id          = n.NotificationID,
                    message     = n.Message,
                    linkUrl     = n.LinkUrl,
                    isRead      = n.IsRead,
                    createdAt   = n.CreatedAt,
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // PATCH /api/notifications/{id}/read
        [HttpPatch("{id:int}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var userId   = GetUserId();
            var tenantId = GetTenantId();

            if (userId == 0) return Unauthorized(new { message = "Invalid authentication token." });

            var notification = await _context.Notifications
                .Join(_context.Users, n => n.UserID, u => u.UserID, (n, u) => new { n, u })
                .Where(c => c.n.NotificationID == id && c.n.UserID == userId && c.u.TenantID == tenantId)
                .Select(c => c.n)
                .FirstOrDefaultAsync();

            if (notification == null)
                return NotFound(new { message = "Notification not found." });

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Marked as read." });
        }

        // PATCH /api/notifications/read-all
        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var userId   = GetUserId();
            var tenantId = GetTenantId();
            if (userId == 0) return Unauthorized(new { message = "Invalid authentication token." });

            var unread = await _context.Notifications
                .Join(_context.Users, n => n.UserID, u => u.UserID, (n, u) => new { n, u })
                .Where(c => c.n.UserID == userId && !c.n.IsRead && c.u.TenantID == tenantId)
                .Select(c => c.n)
                .ToListAsync();

            foreach (var n in unread) n.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"{unread.Count} notification(s) marked as read." });
        }

        // DELETE /api/notifications/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId   = GetUserId();
            var tenantId = GetTenantId();
            if (userId == 0) return Unauthorized(new { message = "Invalid authentication token." });

            var notification = await _context.Notifications
                .Join(_context.Users, n => n.UserID, u => u.UserID, (n, u) => new { n, u })
                .Where(c => c.n.NotificationID == id && c.n.UserID == userId && c.u.TenantID == tenantId)
                .Select(c => c.n)
                .FirstOrDefaultAsync();

            if (notification == null)
                return NotFound(new { message = "Notification not found." });

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Notification deleted." });
        }
    }
}
