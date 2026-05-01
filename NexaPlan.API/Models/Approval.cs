using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexaPlan.API.Models
{
    public class Approval
    {
        [Key]
        public int ApprovalID { get; set; }
        public int ProposalID { get; set; }
        public int ApproverID { get; set; }
        public DateTime ActionDate { get; set; }
        public string Comments { get; set; } = string.Empty;

        [ForeignKey("ProposalID")]
        public BudgetProposal? Proposal { get; set; }
        [ForeignKey("ApproverID")]
        public User? Approver { get; set; }
    }
}