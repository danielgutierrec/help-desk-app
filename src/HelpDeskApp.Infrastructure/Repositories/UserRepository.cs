using HelpDeskApp.Core.Entities;
using HelpDeskApp.Core.Interfaces;
using HelpDeskApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HelpDeskApp.Infrastructure.Repositories;

public class UserRepository(AppDbContext db) : IUserRepository
{
    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Users.FindAsync([id], ct);

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public async Task<bool> AnyAsync(CancellationToken ct = default)
        => await db.Users.AnyAsync(ct);

    public async Task AddAsync(User user, CancellationToken ct = default)
    {
        await db.Users.AddAsync(user, ct);
        await db.SaveChangesAsync(ct);
    }
}
