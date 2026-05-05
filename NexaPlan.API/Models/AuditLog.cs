using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class AuditLog
    {
        [Key]
        public int LogID { get; set; }
        public int TenantID { get; set; }
        public int UserID { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string TargetResources { get; set; } = string.Empty;
        public string IPAddress { get; set; } = string.Empty;
        public DateTime TimeStamp { get; set; } = DateTime.UtcNow;

        // Flagging for investigation
        public bool IsFlagged { get; set; } = false;
        public string? FlagReason { get; set; }
        public int? FlaggedBy { get; set; }
        public DateTime? FlaggedAt { get; set; }

        [ForeignKey("UserID")]
        public User? Actor { get; set; }
        [ForeignKey("FlaggedBy")]
        public User? FlaggerUser { get; set; }
    }
}