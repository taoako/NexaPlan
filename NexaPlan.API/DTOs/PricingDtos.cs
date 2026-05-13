namespace NexaPlan.API.DTOs
{
    public class PricingPlanDto
    {
        public int PlanID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal MonthlyPrice { get; set; }
        public decimal AnnualPrice { get; set; }
        public int MaxSeats { get; set; }
        public bool IsPopular { get; set; }
        public bool IsActive { get; set; }
        public List<PricingBenefitDto> Benefits { get; set; } = new();
    }

    public class PricingBenefitDto
    {
        public int BenefitID { get; set; }
        public string BenefitText { get; set; } = string.Empty;
        public bool IsIncluded { get; set; }
    }
}
