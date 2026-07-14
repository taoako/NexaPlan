namespace NexaPlan.API.DTOs
{
    public class CheckoutRequestDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{12,}$",
            ErrorMessage = "Password must be at least 12 characters and contain uppercase, lowercase, a number, and a special character.")]
        public string Password { get; set; } = string.Empty;

        public string PlanTier { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string OrgType { get; set; } = "Corporate";

        [System.ComponentModel.DataAnnotations.Range(typeof(bool), "true", "true",
            ErrorMessage = "You must accept the Terms and Conditions to proceed.")]
        public bool AcceptTerms { get; set; }
    }
}
