using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class PaymentSession
    {
        [Key]
        public int PaymentSessionID { get; set; }
        public int TenantID { get; set; }
        public int UserID { get; set; }
        public string PlanTier { get; set; } = string.Empty;
        public long Amount { get; set; }
        public string Currency { get; set; } = "PHP";
        public string Status { get; set; } = "Pending";
        public string? PayMongoCheckoutID { get; set; }
        public string? PayMongoCheckoutUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }
    }
}
