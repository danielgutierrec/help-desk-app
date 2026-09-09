using HelpDeskApp.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HelpDeskApp.Infrastructure.Data.Configurations;

public class EmailThreadConfiguration : IEntityTypeConfiguration<EmailThread>
{
    public void Configure(EntityTypeBuilder<EmailThread> builder)
    {
        builder.ToTable("email_threads");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.GmailThreadId).IsRequired().HasMaxLength(256);
        builder.HasIndex(e => e.GmailThreadId).IsUnique();
        builder.Property(e => e.Subject).IsRequired().HasMaxLength(1000);
        builder.Property(e => e.SenderEmail).IsRequired().HasMaxLength(300);
        builder.Property(e => e.SenderName).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Body).IsRequired();
        builder.Property(e => e.ReceivedAt).IsRequired();
    }
}
