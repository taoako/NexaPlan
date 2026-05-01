using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class Transaction
    {
        [Key]
        public int TransactionID { get; set; }
        public int TenantID { get; set; }
        public int DepartmentID { get; set; }
        public DateTime ExpenseDate { get; set; }
        public string Category { get; set; } = string.Empty;
        public decimal AmountSpent { get; set; }

        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }
    }
}