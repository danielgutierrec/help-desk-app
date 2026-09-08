namespace HelpDeskApp.Core.Entities;

public class EmailThread
{
    public Guid Id { get; set; }
    public string GmailThreadId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTimeOffset ReceivedAt { get; set; }
}
