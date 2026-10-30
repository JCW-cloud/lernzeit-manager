using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace Lernplaner.Api.Models;

public class Milestone
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateOnly? DueDate { get; set; }

    public bool IsCompleted { get; set; } = false;

    public DateTime? CompletedAtUtc { get; set; }

    // Lernziel
    public Guid LearningGoalId { get; set; }

    public LearningGoal LearningGoal { get; set; } = null!;
}