using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class StatementAccessLog
    {
        [Key]
        public int AccessID { get; set; }
        public int StatementID { get; set; }
        public int TenantID { get; set; }
        public int UserID { get; set; }
        public string AccessType { get; set; } = "View"; // View or Download
        public string IPAddress { get; set; } = string.Empty;
        public DateTime AccessedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StatementID")]
        public FinancialStatement? Statement { get; set; }
        [ForeignKey("UserID")]
        public User? Accessor { get; set; }
    }
}
