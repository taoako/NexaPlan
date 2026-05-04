using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;
using System.Net;
using System.Net.Mail;

namespace NexaPlan.API.Controllers.SuperAdmin
{
    [Route("api/super-admin")]
    [ApiController]
    public class SuperAdminTrialController : SuperAdminBaseController
    {
        public SuperAdminTrialController(AppDbContext context, IConfiguration configuration) : base(context, configuration) { }

        [HttpGet("trial-requests")]
        public async Task<IActionResult> GetTrialRequests()
        {
            var requests = await _context.TrialRequests.OrderByDescending(t => t.SubmittedAt).ToListAsync();
            var result = requests.Select(r => new SuperAdminTrialDto(
                r.TrialRequestID, r.CompanyName, r.ContactName, r.Email,
                r.Phone, r.Status, r.ReviewNotes, r.RiskLevel, r.SubmittedAt
            )).ToList();
            return Ok(result);
        }

        [HttpPut("trial-requests/{id:int}/approve")]
        public async Task<IActionResult> ApproveTrialRequest(int id, TrialReviewActionDto request)
        {
            var trial = await _context.TrialRequests.FindAsync(id);
            if (trial == null) return NotFound();

            trial.Status = "Approved";
            trial.ReviewNotes = request.Notes ?? "Approved by Super Admin.";
            trial.ReviewedAt = DateTime.UtcNow;

            var tenant = new Tenant
            {
                CompanyName = trial.CompanyName, SubscriptionTier = "Trial", OrgType = "Corporate",
                ContactPerson = trial.ContactName, ContactEmail = trial.Email, Phone = trial.Phone,
                IsActive = true, RegistrationStatus = "Trial", CreatedAt = DateTime.UtcNow
            };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();
            trial.ProvisionedTenantID = tenant.TenantID;

            string finalPasswordHash;
            string? tempPassword = null;
            if (!string.IsNullOrEmpty(trial.PasswordHash))
                finalPasswordHash = trial.PasswordHash;
            else
            {
                tempPassword = $"Trial_{Guid.NewGuid().ToString("N")[..8]}!";
                finalPasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);
            }

            _context.Users.Add(new User {
                Name = trial.ContactName, Email = trial.Email, PasswordHash = finalPasswordHash,
                TenantID = tenant.TenantID, RoleID = 2, IsActive = true
            });
            await _context.SaveChangesAsync();

            // Attempt SMTP
            try
            {
                var smtpHost = _configuration["Smtp:Host"];
                var smtpPort = int.Parse(_configuration["Smtp:Port"] ?? "587");
                var smtpUser = _configuration["Smtp:Username"];
                var smtpPass = _configuration["Smtp:Password"];
                var enableSsl = bool.Parse(_configuration["Smtp:EnableSsl"] ?? "true");

                if (!string.IsNullOrWhiteSpace(smtpHost) && !string.IsNullOrWhiteSpace(smtpUser))
                {
                    var smtpClient = new SmtpClient(smtpHost) {
                        Port = smtpPort, UseDefaultCredentials = false,
                        Credentials = new NetworkCredential(smtpUser.Trim(), smtpPass?.Replace(" ", "").Trim()),
                        EnableSsl = enableSsl, DeliveryMethod = SmtpDeliveryMethod.Network
                    };
                    var mail = new MailMessage {
                        From = new MailAddress(smtpUser, "NexaPlan"),
                        Subject = "Your NexaPlan Workspace is Ready",
                        Body = $"Welcome to NexaPlan! Your 14-day free trial has been approved.\n\nEmail: {trial.Email}\n{(tempPassword != null ? $"Password: {tempPassword}" : "Password: The password you provided during registration.")}",
                        IsBodyHtml = false
                    };
                    mail.To.Add(trial.Email);
                    await smtpClient.SendMailAsync(mail);
                    Console.WriteLine($"[SMTP] Sent trial approval to {trial.Email}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMTP ERROR] {ex.Message}");
                try {
                    var log = $"[{DateTime.UtcNow}] TRIAL APPROVED\nTo: {trial.Email}\nPassword: {(tempPassword ?? "User's registered password")}\n\n";
                    System.IO.File.AppendAllText("SENT_EMAILS.log", log);
                } catch { }
            }

            return Ok(new { message = "Trial approved. 14-day countdown started.", tempPassword = tempPassword ?? "Your registered password" });
        }

        [HttpPut("trial-requests/{id:int}/reject")]
        public async Task<IActionResult> RejectTrialRequest(int id, TrialReviewActionDto request)
        {
            var trial = await _context.TrialRequests.FindAsync(id);
            if (trial == null) return NotFound();

            trial.Status = "Rejected";
            trial.ReviewNotes = request.Notes ?? "Rejected by Super Admin.";
            trial.ReviewedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Trial rejected. Domain '{trial.Email.Split('@').LastOrDefault()}' flagged." });
        }
    }
}
