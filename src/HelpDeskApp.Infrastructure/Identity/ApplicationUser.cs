using HelpDeskApp.Core.Enums;
using Microsoft.AspNetCore.Identity;

namespace HelpDeskApp.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; }
}
