using HelpDeskApp.Core.Enums;

namespace HelpDeskApp.API.Authorization;

public static class AppRoles
{
    public const string Admin = nameof(UserRole.Admin);
    public const string Agent = nameof(UserRole.Agent);
}
