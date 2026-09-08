using HelpDeskApp.Core.Entities;
using HelpDeskApp.Core.Interfaces;
using HelpDeskApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HelpDeskApp.Infrastructure.Repositories;

public class EmailThreadRepository(AppDbContext db) : IEmailThreadRepository
{
    public async Task<EmailThread?> GetByGmailThreadIdAsync(string gmailThreadId, CancellationToken ct = default)
        => await db.EmailThreads.FirstOrDefaultAsync(e => e.GmailThreadId == gmailThreadId, ct);

    public async Task AddAsync(EmailThread thread, CancellationToken ct = default)
    {
        await db.EmailThreads.AddAsync(thread, ct);
        await db.SaveChangesAsync(ct);
    }
}
