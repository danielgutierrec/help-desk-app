using HelpDeskApp.API.Authorization;
using HelpDeskApp.Core.Enums;
using HelpDeskApp.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HelpDeskApp.API.Controllers;

[Route("api/admin")]
[Authorize(Roles = AppRoles.Admin)]
public class AdminController(UserManager<ApplicationUser> userManager) : ApiControllerBase
{
    [HttpPost("agents")]
    public async Task<IActionResult> CreateAgent([FromBody] CreateAgentRequest request)
    {
        var agent = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            UserName = request.Email,
            Role = UserRole.Agent
        };

        var result = await userManager.CreateAsync(agent, request.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));

        return CreatedAtAction(null, new { agent.Id, agent.Email, Role = agent.Role.ToString() });
    }
}

public record CreateAgentRequest(string Name, string Email, string Password);
