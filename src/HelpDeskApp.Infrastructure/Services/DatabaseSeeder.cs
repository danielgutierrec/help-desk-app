using HelpDeskApp.Core.Entities;
using HelpDeskApp.Core.Enums;
using HelpDeskApp.Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HelpDeskApp.Infrastructure.Services;

public class DatabaseSeeder(IServiceProvider services, ILogger<DatabaseSeeder> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();

        if (await userRepo.AnyAsync(ct))
            return;

        var email = Environment.GetEnvironmentVariable("ADMIN_EMAIL");
        var password = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("ADMIN_EMAIL and ADMIN_PASSWORD env vars not set; skipping admin seed.");
            return;
        }

        var admin = new User
        {
            Id = Guid.NewGuid(),
            Name = "Admin",
            Email = email,
            Role = UserRole.Admin
        };

        admin.PasswordHash = new PasswordHasher<User>().HashPassword(admin, password);

        await userRepo.AddAsync(admin, ct);
        logger.LogInformation("Admin account seeded for {Email}.", email);
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
