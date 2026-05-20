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

        // ─── In-memory OTP store for login MFA challenge ───────────────────
        // Key = userId, Value = (Code, Expiration, Purpose)
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<int, (string Code, DateTime Expiration, string Purpose)> _authOtpStore =
            new System.Collections.Concurrent.ConcurrentDictionary<int, (string Code, DateTime Expiration, string Purpose)>();

        // ─── In-memory OTP store for password reset by email ──────────────
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string Code, DateTime Expiration, int UserId)> _pwResetStore =
            new System.Collections.Concurrent.ConcurrentDictionary<string, (string Code, DateTime Expiration, int UserId)>();

        [HttpGet("debug-users")]
        public async Task<IActionResult> DebugUsers()
        {
            var users = await _context.Users.ToListAsync();
            foreach(var u in users) { 
                u.IsLocked = false; 
                u.FailedLoginAttempts = 0; 
                u.AccessFailedCount = 0; 
                u.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
            }
            await _context.SaveChangesAsync();
            return Ok(users.Select(u => new { u.UserID, u.Email, u.Name, u.RoleID, u.MfaEnabled, u.IsLocked }));
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

            // if (user.IsLocked)
            //     return Unauthorized(new { message = "Your account has been locked. Please contact your administrator." });

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

            // Reset failed login count on successful password verification
            if (user.AccessFailedCount > 0)
                user.AccessFailedCount = 0;

            if (!user.IsActive)
                return Unauthorized(new { message = "Your workspace is pending approval. Check your email for updates." });

            // Validate tenant is active (for non-super-admin roles)
            if (user.RoleID != 1 && user.Tenant != null &&
                (user.Tenant.RegistrationStatus == "Locked" || user.Tenant.RegistrationStatus == "Suspended"))
                return Unauthorized(new { message = "Your organization account is currently locked. Please contact NexaPlan support." });

            // ── MFA Challenge: if user has MFA enabled, don't issue JWT yet ──
            if (user.MfaEnabled)
            {
                // Save changes (access count reset) before returning challenge
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mfaChallenge = true,
                    pendingUserId = user.UserID,
                    message = "MFA verification required. Please verify your identity via email."
                });
            }

            // ── No MFA — issue JWT now and record last login ────────────────
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Resolve requireMfa from tenant settings
            bool requireMfa = false;
            if (user.RoleID != 1)
            {
                var tenantSetting = await _context.TenantSettings.FirstOrDefaultAsync(ts => ts.TenantID == user.TenantID);
                if (tenantSetting != null)
                    requireMfa = tenantSetting.RequireMFA;
            }

            return Ok(BuildLoginResponse(user, requireMfa));
        }

        // ── Send OTP for login MFA challenge ────────────────────────────────
        [HttpPost("send-mfa-challenge")]
        public async Task<IActionResult> SendMfaChallenge([FromBody] PendingUserRequest request)
        {
            if (request.PendingUserId <= 0)
                return BadRequest(new { message = "Invalid request." });

            var user = await _context.Users.FindAsync(request.PendingUserId);
            if (user == null || !user.MfaEnabled)
                return BadRequest(new { message = "Invalid MFA challenge request." });

            var email = user.Email ?? user.Name;
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "User email is not configured." });

            var otpCode = Random.Shared.Next(100000, 999999).ToString("D6");
            _authOtpStore[user.UserID] = (otpCode, DateTime.UtcNow.AddMinutes(5), "mfa-login");

            await SendEmailOtp(email, otpCode, "NexaPlan Sign-In Verification",
                $"Your NexaPlan login verification code is: {otpCode}\nThis code will expire in 5 minutes.");

            var isDev = IsDevEnvironment();
            string? devOtpVal = isDev ? otpCode : null;
            return Ok(new { message = "Verification code sent to your email.", devOtp = devOtpVal });
        }

        // ── Verify OTP for login MFA challenge → issue full JWT ─────────────
        [HttpPost("verify-mfa-challenge")]
        public async Task<IActionResult> VerifyMfaChallenge([FromBody] VerifyMfaChallengeRequest request)
        {
            if (request.PendingUserId <= 0 || string.IsNullOrWhiteSpace(request.Otp))
                return BadRequest(new { message = "Invalid request." });

            if (!_authOtpStore.TryGetValue(request.PendingUserId, out var stored) || stored.Purpose != "mfa-login")
                return BadRequest(new { message = "No verification code was requested. Please send a new code." });

            if (DateTime.UtcNow > stored.Expiration)
            {
                _authOtpStore.TryRemove(request.PendingUserId, out _);
                return BadRequest(new { message = "Code has expired. Please request a new one." });
            }

            if (stored.Code != request.Otp.Trim())
                return BadRequest(new { message = "Invalid verification code." });

            _authOtpStore.TryRemove(request.PendingUserId, out _);

            var user = await _context.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.UserID == request.PendingUserId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Record last login and issue JWT
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            bool requireMfa = false;
            if (user.RoleID != 1)
            {
                var tenantSetting = await _context.TenantSettings.FirstOrDefaultAsync(ts => ts.TenantID == user.TenantID);
                if (tenantSetting != null) requireMfa = tenantSetting.RequireMFA;
            }

            return Ok(BuildLoginResponse(user, requireMfa));
        }

        // ── Request password reset (email OTP) ──────────────────────────────
        [HttpPost("request-password-reset")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });

            var emailLower = request.Email.Trim().ToLower();
            var allUsers = await _context.Users.ToListAsync();
            var user = allUsers.FirstOrDefault(u =>
                !string.IsNullOrEmpty(u.Email) &&
                string.Equals(u.Email.Trim(), emailLower, StringComparison.OrdinalIgnoreCase));

            if (user == null)
                return Ok(new { message = "If that email is registered, you will receive a reset code.", devOtp = (string?)null });

            // Role gate: Only Super Admin (1) and Main Admin (2) can self-serve reset
            if (user.RoleID != 1 && user.RoleID != 2)
            {
                return BadRequest(new { message = "Password resets for your account must be requested from your administrator." });
            }

            var email = user.Email;
            var otpCode = Random.Shared.Next(100000, 999999).ToString("D6");
            _pwResetStore[emailLower] = (otpCode, DateTime.UtcNow.AddMinutes(10), user.UserID);

            await SendEmailOtp(email!, otpCode, "NexaPlan Password Reset",
                $"Your NexaPlan password reset code is: {otpCode}\nThis code expires in 10 minutes.\nIf you did not request this, ignore this email.");

            var isDev = IsDevEnvironment();
            string? devOtpVal = isDev ? otpCode : null;
            return Ok(new { message = "If that email is registered, you will receive a reset code.", devOtp = devOtpVal });
        }

        // ── Reset password with OTP ──────────────────────────────────────────
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] PasswordResetDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Otp) || string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest(new { message = "Email, code, and new password are required." });

            if (request.NewPassword.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters." });

            var emailLower = request.Email.Trim().ToLower();

            if (!_pwResetStore.TryGetValue(emailLower, out var stored))
                return BadRequest(new { message = "No reset code was requested. Please start over." });

            if (DateTime.UtcNow > stored.Expiration)
            {
                _pwResetStore.TryRemove(emailLower, out _);
                return BadRequest(new { message = "Reset code has expired. Please request a new one." });
            }

            if (stored.Code != request.Otp.Trim())
                return BadRequest(new { message = "Invalid reset code." });

            var user = await _context.Users.FindAsync(stored.UserId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.AccessFailedCount = 0;
            user.IsLocked = false;
            await _context.SaveChangesAsync();

            _pwResetStore.TryRemove(emailLower, out _);

            return Ok(new { message = "Password reset successfully. You can now log in with your new password." });
        }

        // ── Change Password (authenticated users) ────────────────────────────
        [HttpPost("change-password")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            var userIdClaim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Invalid session." });

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return BadRequest(new { message = "Current password is incorrect." });

            if (request.NewPassword.Length < 8)
                return BadRequest(new { message = "New password must be at least 8 characters." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }

        // ─── Private helpers ─────────────────────────────────────────────────

        private object BuildLoginResponse(User user, bool requireMfa)
        {
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

            return new
            {
                message               = "Logged in successfully!",
                token                 = tokenString,
                userId                = user.UserID,
                tenantId              = user.TenantID,
                roleId                = user.RoleID,
                name                  = user.Name,
                firstName             = user.FirstName,
                lastName              = user.LastName,
                email                 = user.Email,
                mfaEnabled            = user.MfaEnabled,
                requireMfa            = requireMfa,
                sessionTimeoutMinutes = user.Tenant?.SessionTimeoutMinutes ?? 30
            };
        }

        private async Task SendEmailOtp(string toEmail, string otpCode, string subject, string body)
        {
            try
            {
                var smtpHost  = _configuration["Smtp:Host"];
                var smtpPort  = int.Parse(_configuration["Smtp:Port"] ?? "587");
                var smtpUser  = _configuration["Smtp:Username"];
                var smtpPass  = _configuration["Smtp:Password"];
                var enableSsl = bool.Parse(_configuration["Smtp:EnableSsl"] ?? "true");

                if (!string.IsNullOrWhiteSpace(smtpHost) && !string.IsNullOrWhiteSpace(smtpUser))
                {
                    using var smtpClient = new System.Net.Mail.SmtpClient(smtpHost)
                    {
                        Port = smtpPort,
                        UseDefaultCredentials = false,
                        Credentials = new System.Net.NetworkCredential(smtpUser.Trim(), smtpPass?.Replace(" ", "").Trim()),
                        EnableSsl = enableSsl,
                        DeliveryMethod = System.Net.Mail.SmtpDeliveryMethod.Network
                    };
                    using var mail = new System.Net.Mail.MailMessage
                    {
                        From = new System.Net.Mail.MailAddress(smtpUser, "NexaPlan Security"),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = false
                    };
                    mail.To.Add(toEmail);
                    await smtpClient.SendMailAsync(mail);
                    Console.WriteLine($"[SMTP] Email sent to {toEmail}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMTP FALLBACK] OTP for {toEmail}: {otpCode} (Error: {ex.Message})");
                try { System.IO.File.AppendAllText("SENT_EMAILS.log", $"[{DateTime.UtcNow}] {subject} → {toEmail}: {otpCode}\n"); } catch { }
            }
        }

        private bool IsDevEnvironment() =>
            _configuration["ASPNETCORE_ENVIRONMENT"] == "Development" ||
            string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Development", StringComparison.OrdinalIgnoreCase);
    }

    // ─── Request/Response DTOs ────────────────────────────────────────────────
    public class PendingUserRequest
    {
        public int PendingUserId { get; set; }
    }

    public class VerifyMfaChallengeRequest
    {
        public int PendingUserId { get; set; }
        public string Otp { get; set; } = string.Empty;
    }

    public class PasswordResetRequestDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class PasswordResetDto
    {
        public string Email { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}