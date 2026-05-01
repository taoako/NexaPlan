using System.ComponentModel.DataAnnotations;

namespace NexaPlan.API.Models
{
    public class Attachment
    {
        [Key]
        public int AttachmentID { get; set; }
        public int ProposalID { get; set; }
        public int UploadedID { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string FileHash { get; set; } = string.Empty;
    }
}