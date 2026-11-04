using System.ComponentModel.DataAnnotations;

namespace Lernplaner.Api.Models;

public class PlannedStudySession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CourseId { get; set; }

    public Course Course { get; set; } = null!;

    public DateOnly Date { get; set; }

    public TimeOnly StartTime { get; set; }

    [Range(1, 1440)]
    public int PlannedDurationMinutes { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}