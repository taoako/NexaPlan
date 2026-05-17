using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.SuperAdmin
{
    [Route("api/super-admin")]
    [ApiController]
    public class SuperAdminAdminsController : SuperAdminBaseController
    {
        public SuperAdminAdminsController(AppDbContext context, IConfiguration configuration) : base(context, configuration) { }

        [HttpGet("admins")]
        public async Task<IActionResult> GetAdmins()
        {
            var admins = await _context.Users
                .Include(u => u.Tenant)
                .Where(u => u.RoleID == 2)
                .OrderByDescending(u => u.UserID)
                .ToListAsync();

            var result = admins.Select(a => {
                
                bool nameIsEmail = a.Name.Contains('@') && !a.Name.Contains(' ');
                string displayName = nameIsEmail
                    ? System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(a.Name.Split('@')[0].Replace('.', ' ').Replace('_', ' '))
                    : (string.IsNullOrWhiteSpace(a.Name) ? a.Email : a.Name);
                string displayEmail = string.IsNullOrEmpty(a.Email) ? a.Name : a.Email;

                return new SuperAdminAdminDto(
                    a.UserID, displayName, displayEmail,
                    a.Tenant?.CompanyName ?? "Unknown",
                    a.MfaEnabled, a.IsLocked,
                    a.LastLoginAt.HasValue ? FormatTimeAgo(a.LastLoginAt.Value) : "Never",
                    a.IsLocked ? "locked" : (a.IsActive ? "active" : "inactive")
                );
            }).ToList();

            return Ok(result);
        }

        [HttpPost("admins")]
        public async Task<IActionResult> CreateAdmin(CreateAdminDto request)
        {
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t =>
                t.CompanyName.Contains(request.Org, StringComparison.OrdinalIgnoreCase));
            int tenantId = tenant?.TenantID ?? 0;

            if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Name == request.Email))
                return BadRequest(new { message = "Email already in use." });

            var tempPassword = $"NexaPlan_{Guid.NewGuid().ToString("N")[..8]}!";
            var user = new User
            {
                Name = $"{request.FirstName} {request.LastName}", Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                TenantID = tenantId, RoleID = 2, IsActive = true
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Admin created. Temp password: {tempPassword}", userId = user.UserID, tempPassword });
        }

        [HttpPut("admins/{id:int}")]
        public async Task<IActionResult> UpdateAdmin(int id, UpdateAdminDto request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "Admin not found." });

            user.Name = request.Name;
            user.Email = request.Email;

            // Find tenant by org name — load all, compare in C# to avoid EF Core translation issues
            if (!string.IsNullOrWhiteSpace(request.Org) && request.Org != "Unknown")
            {
                var allTenants = await _context.Tenants.ToListAsync();
                var tenant = allTenants.FirstOrDefault(t =>
                    string.Equals(t.CompanyName.Trim(), request.Org.Trim(), StringComparison.OrdinalIgnoreCase));
                if (tenant != null) user.TenantID = tenant.TenantID;
            }

            if (!string.IsNullOrWhiteSpace(request.TempPassword))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.TempPassword);
                user.IsLocked = false; user.IsActive = true; user.FailedLoginAttempts = 0;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Admin updated successfully." });
        }


        [HttpPut("admins/{id:int}/lock")]
        public async Task<IActionResult> LockAdmin(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.IsLocked = true; user.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Admin locked." });
        }

        [HttpPut("admins/{id:int}/unlock")]
        public async Task<IActionResult> UnlockAdmin(int id, [FromQuery] bool resetPassword = false)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.IsLocked = false; user.IsActive = true; user.FailedLoginAttempts = 0;

            string? newPassword = null;
            if (resetPassword)
            {
                newPassword = $"NexaPlan_{Guid.NewGuid().ToString("N")[..8]}!";
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = resetPassword ? "Admin unlocked with password reset." : "Admin unlocked.", newPassword });
        }
    }
}
