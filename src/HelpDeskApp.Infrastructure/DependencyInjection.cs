using HelpDeskApp.Core.Interfaces;
using HelpDeskApp.Infrastructure.Data;
using HelpDeskApp.Infrastructure.Repositories;
using HelpDeskApp.Infrastructure.Services;
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

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITicketRepository, TicketRepository>();
        services.AddScoped<IEmailThreadRepository, EmailThreadRepository>();

        services.AddHostedService<DatabaseSeeder>();

        return services;
    }
}
