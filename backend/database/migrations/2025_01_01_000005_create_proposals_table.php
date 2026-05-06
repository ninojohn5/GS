<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | PROPOSALS
    |--------------------------------------------------------------------------
    | Maps to the Conduct of Scholarly Work Information Sheet (F-RPP-001).
    | This is the submission wrapper around a research_project.
    | One project = one proposal record.
    */
    public function up(): void
    {
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')
                ->unique() // one proposal per project
                ->constrained('research_projects')
                ->cascadeOnDelete();

            // From F-RPP-001
            $table->enum('scholarly_work_type', [
                'Research',
                'Extension',
                'Instructional Material Development',
            ]);

            $table->boolean('is_first_time')->default(true);
            // "Is this the first time applying for this scholarly work?"

            $table->boolean('has_external_collab')->default(false);
            $table->text('external_collab_details')->nullable();

            $table->boolean('submitted_elsewhere')->default(false);
            $table->string('other_agency_name')->nullable();
            $table->decimal('other_agency_amount', 15, 2)->nullable();
            $table->text('difference_explanation')->nullable();

            // Proponent signature on the information sheet
            $table->text('proponent_signature')->nullable();
            // Stored as base64 image string

            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};
