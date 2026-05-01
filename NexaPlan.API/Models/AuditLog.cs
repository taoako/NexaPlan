using System.ComponentModel.DataAnnotations;

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
        public DateTime TimeStamp { get; set; }
    }
}