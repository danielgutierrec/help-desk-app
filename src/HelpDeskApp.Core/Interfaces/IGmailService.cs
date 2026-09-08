namespace HelpDeskApp.Core.Interfaces;

public interface IGmailService
{
    Task IngestNewEmailsAsync(CancellationToken ct = default);
    Task SendReplyAsync(string gmailThreadId, string replyBody, CancellationToken ct = default);
}
