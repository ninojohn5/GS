<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | PROJECT_FRAMEWORKS
    |--------------------------------------------------------------------------
    | Maps to the Project Framework (Logframe) form from the PDF.
    | Filled in after the President approves the proposal (Step 6).
    |
    | Each row = one objective with its activities, indicators,
    | quarterly targets, verification, assumptions, and funding source.
    |
    | From the PDF: targets are tracked per quarter for Year 1 and Year 2
    | (Q1, Q2, Q3, Q4 per year).
    */
    public function up(): void
    {
        Schema::create('project_frameworks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->cascadeOnDelete();

            $table->unsignedTinyInteger('year_no');
            // Which year this logframe row belongs to (1, 2, 3...)

            $table->text('objective');
            $table->text('activities');
            $table->text('performance_indicators');

            // Quarterly targets for this row
            $table->string('target_q1')->nullable();
            $table->string('target_q2')->nullable();
            $table->string('target_q3')->nullable();
            $table->string('target_q4')->nullable();

            $table->text('means_of_verification')->nullable();
            $table->text('key_assumptions')->nullable();

            $table->enum('funding_source', ['GAA', 'STF', 'Others'])->nullable();
            // GAA = General Appropriations Act, STF = Special Trust Fund

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_frameworks');
    }
};
