using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class LineItem
    {
        [Key]
        public int LineItemID { get; set; }
        public int ProposalID { get; set; }
        public string Category { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public string Justification { get; set; } = string.Empty;

        [ForeignKey("ProposalID")]
        public BudgetProposal? Proposal { get; set; }
    }
}