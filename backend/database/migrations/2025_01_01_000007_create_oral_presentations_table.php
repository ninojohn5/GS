<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | ORAL_PRESENTATIONS
    |--------------------------------------------------------------------------
    | Tracks the oral presentation / defense event scheduled by RDE Staff.
    | Step 2 in the system flow: after submission, before evaluation.
    |
    | The assigned evaluators/panelists are stored in the
    | oral_presentation_evaluators pivot table below.
    */
    public function up(): void
    {
        Schema::create('oral_presentations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')
                ->unique()
                ->constrained('research_projects')
                ->cascadeOnDelete();
            $table->foreignId('scheduled_by')->constrained('personnel')->cascadeOnDelete();
            // scheduled_by = the RDE Staff/Admin who set this up

            $table->date('presentation_date');
            $table->time('presentation_time');
            $table->string('venue');

            $table->timestamps();
        });

        // Pivot: which evaluators are assigned to this oral presentation
        Schema::create('oral_presentation_evaluators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oral_presentation_id')
                ->constrained('oral_presentations')
                ->cascadeOnDelete();
            $table->foreignId('evaluator_id')
                ->constrained('personnel')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(
            ['oral_presentation_id', 'evaluator_id'],
            'oral_eval_unique'
        );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('oral_presentation_evaluators');
        Schema::dropIfExists('oral_presentations');
    }
};
