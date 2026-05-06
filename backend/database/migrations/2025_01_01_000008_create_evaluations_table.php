<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | EVALUATIONS
    |--------------------------------------------------------------------------
    | Maps to the Evaluation of Research/Extension Proposal form from the PDF.
    | One record per evaluator per proposal.
    |
    | Scoring criteria from the PDF (system notes Section 4):
    |   - Proposal Presentation   : 40%  (sub: Organization 15%, Presentation 5%, Content 20%)
    |   - Relevance to Discipline : 20%
    |   - Relevance to RDE Agenda : 30%
    |   - Potential Benefits      : 10%
    |   Total                     : 100%
    |
    | NOTE: The frontend (Evaluations.jsx) currently uses 3 criteria
    | (Presentation 30, Relevance 35, Impact 35). This table uses the
    | correct 4-criteria breakdown from the actual PDF forms.
    | The frontend will need to be updated to match.
    |
    | Score thresholds (from PDF):
    |   70-100  → Approved
    |   60-69   → Pro-visionary (needs revision)
    |   Below 60 → Disapproved
    */
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->cascadeOnDelete();
            $table->foreignId('evaluator_id')->constrained('personnel')->cascadeOnDelete();

            // Scores — stored as decimals to allow partial points
            $table->decimal('presentation_score', 5, 2)->default(0);
            // Max 40 — covers Organization (15%), Presentation (5%), Content (20%)

            $table->decimal('relevance_discipline_score', 5, 2)->default(0);
            // Max 20

            $table->decimal('relevance_rde_score', 5, 2)->default(0);
            // Max 30

            $table->decimal('potential_benefits_score', 5, 2)->default(0);
            // Max 10

            $table->decimal('total_score', 5, 2)->default(0);
            // Computed: sum of all four scores (max 100)

            $table->enum('overall_remarks', ['Passed', 'Disapproved', 'Pro-visionary'])
                ->nullable();

            $table->text('significance_to_department')->nullable();
            $table->string('units_to_be_credited')->nullable();
            $table->text('significance_to_development')->nullable();
            $table->text('comments')->nullable();
            // General evaluation feedback

            // E-signature
            $table->text('signature_image')->nullable();
            // Stored as base64 string
            $table->enum('signature_type', ['draw', 'upload', 'type'])->nullable();

            $table->timestamp('evaluated_at')->nullable();

            $table->timestamps();

            // Each evaluator can only submit one evaluation per project
            $table->unique(['research_project_id', 'evaluator_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
