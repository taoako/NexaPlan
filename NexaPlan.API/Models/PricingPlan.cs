using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class PricingPlan
    {
        [Key]
        public int PlanID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal MonthlyPrice { get; set; }
        public decimal AnnualPrice { get; set; }
        public int MaxSeats { get; set; }
        public bool IsPopular { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<PricingBenefit> Benefits { get; set; } = new();
    }

    public class PricingBenefit
    {
        [Key]
        public int BenefitID { get; set; }
        public int PlanID { get; set; }
        public string BenefitText { get; set; } = string.Empty;
        public bool IsIncluded { get; set; } = true;
    }
}
