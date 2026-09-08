using HelpDeskApp.Core.Enums;

namespace HelpDeskApp.Core.Entities;

public class Ticket
{
    public Guid Id { get; set; }
    public Guid ThreadId { get; set; }
    public EmailThread Thread { get; set; } = null!;
    public Guid? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }
    public TicketCategory Category { get; set; }
    public TicketStatus Status { get; set; }
    public string AiSummary { get; set; } = string.Empty;
    public string AiDraft { get; set; } = string.Empty;
    public string? FinalReply { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? SentAt { get; set; }
}
