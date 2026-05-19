using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class MaintenanceLog
    {
        [Key]
        public int LogId { get; set; }
        public string Type { get; set; } = "Info"; // Success, Warning, Info, Error
        public string Message { get; set; } = "";
        public string? Detail { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? TriggeredBy { get; set; }
    }
}
