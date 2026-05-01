using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class Invoice
    {
        [Key]
        public int InvoiceID { get; set; }
        public int TenantID { get; set; }
        public decimal Amount { get; set; }
        public DateTime BillingDate { get; set; }
        public DateTime DueDate { get; set; }
        public bool Status { get; set; }
    }
}