using System.ComponentModel.DataAnnotations;

namespace Lernplaner.Api.Models;

public class LearningGoal
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly TargetDate { get; set; }

    // geplante Lernzeit
    public decimal? TargetHours { get; set; }

    // Kurs
    public Guid CourseId { get; set; }

    public Course Course { get; set; } = null!;

    public bool IsCompleted { get; set; } = false;

    public DateTime? CompletedAtUtc { get; set; }
}