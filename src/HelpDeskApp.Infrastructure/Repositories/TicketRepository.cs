using HelpDeskApp.Core.Entities;
using HelpDeskApp.Core.Enums;
using HelpDeskApp.Core.Interfaces;
using HelpDeskApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HelpDeskApp.Infrastructure.Repositories;

public class TicketRepository(AppDbContext db) : ITicketRepository
{
    public async Task<IReadOnlyList<Ticket>> GetByStatusAsync(TicketStatus status, CancellationToken ct = default)
        => await db.Tickets
            .Include(t => t.Thread)
            .Include(t => t.AssignedTo)
            .Where(t => t.Status == status)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync(ct);

    public async Task<Ticket?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Tickets
            .Include(t => t.Thread)
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task AddAsync(Ticket ticket, CancellationToken ct = default)
    {
        await db.Tickets.AddAsync(ticket, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Ticket ticket, CancellationToken ct = default)
    {
        db.Tickets.Update(ticket);
        await db.SaveChangesAsync(ct);
    }
}
