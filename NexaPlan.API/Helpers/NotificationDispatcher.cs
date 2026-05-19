using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;
using System.Text.Json;

namespace NexaPlan.API.Helpers
{
    public static class NotificationDispatcher
    {
        public static async Task DispatchEmailIfEnabledAsync(
            AppDbContext context,
            IConfiguration config,
            int tenantId,
            string eventType,
            string subject,
            string body,
            string? overrideRecipientEmail = null)
        {
            try
            {
                var tenant = await context.Tenants.FindAsync(tenantId);
                if (tenant == null || string.IsNullOrWhiteSpace(tenant.NotificationPreferences)) return;

                // Check preferences
                var doc = JsonDocument.Parse(tenant.NotificationPreferences);
                bool shouldSend = false;

                if (doc.RootElement.TryGetProperty(eventType, out var prop))
                {
                    shouldSend = prop.GetBoolean();
                }

                if (!shouldSend) return;

                // Send Email
                string recipient = overrideRecipientEmail ?? tenant.ContactEmail;
                if (string.IsNullOrWhiteSpace(recipient)) return;

                var smtpHost = config["Smtp:Host"];
                var smtpPort = int.Parse(config["Smtp:Port"] ?? "587");
                var smtpUser = config["Smtp:Username"];
                var smtpPass = config["Smtp:Password"];
                var enableSsl = bool.Parse(config["Smtp:EnableSsl"] ?? "true");

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
                        From = new MailAddress(smtpUser, "NexaPlan Notifications"),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = false
                    };
                    mail.To.Add(recipient);

                    await smtpClient.SendMailAsync(mail);
                    Console.WriteLine($"[SMTP] Dispatched notification '{eventType}' to {recipient}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMTP ERROR in Dispatcher] {ex.Message}");
                try
                {
                    var log = $"[{DateTime.UtcNow}] NOTIFICATION ({eventType})\nTo: {overrideRecipientEmail ?? "TenantAdmin"}\nSubject: {subject}\n{body}\n\n";
                    System.IO.File.AppendAllText("SENT_EMAILS.log", log);
                }
                catch { }
            }
        }
    }
}
