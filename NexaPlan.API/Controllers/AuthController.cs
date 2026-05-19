using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;
using NexaPlan.API.DTOs;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace NexaPlan.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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

            // Global minimum password check for registration (default 8)
            if (request.Password.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters long." });
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
                    OrgType = "Corporate",
                    OrgLabel = "Department",
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
                    FirstName = request.FirstName,
                    LastName = request.LastName,
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
                !string.IsNullOrEmpty(u.Email) && 
                string.Equals(u.Email.Trim(), emailInput, StringComparison.OrdinalIgnoreCase));

            if (user == null)
            {
                // Fallback check for Name if email was used as Name (common in some legacy registrations)
                user = allUsers.FirstOrDefault(u =>
                    !string.IsNullOrEmpty(u.Name) && 
                    string.Equals(u.Name.Trim(), emailInput, StringComparison.OrdinalIgnoreCase));
            }

            if (user == null)
                return BadRequest(new { message = "No account found with that email address." });

            if (user.IsLocked)
                return Unauthorized(new { message = "Your account has been locked. Please contact your administrator." });

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                user.AccessFailedCount += 1;
                int maxAttempts = user.Tenant?.MaxFailedLoginAttempts ?? 5;
                if (user.AccessFailedCount >= maxAttempts)
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

            // ─── Generate JWT ─────────────────────────────────────────────
            var secret    = _configuration["Jwt:Secret"]    ?? "NexaPlan_SuperSecure_JWT_Secret_Key_Min32Chars!2026";
            var issuer    = _configuration["Jwt:Issuer"]    ?? "NexaPlanAPI";
            var audience  = _configuration["Jwt:Audience"]  ?? "NexaPlanClient";
            var expiryHrs = int.Parse(_configuration["Jwt:ExpirationHours"] ?? "24");

            var claims = new[]
            {
                new Claim("userId",   user.UserID.ToString()),
                new Claim("tenantId", user.TenantID.ToString()),
                new Claim("roleId",   user.RoleID.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim(ClaimTypes.Name,  user.Name  ?? ""),
            };

            var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var jwtToken = new JwtSecurityToken(
                issuer:             issuer,
                audience:           audience,
                claims:             claims,
                expires:            DateTime.UtcNow.AddHours(expiryHrs),
                signingCredentials: creds
            );
            var tokenString = new JwtSecurityTokenHandler().WriteToken(jwtToken);
            // ─────────────────────────────────────────────────────────────

            return Ok(new {
                message               = "Logged in successfully!",
                token                 = tokenString,
                userId                = user.UserID,
                tenantId              = user.TenantID,
                roleId                = user.RoleID,
                name                  = user.Name,
                firstName             = user.FirstName,
                lastName              = user.LastName,
                email                 = user.Email,
                sessionTimeoutMinutes = user.Tenant?.SessionTimeoutMinutes ?? 30
            });
        }

    }
}
