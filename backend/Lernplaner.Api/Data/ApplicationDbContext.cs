using Lernplaner.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Lernplaner.Api.Data;

public class ApplicationDbContext
    : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Course> Courses => Set<Course>();

    public DbSet<LearningGoal> LearningGoals => Set<LearningGoal>();

    public DbSet<PlannedStudySession> PlannedStudySessions { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Course>(entity =>
        {
            entity.HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<LearningGoal>(entity =>
        {
            entity.HasOne(g => g.Course)
            .WithMany(c => c.LearningGoals)
            .HasForeignKey(g => g.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

            entity.Property(g => g.TargetHours)
            .HasPrecision(7, 2);
        });

        builder.Entity<PlannedStudySession>()
        .HasOne(p => p.Course)
        .WithMany()
        .HasForeignKey(p => p.CourseId)
        .OnDelete(DeleteBehavior.Cascade);
    }
}