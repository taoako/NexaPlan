using System;
using System.Collections.Concurrent;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers
{
    [Authorize]
    [Route("api/mfa")]
    [ApiController]
    public class MfaController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        // Static in-memory dictionary to store OTPs: UserId -> (Code, Expiration)
        private static readonly ConcurrentDictionary<int, (string Code, DateTime Expiration)> OtpStore =
            new ConcurrentDictionary<int, (string Code, DateTime Expiration)>();

        public MfaController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var uid) ? uid : 0;
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp()
        {
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Invalid session." });

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            var email = user.Email ?? user.Name; // Fallback to Name if Email is null
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "User email address is not configured." });

            // Generate a 6-digit OTP code
            var otpCode = Random.Shared.Next(100000, 999999).ToString("D6");
            var expiration = DateTime.UtcNow.AddMinutes(5);

            OtpStore[userId] = (otpCode, expiration);

            // Attempt to send via SMTP
            try
            {
                var smtpHost = _config["Smtp:Host"];
                var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
                var smtpUser = _config["Smtp:Username"];
                var smtpPass = _config["Smtp:Password"];
                var enableSsl = bool.Parse(_config["Smtp:EnableSsl"] ?? "true");

                if (!string.IsNullOrWhiteSpace(smtpHost) && !string.IsNullOrWhiteSpace(smtpUser))
                {
                    using var smtpClient = new SmtpClient(smtpHost)
                    {
                        Port = smtpPort,
                        UseDefaultCredentials = false,
                        Credentials = new NetworkCredential(smtpUser.Trim(), smtpPass?.Replace(" ", "").Trim()),
                        EnableSsl = enableSsl,
                        DeliveryMethod = SmtpDeliveryMethod.Network
                    };

                    using var mail = new MailMessage
                    {
                        From = new MailAddress(smtpUser, "NexaPlan Security"),
                        Subject = "Your NexaPlan MFA Verification Code",
                        Body = $"Your Multi-Factor Authentication (MFA) code is: {otpCode}\nThis code will expire in 5 minutes.",
                        IsBodyHtml = false
                    };
                    mail.To.Add(email);

                    await smtpClient.SendMailAsync(mail);
                    Console.WriteLine($"[SMTP] OTP sent to {email}");
                }
                else
                {
                    throw new Exception("SMTP host or username is not configured.");
                }
            }
            catch (Exception ex)
            {
                // Development fallback: Log the OTP to a file and console so user/developer can see it
                Console.WriteLine($"[DEVELOPMENT FALLBACK] OTP Code for {email} (UserID: {userId}) is: {otpCode} (SMTP error: {ex.Message})");
                try
                {
                    var log = $"[{DateTime.UtcNow}] MFA OTP Code for {email} (UserID: {userId}): {otpCode}\n";
                    System.IO.File.AppendAllText("SENT_EMAILS.log", log);
                }
                catch { }
            }

            var isDev = _config["ASPNETCORE_ENVIRONMENT"] == "Development" 
                     || string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Development", StringComparison.OrdinalIgnoreCase);

            if (isDev)
            {
                return Ok(new { message = "OTP sent to your registered email address.", devOtp = otpCode });
            }

            return Ok(new { message = "OTP sent to your registered email address." });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Invalid session." });

            if (request == null || string.IsNullOrWhiteSpace(request.Otp))
                return BadRequest(new { message = "OTP code is required." });

            if (!OtpStore.TryGetValue(userId, out var storedOtp))
                return BadRequest(new { message = "No OTP code request found. Please request a new code." });

            if (DateTime.UtcNow > storedOtp.Expiration)
            {
                OtpStore.TryRemove(userId, out _);
                return BadRequest(new { message = "OTP code has expired. Please request a new code." });
            }

            if (storedOtp.Code != request.Otp.Trim())
                return BadRequest(new { message = "Invalid OTP code." });

            // Code verified successfully! Enable MFA on the user profile.
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            user.MfaEnabled = true;
            await _context.SaveChangesAsync();

            OtpStore.TryRemove(userId, out _);

            return Ok(new { message = "Multi-Factor Authentication (MFA) enabled successfully." });
        }

        [HttpPost("disable")]
        public async Task<IActionResult> DisableMfa()
        {
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Invalid session." });

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            user.MfaEnabled = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Multi-Factor Authentication (MFA) has been disabled." });
        }
    }

    public class VerifyOtpRequest
    {
        public string Otp { get; set; } = string.Empty;
    }
}
