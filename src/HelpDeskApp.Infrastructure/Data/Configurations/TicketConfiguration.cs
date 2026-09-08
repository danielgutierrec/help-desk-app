using HelpDeskApp.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HelpDeskApp.Infrastructure.Data.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("tickets");
        builder.HasKey(t => t.Id);

        builder.HasOne(t => t.Thread)
            .WithMany()
            .HasForeignKey(t => t.ThreadId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.AssignedTo)
            .WithMany()
            .HasForeignKey(t => t.AssignedToId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.Property(t => t.Category).IsRequired();
        builder.Property(t => t.Status).IsRequired();
        builder.Property(t => t.AiSummary).IsRequired();
        builder.Property(t => t.AiDraft).IsRequired();
        builder.Property(t => t.FinalReply).IsRequired(false);
        builder.Property(t => t.CreatedAt).IsRequired();
        builder.Property(t => t.SentAt).IsRequired(false);
    }
}
