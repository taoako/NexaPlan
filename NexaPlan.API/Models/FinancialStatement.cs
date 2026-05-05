using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class FinancialStatement
    {
        [Key]
        public int StatementID { get; set; }
        public int TenantID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;   // Budget Statement, Variance Report, etc.
        public string FilePath { get; set; } = string.Empty;
        public string FileSize { get; set; } = string.Empty;
        public string Sha256Hash { get; set; } = string.Empty; // Cryptographic integrity hash
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("TenantID")]
        public Tenant? Tenant { get; set; }
        [ForeignKey("CreatedBy")]
        public User? Creator { get; set; }
    }
}
