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

        // Super Admin extensions
        public string PaymentMethod { get; set; } = string.Empty;              // Credit Card, GCash, Maya
        public string PayMongoPaymentIntentId { get; set; } = string.Empty;    // pi_test_xxx
        public string StatusLabel { get; set; } = "Pending";                   // Paid, Pending, Overdue, Refunded
        public decimal TaxAmount { get; set; } = 0;                            // 12% VAT amount
        public bool VatInclusive { get; set; } = true;                         // Whether amount already includes VAT
    }
}