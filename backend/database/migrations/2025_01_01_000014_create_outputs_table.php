<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | OUTPUTS
    |--------------------------------------------------------------------------
    | Maps to the Expected Output column in the endorsement letter from the PDF.
    | Example from CSUCCRDE-2025-00014:
    |   Output type: Publication
    |   Description: Repackaged students thesis
    |
    | This is what the Outputs.jsx and OutputsDetail.jsx pages manage.
    */
    public function up(): void
    {
        Schema::create('outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->cascadeOnDelete();

            $table->string('output_type');
            // e.g. Publication, Presentation, Patent, Policy Brief, Training Module

            $table->text('description');
            $table->enum('status', ['Pending', 'In Progress', 'Completed'])->default('Pending');
            $table->date('target_date')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outputs');
    }
};
