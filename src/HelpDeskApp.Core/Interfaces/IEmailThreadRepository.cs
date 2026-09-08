using HelpDeskApp.Core.Entities;

namespace HelpDeskApp.Core.Interfaces;

public interface IEmailThreadRepository
{
    Task<EmailThread?> GetByGmailThreadIdAsync(string gmailThreadId, CancellationToken ct = default);
    Task AddAsync(EmailThread thread, CancellationToken ct = default);
}
