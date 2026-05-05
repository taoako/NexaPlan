using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;
using NexaPlan.API.DTOs;

namespace NexaPlan.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            // 1. Check if the email is already in the database
            if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Name == request.Email))
            {
                return BadRequest(new { message = "User already exists." });
            }

            // 1.5 Check Terms & Conditions
            if (!request.AcceptTerms)
            {
                return BadRequest(new { message = "You must accept the terms and conditions." });
            }

            bool isPaidAccount = request.PlanTier != "Trial";

            if (!isPaidAccount)
            {
                // TRIAL REQUEST FLOW
                // Check if a pending trial request already exists
                if (await _context.TrialRequests.AnyAsync(t => t.Email == request.Email && t.Status == "Pending"))
                {
                    return BadRequest(new { message = "A trial request for this email is already pending review." });
                }

                var trialRequest = new TrialRequest
                {
                    CompanyName = request.CompanyName,
                    ContactName = $"{request.FirstName} {request.LastName}".Trim(),
                    Email = request.Email,
                    Phone = request.Phone,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Status = "Pending",
                    RiskLevel = request.Email.EndsWith("@tempmail.com") ? "high" : "low", // Basic risk scoring
                    SubmittedAt = DateTime.UtcNow
                };

                _context.TrialRequests.Add(trialRequest);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Application received. Your workspace is currently being provisioned.", status = "Pending" });
            }
            else
            {
                // PAID ACCOUNT FLOW
                string initialStatus = "Active";

                // 3. Create the Workspace (Tenant)
                var newTenant = new Tenant
                {
                    CompanyName = request.CompanyName,
                    SubscriptionTier = request.PlanTier,
                    RegistrationStatus = initialStatus,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    Phone = request.Phone,
                    OrgType = string.IsNullOrWhiteSpace(request.OrgType) ? "Corporate" : request.OrgType,
                    ContactPerson = $"{request.FirstName} {request.LastName}".Trim(),
                    ContactEmail = request.Email
                };

                _context.Tenants.Add(newTenant);
                await _context.SaveChangesAsync(); // Save to generate the TenantID

                // 4. Encrypt the password securely
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

                // 5. Create the User and link them to the Workspace
                var newUser = new User
                {
                    Name = $"{request.FirstName} {request.LastName}".Trim(),
                    Email = request.Email,
                    PasswordHash = passwordHash,
                    TenantID = newTenant.TenantID,
                    RoleID = 2, // 2 = Main Admin
                    IsActive = true,
                    HasAcceptedTerms = true,
                    TermsAcceptedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                // 6. Tell React it was successful
                return Ok(new { message = "Payment successful! Your Enterprise workspace is active.", status = initialStatus });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Email and password are required." });

            var emailInput = request.Email.Trim().ToLower();

            // Load all users then do case-insensitive comparison in C# to avoid
            // EF Core MySQL translation issues with Trim() / ToLower() in LINQ.
            var allUsers = await _context.Users
                .Include(u => u.Tenant)
                .ToListAsync();

            var user = allUsers.FirstOrDefault(u =>
                string.Equals(u.Email.Trim(), emailInput, StringComparison.OrdinalIgnoreCase));

            if (user == null)
                return BadRequest(new { message = "No account found with that email address." });

            if (user.IsLocked)
                return Unauthorized(new { message = "Your account has been locked. Please contact your administrator." });

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                user.AccessFailedCount += 1;
                if (user.AccessFailedCount >= 5)
                {
                    user.IsLocked = true;
                    await _context.SaveChangesAsync();
                    return Unauthorized(new { message = "Your account has been locked due to multiple failed login attempts." });
                }
                
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Incorrect password. Please try again." });
            }

            // Reset failed login count on successful login
            if (user.AccessFailedCount > 0)
            {
                user.AccessFailedCount = 0;
                await _context.SaveChangesAsync();
            }

            if (!user.IsActive)
                return Unauthorized(new { message = "Your workspace is pending approval. Check your email for updates." });

            // Validate tenant is active (for non-super-admin roles)
            if (user.RoleID != 1 && user.Tenant != null &&
                (user.Tenant.RegistrationStatus == "Locked" || user.Tenant.RegistrationStatus == "Suspended"))
                return Unauthorized(new { message = "Your organization account is currently locked. Please contact NexaPlan support." });

            return Ok(new {
                message = "Logged in successfully!",
                userId = user.UserID,
                tenantId = user.TenantID,
                roleId = user.RoleID,
                name = user.Name,
                email = user.Email
            });
        }
    }
}
