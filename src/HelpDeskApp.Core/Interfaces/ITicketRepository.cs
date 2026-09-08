using HelpDeskApp.Core.Entities;
using HelpDeskApp.Core.Enums;

namespace HelpDeskApp.Core.Interfaces;

public interface ITicketRepository
{
    Task<IReadOnlyList<Ticket>> GetByStatusAsync(TicketStatus status, CancellationToken ct = default);
    Task<Ticket?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Ticket ticket, CancellationToken ct = default);
    Task UpdateAsync(Ticket ticket, CancellationToken ct = default);
}
