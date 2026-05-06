<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | PROPOSAL_STATUS_HISTORIES
    |--------------------------------------------------------------------------
    | Full audit trail of every status change on every proposal.
    | Maps to the received/date stamps and transmission records in the PDF.
    | This is what feeds the StatusTracking.jsx timeline on both
    | researcher and evaluator pages.
    |
    | A new row is inserted automatically (via Observer or Service) whenever
    | research_projects.status changes.
    */
    public function up(): void
    {
        Schema::create('proposal_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->cascadeOnDelete();
            $table->foreignId('changed_by')->constrained('personnel')->cascadeOnDelete();
            // changed_by = the person whose action caused this status change

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
            ]);

            $table->text('remarks')->nullable();
            // Optional note about why the status changed
            // Required when status is Rejected or For Revision

            $table->timestamps();
            // created_at = the exact timestamp of the status change
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposal_status_histories');
    }
};
