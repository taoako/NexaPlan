using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class Forecast
    {
        [Key]
        public int ForecastID { get; set; }
        public int TenantID { get; set; }
        public int DepartmentID { get; set; }
        public DateTime TargetMonth { get; set; }
        public decimal PredictedSpend { get; set; }
        public decimal LowerBound { get; set; }
        public decimal UpperBound { get; set; }
        public DateTime GeneratedAt { get; set; }
    }
}