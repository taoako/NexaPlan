using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class LineItem
    {
        [Key]
        public int LineItemID { get; set; }
        public int ProposalID { get; set; }
        public string Description { get; set; } = string.Empty; // renamed from Category for clarity
        public string Category { get; set; } = string.Empty;    // e.g. Hardware, Software, Services
        public int Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal Total => Quantity * UnitCost;             // computed
        public string Justification { get; set; } = string.Empty;
        public bool IsRejected { get; set; } = false;
        public bool IsVatInclusive { get; set; } = true; // If true, Total includes 12% VAT

        [ForeignKey("ProposalID")]
        public BudgetProposal? Proposal { get; set; }
    }
}