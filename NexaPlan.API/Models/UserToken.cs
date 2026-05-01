using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class UserToken
    {
        [Key]
        public int TokenID { get; set; }
        public int UserID { get; set; }
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public bool IsRevoked { get; set; }
    }
}