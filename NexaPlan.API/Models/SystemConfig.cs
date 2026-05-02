using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class SystemConfig
    {
        [Key]
        public int ConfigID { get; set; }
        public string ConfigKey { get; set; } = string.Empty;
        public string ConfigValue { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
