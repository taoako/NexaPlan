using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class Role
    {
        [Key]
        public int RoleID { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }
}