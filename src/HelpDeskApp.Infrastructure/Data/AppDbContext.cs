using HelpDeskApp.Core.Entities;
using HelpDeskApp.Infrastructure.Data.Configurations;
using Microsoft.EntityFrameworkCore;

namespace HelpDeskApp.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<EmailThread> EmailThreads => Set<EmailThread>();
    public DbSet<Ticket> Tickets => Set<Ticket>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new EmailThreadConfiguration());
        modelBuilder.ApplyConfiguration(new TicketConfiguration());
    }
}
