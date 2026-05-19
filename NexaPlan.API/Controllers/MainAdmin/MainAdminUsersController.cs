using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;
using NexaPlan.API.Helpers;

namespace NexaPlan.API.Controllers.MainAdmin
{
    [Route("api/main-admin")]
    [ApiController]
    public class MainAdminUsersController : MainAdminBaseController
    {
        private readonly IConfiguration _config;

        public MainAdminUsersController(AppDbContext context, IConfiguration config) : base(context) 
        { 
            _config = config;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var users = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .Where(u => u.TenantID == tenantId && u.RoleID != 2) // exclude Main Admin self
                .OrderByDescending(u => u.UserID)
                .ToListAsync();

            return Ok(users.Select(u => new {
                userId = u.UserID,
                name = u.Name,
                email = u.Email,
                role = u.Role?.RoleName ?? "Unknown",
                roleId = u.RoleID,
                department = u.Department?.DepartmentName ?? "Unassigned",
                departmentId = u.DepartmentID,
                status = u.IsLocked ? "Suspended" : (u.IsActive ? "Active" : "Pending"),
                isLocked = u.IsLocked,
                isActive = u.IsActive,
                mfaEnabled = u.MfaEnabled,
                lastLogin = u.LastLoginAt.HasValue ? u.LastLoginAt.Value.ToString("yyyy-MM-dd HH:mm") : "Never",
                lastTempPassword = u.LastTempPassword  // surface stored temp password for admin view
            }));
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto request)
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var tenant = await _context.Tenants.FindAsync(tenantId);
            var userCount = await _context.Users.CountAsync(u => u.TenantID == tenantId && u.RoleID != 2); // exclude Main Admin
            var maxUsers = TierFeatures.MaxUsers(tenant?.SubscriptionTier ?? "Trial");

            if (maxUsers != int.MaxValue && userCount >= maxUsers)
                return BadRequest(new {
                    error = $"Your {tenant?.SubscriptionTier ?? "Trial"} plan allows a maximum of {maxUsers} users. Upgrade to add more."
                });

            if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.TenantID == tenantId))
                return BadRequest(new { message = "Email already in use within this organization." });

            var tempPassword = $"Nexaplan@{Guid.NewGuid().ToString("N")[..6]}!";

// Finance Manager (RoleID = 3) should not be assigned to a department
            int? deptId = (request.RoleId == 3) ? null : (request.DepartmentId > 0 ? request.DepartmentId : null);

            var user = new User {
                TenantID = tenantId,
                RoleID = request.RoleId,
                DepartmentID = deptId,
                Name = request.Name,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                LastTempPassword = tempPassword,
                IsActive = false,
            };

            _context.Users.Add(user);
            _context.AuditLogs.Add(new AuditLog {
                TenantID = tenantId, UserID = request.RequestedByUserId,
                ActionType = "USER_INVITED", TargetResources = $"{request.Name} ({request.Email})",
                IPAddress = GetClientIp(),
                TimeStamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Trigger notification
            _ = NotificationDispatcher.DispatchEmailIfEnabledAsync(
                _context, _config, tenantId,
                "emailOnUserInvited",
                "You've been invited to NexaPlan",
                $"Hello {request.Name},\n\nYou have been invited to join your organization's NexaPlan workspace.\nYour temporary password is: {tempPassword}\n\nPlease log in and change your password immediately.",
                request.Email
            );

            return Ok(new { message = "User invited.", userId = user.UserID, tempPassword });
        }

        [HttpPut("users/{id:int}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto request)
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id && u.TenantID == tenantId);
            if (user == null) return NotFound(new { message = "User not found." });

            user.Name = request.Name;
            user.Email = request.Email;
            user.RoleID = request.RoleId;

            // Finance Manager (RoleID = 3) should NOT be assigned to a department
            user.DepartmentID = (request.RoleId == 3) ? null : (request.DepartmentId > 0 ? request.DepartmentId : null);

            if (!string.IsNullOrWhiteSpace(request.TempPassword))
            {
                var currentTenant = await _context.Tenants.FindAsync(tenantId);
                int minLen = currentTenant?.MinPasswordLength ?? 8;
                if (request.TempPassword.Length < minLen)
                    return BadRequest(new { message = $"Password must be at least {minLen} characters long according to your organization's security policy." });

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.TempPassword);
                user.LastTempPassword = request.TempPassword;
                user.IsLocked = false;
                user.IsActive = true;
                user.FailedLoginAttempts = 0;
            }

            _context.AuditLogs.Add(new AuditLog {
                TenantID = tenantId, UserID = request.RequestedByUserId,
                ActionType = "USER_UPDATED", TargetResources = $"{user.Name} ({user.Email})",
                IPAddress = GetClientIp(),
                TimeStamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "User updated." });
        }

        [HttpPut("users/{id:int}/suspend")]
        public async Task<IActionResult> SuspendUser(int id)
        {
            int tenantId = GetTenantId();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id && u.TenantID == tenantId);
            if (user == null) return NotFound();

            user.IsLocked = true; user.IsActive = false;
            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = "USER_SUSPENDED", TargetResources = user.Name, IPAddress = GetClientIp(), TimeStamp = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            return Ok(new { message = "User suspended." });
        }

        [HttpPut("users/{id:int}/activate")]
        public async Task<IActionResult> ActivateUser(int id)
        {
            int tenantId = GetTenantId();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id && u.TenantID == tenantId);
            if (user == null) return NotFound();

            user.IsLocked = false; user.IsActive = true; user.FailedLoginAttempts = 0;
            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = "USER_ACTIVATED", TargetResources = user.Name, IPAddress = GetClientIp(), TimeStamp = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            return Ok(new { message = "User activated." });
        }

        [HttpDelete("users/{id:int}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            int tenantId = GetTenantId();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id && u.TenantID == tenantId);
            if (user == null) return NotFound();
            if (user.RoleID == 2) return BadRequest(new { message = "Cannot remove the Main Admin account." });

            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = "USER_DELETED", TargetResources = $"{user.Name} ({user.Email})", IPAddress = GetClientIp(), TimeStamp = DateTime.UtcNow });
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User removed." });
        }

        [HttpPost("users/bulk-action")]
        public async Task<IActionResult> BulkAction([FromBody] BulkUserActionDto request)
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var users = await _context.Users.Where(u => request.UserIds.Contains(u.UserID) && u.TenantID == tenantId).ToListAsync();

            foreach (var u in users)
            {
                switch (request.Action.ToLower())
                {
                    case "suspend":   u.IsLocked = true; u.IsActive = false; break;
                    case "activate":  u.IsLocked = false; u.IsActive = true; u.FailedLoginAttempts = 0; break;
                    case "assign-role": if (request.RoleId.HasValue) u.RoleID = request.RoleId.Value; break;
                    case "delete":    if (u.RoleID != 2) _context.Users.Remove(u); break;
                }
            }

            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = $"BULK_{request.Action.ToUpper()}", TargetResources = $"{users.Count} users", IPAddress = GetClientIp(), TimeStamp = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Bulk '{request.Action}' applied to {users.Count} users." });
        }
    }
}
