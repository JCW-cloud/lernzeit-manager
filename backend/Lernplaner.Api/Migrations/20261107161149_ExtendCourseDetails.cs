using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lernplaner.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExtendCourseDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExamTry",
                table: "Courses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExamType",
                table: "Courses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExpectedTimeMinutes",
                table: "Courses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "TargetDate",
                table: "Courses",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExamTry",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ExamType",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ExpectedTimeMinutes",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "TargetDate",
                table: "Courses");
        }
    }
}
