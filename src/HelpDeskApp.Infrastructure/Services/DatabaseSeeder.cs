using HelpDeskApp.Core.Enums;
using HelpDeskApp.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HelpDeskApp.Infrastructure.Services;

public class DatabaseSeeder(IServiceProvider services, ILogger<DatabaseSeeder> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        if (await userManager.Users.AnyAsync(ct))
            return;

        var email = Environment.GetEnvironmentVariable("ADMIN_EMAIL");
        var password = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("ADMIN_EMAIL and ADMIN_PASSWORD env vars not set; skipping admin seed.");
            return;
        }

        var admin = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Name = "Admin",
            Email = email,
            UserName = email,
            Role = UserRole.Admin
        };

        var result = await userManager.CreateAsync(admin, password);

        if (!result.Succeeded)
            logger.LogError("Admin seed failed: {Errors}",
                string.Join("; ", result.Errors.Select(e => e.Description)));
        else
            logger.LogInformation("Admin account seeded for {Email}.", email);
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
