using HelpDeskApp.Core.Enums;

namespace HelpDeskApp.Core.Interfaces;

public interface IAiService
{
    Task<(TicketCategory Category, string Summary)> ClassifyAndSummarizeAsync(string emailBody, CancellationToken ct = default);
    Task<string> DraftReplyAsync(string emailBody, TicketCategory category, IEnumerable<string> kbArticles, CancellationToken ct = default);
}
