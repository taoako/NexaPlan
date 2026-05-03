namespace NexaPlan.API.DTOs
{
    public class CheckoutRequestDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string PlanTier { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string OrgType { get; set; } = "Corporate";
    }
}
