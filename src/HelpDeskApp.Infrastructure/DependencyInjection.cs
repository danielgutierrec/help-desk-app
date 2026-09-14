using HelpDeskApp.Core.Interfaces;
using HelpDeskApp.Infrastructure.Data;
using HelpDeskApp.Infrastructure.Identity;
using HelpDeskApp.Infrastructure.Repositories;
using HelpDeskApp.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HelpDeskApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        var maxFailedAttempts = configuration.GetValue<int?>("Identity:Lockout:MaxFailedAccessAttempts") ?? 5;
        var lockoutMinutes = configuration.GetValue<int?>("Identity:Lockout:LockoutMinutes") ?? 15;
        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequiredLength = 12;
                options.Lockout.MaxFailedAccessAttempts = maxFailedAttempts;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(lockoutMinutes);
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

        services.AddScoped<ITicketRepository, TicketRepository>();
        services.AddScoped<IEmailThreadRepository, EmailThreadRepository>();

        services.AddHostedService<DatabaseSeeder>();

        return services;
    }
}
