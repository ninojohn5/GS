<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | RESEARCH_PROJECTS
    |--------------------------------------------------------------------------
    | Maps to the Project Proposal Form (F-RPP-002) from the PDF.
    | This is the core project record. Everything else hangs off this.
    |
    | Status values match the complete flow from the system notes:
    |   Draft → Submitted → Presentation Scheduled → Under Evaluation →
    |   Evaluated → Endorsed → Recommended → Forwarded → Approved
    |   (or Rejected / For Revision at any step)
    */
    public function up(): void
    {
        Schema::create('research_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_center_id')->nullable()->constrained('department_centers')->nullOnDelete();
            $table->foreignId('created_by')->constrained('personnel')->cascadeOnDelete();
            // created_by = the researcher/faculty who submitted

            // Auto-generated reference number e.g. CSUCCRDE-2025-00014
            $table->string('reference_no', 50)->unique()->nullable();

            // From F-RPP-002
            $table->enum('type', ['Research', 'ICT', 'Extension', 'ORGMS', 'Others']);
            $table->string('title');
            $table->string('lead_agency')->nullable();          // e.g. Caraga State University Cabadbaran Campus
            $table->text('address')->nullable();
            $table->string('tel_fax', 50)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('site_area')->nullable();            // Site / Area of Implementation

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('expected_completion_date')->nullable();
            $table->unsignedInteger('duration_months')->nullable();

            $table->decimal('budget', 15, 2)->nullable();
            $table->enum('category', [
                'Basic Research',
                'Applied Research',
                'Developmental Research',
                'Action Research',
            ])->nullable();

            // Narrative sections from F-RPP-002
            $table->text('nature_and_significance')->nullable();   // Background
            $table->text('issues_to_address')->nullable();
            $table->text('objectives')->nullable();
            $table->text('concept')->nullable();
            $table->text('beneficiaries')->nullable();
            $table->text('stakeholders')->nullable();
            $table->text('methodology')->nullable();
            $table->text('significance_impact')->nullable();

            $table->enum('status', [
                'Draft',
                'Submitted',
                'Presentation Scheduled',
                'Under Evaluation',
                'Evaluated',
                'Endorsed',
                'Recommended',
                'Forwarded',
                'Approved',
                'Rejected',
                'For Revision',
            ])->default('Draft');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_projects');
    }
};
