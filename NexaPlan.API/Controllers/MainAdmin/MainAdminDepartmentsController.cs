using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.MainAdmin
{
    [Route("api/main-admin")]
    [ApiController]
    public class MainAdminDepartmentsController : MainAdminBaseController
    {
        public MainAdminDepartmentsController(AppDbContext context) : base(context) { }

        private async Task<string> ResolveDeptLabel(int tenantId)
        {
            var tenant = await _context.Tenants.FindAsync(tenantId);
            return tenant?.OrgType switch
            {
                "Government" => "Bureau",
                "Military" => "Division",
                _ => "Department"
            };
        }

        private async Task<bool> IsMainAdminAsync(int tenantId, int userId)
        {
            if (tenantId == 0 || userId == 0) return false;
            return await _context.Users.AnyAsync(u => u.UserID == userId && u.TenantID == tenantId && u.RoleID == 2);
        }


        private async Task<User?> ResolveDepartmentHeadAsync(int tenantId, int headUserId)
        {
            if (headUserId <= 0) return null;

            return await _context.Users
                .FirstOrDefaultAsync(u => u.UserID == headUserId && u.TenantID == tenantId && u.RoleID == 4);
        }

        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var depts = await _context.Departments.Where(d => d.TenantID == tenantId).ToListAsync();
            var users = await _context.Users.Where(u => u.TenantID == tenantId).ToListAsync();
            var label = await ResolveDeptLabel(tenantId);

            var result = depts.Select(d => new
            {
                departmentId = d.DepartmentID,
                name = d.DepartmentName,
                headUserId = d.HeadUserID ?? users.FirstOrDefault(u => u.DepartmentID == d.DepartmentID && u.RoleID == 4)?.UserID,
                headName = users.FirstOrDefault(u => u.UserID == d.HeadUserID)?.Name
                    ?? users.FirstOrDefault(u => u.DepartmentID == d.DepartmentID && u.RoleID == 4)?.Name
                    ?? "Unassigned",
                memberCount = users.Count(u => u.DepartmentID == d.DepartmentID),
                budgetCap = d.AnnualBudgetCap,
                budgetAccess = d.AnnualBudgetCap > 0
            });

            return Ok(new { departments = result, label });
        }

        [HttpPost("departments")]
        public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentDto request)
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            int userId = GetUserId();
            if (userId == 0) return NoUser();
            if (!await IsMainAdminAsync(tenantId, userId)) return Forbid();

            if (await _context.Departments.AnyAsync(d => d.TenantID == tenantId && d.DepartmentName == request.Name))
                return BadRequest(new { message = "A department with that name already exists." });

            var headUser = await ResolveDepartmentHeadAsync(tenantId, request.HeadUserId);
            if (request.HeadUserId > 0 && headUser == null)
                return BadRequest(new { message = "Selected head must be an active Department Head in this tenant." });

            var dept = new Department
            {
                TenantID = tenantId,
                DepartmentName = request.Name,
                HeadUserID = headUser?.UserID
            };

            _context.Departments.Add(dept);
            await _context.SaveChangesAsync();

            if (headUser != null)
            {
                headUser.DepartmentID = dept.DepartmentID;
                await _context.SaveChangesAsync();
            }

            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = "DEPARTMENT_CREATED", TargetResources = request.Name, IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", TimeStamp = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Department created.", departmentId = dept.DepartmentID });
        }

        [HttpPut("departments/{id:int}")]
        public async Task<IActionResult> UpdateDepartment(int id, [FromBody] UpdateDepartmentDto request)
        {
            int tenantId = GetTenantId();
            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentID == id && d.TenantID == tenantId);
            if (dept == null) return NotFound();

            int userId = GetUserId();
            if (userId == 0) return NoUser();
            if (!await IsMainAdminAsync(tenantId, userId)) return Forbid();

            var previousHeadId = dept.HeadUserID;
            var headUser = await ResolveDepartmentHeadAsync(tenantId, request.HeadUserId);
            if (request.HeadUserId > 0 && headUser == null)
                return BadRequest(new { message = "Selected head must be an active Department Head in this tenant." });

            dept.DepartmentName = request.Name;
            dept.HeadUserID = headUser?.UserID;

            if (previousHeadId.HasValue && previousHeadId != dept.HeadUserID)
            {
                var previousHead = await _context.Users.FirstOrDefaultAsync(u => u.UserID == previousHeadId.Value && u.TenantID == tenantId);
                if (previousHead != null)
                {
                    previousHead.DepartmentID = null;
                }
            }

            if (headUser != null)
            {
                headUser.DepartmentID = dept.DepartmentID;
            }


            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = "DEPARTMENT_UPDATED", TargetResources = request.Name, IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", TimeStamp = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Department updated." });
        }

        [HttpDelete("departments/{id:int}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            int tenantId = GetTenantId();
            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentID == id && d.TenantID == tenantId);
            if (dept == null) return NotFound();

            // Unassign members
            var members = await _context.Users.Where(u => u.DepartmentID == id).ToListAsync();
            foreach (var u in members) u.DepartmentID = null;

            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = "DEPARTMENT_DELETED", TargetResources = dept.DepartmentName, IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", TimeStamp = DateTime.UtcNow });
            _context.Departments.Remove(dept);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Department removed." });
        }
    }
}
