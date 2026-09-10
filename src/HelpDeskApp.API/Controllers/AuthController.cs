using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using HelpDeskApp.API.Services;
using HelpDeskApp.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HelpDeskApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    TokenService tokenService)
    : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return Unauthorized();

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
            return Unauthorized();

        var token = tokenService.GenerateToken(user);
        return Ok(new LoginResponse(token, user.Email!, user.Role.ToString()));
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var id = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        var email = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
        var role = User.FindFirst("role")?.Value;
        return Ok(new { id, email, role });
    }
}

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required][StringLength(128, MinimumLength = 1)] string Password);
public record LoginResponse(string Token, string Email, string Role);
