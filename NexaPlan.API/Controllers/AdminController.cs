using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var tenants = await _context.Tenants.ToListAsync();
            var users = await _context.Users.ToListAsync();
            var sessions = await _context.PaymentSessions.ToListAsync();
            var invoices = await _context.Invoices.ToListAsync();

            return Ok(new
            {
                totalTenants = tenants.Count,
                activeTenants = tenants.Count(t => t.IsActive),
                pendingTrials = tenants.Count(t => t.RegistrationStatus.Contains("Pending", StringComparison.OrdinalIgnoreCase)),
                totalAdmins = users.Count(u => u.RoleID == 1 || u.RoleID == 2),
                totalUsers = users.Count,
                pendingInvoices = invoices.Count(i => !i.Status),
                paidInvoices = invoices.Count(i => i.Status),
                paymentSessions = sessions.Count,
                totalRevenue = invoices.Where(i => i.Status).Sum(i => i.Amount)
            });
        }

        [HttpGet("tenants")]
        public async Task<ActionResult<IEnumerable<TenantAdminDto>>> GetTenants([FromQuery] string? search = null)
        {
            var tenants = await _context.Tenants.OrderByDescending(t => t.CreatedAt).ToListAsync();
            var users = await _context.Users.ToListAsync();
            var invoices = await _context.Invoices.ToListAsync();

            var result = tenants
                .Select(tenant =>
                {
                    var tenantUsers = users.Where(u => u.TenantID == tenant.TenantID).ToList();
                    var primaryAdminEmail = tenantUsers.FirstOrDefault()?.Name ?? string.Empty;
                    var latestInvoice = invoices.Where(i => i.TenantID == tenant.TenantID).OrderByDescending(i => i.InvoiceID).FirstOrDefault();
                    var billingStatus = latestInvoice == null ? "No invoice" : (latestInvoice.Status ? "Paid" : "Pending");

                    return new TenantAdminDto(
                        tenant.TenantID,
                        tenant.CompanyName,
                        tenant.SubscriptionTier,
                        tenant.IsActive,
                        tenant.RegistrationStatus,
                        tenant.CreatedAt,
                        tenantUsers.Count,
                        primaryAdminEmail,
                        billingStatus);
                })
                .Where(tenant => string.IsNullOrWhiteSpace(search) || tenant.CompanyName.Contains(search, StringComparison.OrdinalIgnoreCase) || tenant.PrimaryAdminEmail.Contains(search, StringComparison.OrdinalIgnoreCase))
                .ToList();

            return Ok(result);
        }

        [HttpPost("tenants")]
        public async Task<IActionResult> CreateTenant(TenantUpsertDto request)
        {
            var tenant = new Tenant
            {
                CompanyName = request.CompanyName,
                SubscriptionTier = request.SubscriptionTier,
                IsActive = request.IsActive,
                RegistrationStatus = request.RegistrationStatus,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();
            return Ok(tenant);
        }

        [HttpPut("tenants/{tenantId:int}")]
        public async Task<IActionResult> UpdateTenant(int tenantId, TenantUpsertDto request)
        {
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null)
            {
                return NotFound();
            }

            tenant.CompanyName = request.CompanyName;
            tenant.SubscriptionTier = request.SubscriptionTier;
            tenant.IsActive = request.IsActive;
            tenant.RegistrationStatus = request.RegistrationStatus;

            await _context.SaveChangesAsync();
            return Ok(tenant);
        }

        [HttpDelete("tenants/{tenantId:int}")]
        public async Task<IActionResult> DeleteTenant(int tenantId)
        {
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null)
            {
                return NotFound();
            }

            tenant.IsActive = false;
            tenant.RegistrationStatus = "Archived";
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tenant archived." });
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserAdminDto>>> GetUsers([FromQuery] string? search = null)
        {
            var users = await _context.Users.ToListAsync();
            var roles = await _context.Roles.ToDictionaryAsync(r => r.RoleID, r => r.RoleName);
            var tenants = await _context.Tenants.ToDictionaryAsync(t => t.TenantID, t => t.CompanyName);

            var result = users
                .Select(user => new UserAdminDto(
                    user.UserID,
                    user.Name,
                    user.Name,
                    roles.TryGetValue(user.RoleID, out var roleName) ? roleName : $"Role {user.RoleID}",
                    user.TenantID,
                    tenants.TryGetValue(user.TenantID, out var tenantName) ? tenantName : string.Empty,
                    user.IsActive))
                .Where(user => string.IsNullOrWhiteSpace(search) || user.Name.Contains(search, StringComparison.OrdinalIgnoreCase) || user.Email.Contains(search, StringComparison.OrdinalIgnoreCase) || user.RoleName.Contains(search, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(user => user.UserID)
                .ToList();

            return Ok(result);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser(UserUpsertDto request)
        {
            if (!await _context.Tenants.AnyAsync(t => t.TenantID == request.TenantID))
            {
                return BadRequest(new { message = "Tenant not found." });
            }

            if (await _context.Users.AnyAsync(u => u.Name == request.Email))
            {
                return BadRequest(new { message = "User already exists." });
            }

            var user = new User
            {
                Name = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                TenantID = request.TenantID,
                RoleID = request.RoleID,
                IsActive = request.IsActive
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpPut("users/{userId:int}")]
        public async Task<IActionResult> UpdateUser(int userId, UserUpsertDto request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            if (await _context.Users.AnyAsync(u => u.UserID != userId && u.Name == request.Email))
            {
                return BadRequest(new { message = "Another user already uses that email." });
            }

            user.Name = request.Email;
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

            user.TenantID = request.TenantID;
            user.RoleID = request.RoleID;
            user.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpDelete("users/{userId:int}")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            user.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "User archived." });
        }

        [HttpGet("trial-requests")]
        public async Task<ActionResult<IEnumerable<TrialRequestAdminDto>>> GetTrialRequests()
        {
            var tenants = await _context.Tenants.OrderByDescending(t => t.CreatedAt).ToListAsync();
            var users = await _context.Users.ToListAsync();
            var sessions = await _context.PaymentSessions.ToListAsync();
            var invoices = await _context.Invoices.ToListAsync();

            var result = tenants
                .Where(tenant => tenant.RegistrationStatus.Contains("Pending", StringComparison.OrdinalIgnoreCase) || tenant.RegistrationStatus.Contains("Trial", StringComparison.OrdinalIgnoreCase))
                .Select(tenant =>
                {
                    var user = users.FirstOrDefault(u => u.TenantID == tenant.TenantID);
                    var session = sessions.Where(p => p.TenantID == tenant.TenantID).OrderByDescending(p => p.PaymentSessionID).FirstOrDefault();
                    var invoice = invoices.Where(i => i.TenantID == tenant.TenantID).OrderByDescending(i => i.InvoiceID).FirstOrDefault();

                    return new TrialRequestAdminDto(
                        tenant.TenantID,
                        tenant.CompanyName,
                        user?.Name ?? string.Empty,
                        tenant.SubscriptionTier,
                        tenant.IsActive,
                        tenant.RegistrationStatus,
                        tenant.CreatedAt,
                        session?.Status ?? "Pending",
                        invoice == null ? "No invoice" : (invoice.Status ? "Paid" : "Pending"));
                })
                .ToList();

            return Ok(result);
        }

        [HttpPut("trial-requests/{tenantId:int}/approve")]
        public async Task<IActionResult> ApproveTrialRequest(int tenantId, TrialReviewDto request)
        {
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null)
            {
                return NotFound();
            }

            tenant.IsActive = true;
            tenant.RegistrationStatus = "Active";

            var user = await _context.Users.FirstOrDefaultAsync(u => u.TenantID == tenantId);
            if (user != null)
            {
                user.IsActive = true;
            }

            var session = await _context.PaymentSessions.Where(p => p.TenantID == tenantId).OrderByDescending(p => p.PaymentSessionID).FirstOrDefaultAsync();
            if (session != null)
            {
                session.Status = "Paid";
                session.PaidAt = DateTime.UtcNow;
            }

            var invoice = await _context.Invoices.Where(i => i.TenantID == tenantId).OrderByDescending(i => i.InvoiceID).FirstOrDefaultAsync();
            if (invoice != null)
            {
                invoice.Status = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = string.IsNullOrWhiteSpace(request.Notes) ? "Trial approved." : request.Notes });
        }

        [HttpPut("trial-requests/{tenantId:int}/reject")]
        public async Task<IActionResult> RejectTrialRequest(int tenantId, TrialReviewDto request)
        {
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null)
            {
                return NotFound();
            }

            tenant.IsActive = false;
            tenant.RegistrationStatus = "Rejected";

            var user = await _context.Users.FirstOrDefaultAsync(u => u.TenantID == tenantId);
            if (user != null)
            {
                user.IsActive = false;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = string.IsNullOrWhiteSpace(request.Notes) ? "Trial rejected." : request.Notes });
        }

        [HttpGet("invoices")]
        public async Task<ActionResult<IEnumerable<InvoiceAdminDto>>> GetInvoices()
        {
            var tenants = await _context.Tenants.ToDictionaryAsync(t => t.TenantID, t => t);
            var invoices = await _context.Invoices.OrderByDescending(i => i.InvoiceID).ToListAsync();

            var result = invoices.Select(invoice =>
            {
                tenants.TryGetValue(invoice.TenantID, out var tenant);
                return new InvoiceAdminDto(
                    invoice.InvoiceID,
                    $"INV-{invoice.InvoiceID:000000}",
                    invoice.TenantID,
                    tenant?.CompanyName ?? string.Empty,
                    tenant?.SubscriptionTier ?? string.Empty,
                    invoice.Amount,
                    invoice.BillingDate,
                    invoice.DueDate,
                    invoice.Status ? "Paid" : invoice.DueDate < DateTime.UtcNow ? "Overdue" : "Pending");
            }).ToList();

            return Ok(result);
        }
    }
}