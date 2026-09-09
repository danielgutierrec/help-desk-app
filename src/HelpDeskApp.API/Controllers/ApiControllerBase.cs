using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpDeskApp.API.Controllers;

[ApiController]
[Authorize]
public abstract class ApiControllerBase : ControllerBase;
