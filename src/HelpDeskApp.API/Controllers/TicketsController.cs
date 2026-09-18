using HelpDeskApp.Core.Entities;
using HelpDeskApp.Core.Enums;
using HelpDeskApp.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HelpDeskApp.API.Controllers;

[Route("api/tickets")]
public class TicketsController(ITicketRepository tickets) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetQueue(CancellationToken ct)
    {
        var list = await tickets.GetByStatusAsync(TicketStatus.NeedsReview, ct);
        return Ok(list.Select(ToSummary));
    }

    [HttpGet("sent")]
    public async Task<IActionResult> GetSent(CancellationToken ct)
    {
        var list = await tickets.GetByStatusAsync(TicketStatus.Sent, ct);
        return Ok(list.Select(ToSummary));
    }

    private static TicketSummaryDto ToSummary(Ticket t) => new(
        t.Id,
        t.Thread.Subject,
        t.Thread.SenderEmail,
        t.Thread.SenderName,
        t.Category.ToString(),
        t.AiSummary,
        t.CreatedAt,
        t.SentAt);

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var ticket = await tickets.GetByIdAsync(id, ct);
        if (ticket is null) return NotFound();

        return Ok(new TicketDetailDto(
            ticket.Id,
            ticket.Thread.Subject,
            ticket.Thread.SenderEmail,
            ticket.Thread.SenderName,
            ticket.Thread.Body,
            ticket.Thread.ReceivedAt,
            ticket.Category.ToString(),
            ticket.Status.ToString(),
            ticket.AiSummary,
            ticket.AiDraft,
            ticket.FinalReply,
            ticket.CreatedAt,
            ticket.SentAt));
    }

    [HttpPatch("{id:guid}/draft")]
    public async Task<IActionResult> UpdateDraft(Guid id, [FromBody] UpdateDraftRequest request, CancellationToken ct)
    {
        var ticket = await tickets.GetByIdAsync(id, ct);
        if (ticket is null) return NotFound();

        ticket.FinalReply = request.FinalReply;
        await tickets.UpdateAsync(ticket, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/send")]
    public async Task<IActionResult> Send(Guid id, CancellationToken ct)
    {
        var ticket = await tickets.GetByIdAsync(id, ct);
        if (ticket is null) return NotFound();

        if (ticket.Status == TicketStatus.Sent)
            return Conflict(new { error = "Ticket already sent." });

        ticket.Status = TicketStatus.Sent;
        ticket.SentAt = DateTimeOffset.UtcNow;
        await tickets.UpdateAsync(ticket, ct);
        return NoContent();
    }
}

public record TicketSummaryDto(
    Guid Id,
    string Subject,
    string SenderEmail,
    string SenderName,
    string Category,
    string AiSummary,
    DateTimeOffset CreatedAt,
    DateTimeOffset? SentAt);

public record TicketDetailDto(
    Guid Id,
    string Subject,
    string SenderEmail,
    string SenderName,
    string Body,
    DateTimeOffset ReceivedAt,
    string Category,
    string Status,
    string AiSummary,
    string AiDraft,
    string? FinalReply,
    DateTimeOffset CreatedAt,
    DateTimeOffset? SentAt);

public record UpdateDraftRequest(string FinalReply);