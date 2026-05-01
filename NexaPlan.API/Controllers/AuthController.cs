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
            if (await _context.Users.AnyAsync(u => u.Name == request.Email))
            {
                return BadRequest(new { message = "User already exists." });
            }

            // 2. Lock the account if it's a Free Trial
            bool isPaidAccount = request.PlanTier != "Trial";
            string initialStatus = isPaidAccount ? "Active" : "Pending";

            // 3. Create the Workspace (Tenant)
            var newTenant = new Tenant
            {
                CompanyName = request.CompanyName,
                SubscriptionTier = request.PlanTier,
                RegistrationStatus = initialStatus,
                IsActive = isPaidAccount,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tenants.Add(newTenant);
            await _context.SaveChangesAsync(); // Save to generate the TenantID

            // 4. Encrypt the password securely
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // 5. Create the User and link them to the Workspace
            var newUser = new User
            {
                Name = request.Email,
                PasswordHash = passwordHash,
                TenantID = newTenant.TenantID,
                RoleID = 2, // 2 = Main Admin
                IsActive = isPaidAccount
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // 6. Tell React it was successful
            string responseMessage = isPaidAccount
                ? "Payment successful! Your Enterprise workspace is active."
                : "Application received. Your workspace is currently being provisioned.";

            return Ok(new { message = responseMessage, status = initialStatus });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Name == request.Email);
            if (user == null)
            {
                return BadRequest(new { message = "Invalid credentials." });
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest(new { message = "Invalid credentials." });
            }


            if (!user.IsActive)
            {
                return Unauthorized(new { message = "Your workspace is still pending approval." });
            }

            return Ok(new { message = "Logged in successfully!", userId = user.UserID, tenantId = user.TenantID });
        }
    }
}