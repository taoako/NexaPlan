using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class TenantSetting
    {
        [Key]
        public int SettingsID { get; set; }
        public int TenantID { get; set; }
        public int FiscalYearStartMonth { get; set; }
        public string DefaultCurrency { get; set; } = string.Empty;
        public bool RequireMFA { get; set; }
    }
}