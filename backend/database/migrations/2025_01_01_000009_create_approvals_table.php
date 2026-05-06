<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | APPROVALS
    |--------------------------------------------------------------------------
    | Maps to all the signature/approval blocks in the PDF forms.
    | One record per approval step per proposal.
    |
    | The 4-step approval chain (from system notes Section 5):
    |   sequence_no 1 → RDE Division Chief   (Endorse / Return)
    |   sequence_no 2 → Campus Director      (Recommend / Return)
    |   sequence_no 3 → VPRIE               (Forward / Return)
    |   sequence_no 4 → University President (Approve / Reject)
    |
    | Real example from the PDF (CSUCCRDE-2025-00014):
    |   Jan 9  → Division Chief transmitted to Campus Director
    |   Jan 10 → Received at Office of Chancellor (Ref No. 00798)
    |   Jan 13 → Campus Director endorsed to President
    |   Jan 16 → President approved (Ref No. 1-485)
    */
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->cascadeOnDelete();
            $table->foreignId('personnel_id')->constrained('personnel')->cascadeOnDelete();
            // personnel_id = the approving person at this step

            $table->unsignedTinyInteger('sequence_no');
            // 1 = RDE Division Chief, 2 = Campus Director, 3 = VPRIE, 4 = President

            $table->string('role_at_approval');
            // Snapshot of their title at time of approval
            // e.g. "Division Chief for RDIE", "Campus Director"

            $table->enum('action', [
                'Endorsed',     // Step 1: RDE Division Chief approved
                'Recommended',  // Step 2: Campus Director approved
                'Forwarded',    // Step 3: VPRIE approved
                'Approved',     // Step 4: President final approval
                'Rejected',     // Rejected at any step
                'Returned',     // Returned for revision at any step
            ]);

            $table->string('reference_no', 50)->nullable();
            // e.g. "1-485" (from President's office stamp)

            $table->text('remarks')->nullable();
            // Required when action is Rejected or Returned

            // E-signature
            $table->text('signature_image')->nullable();
            $table->enum('signature_type', ['draw', 'upload', 'type'])->nullable();

            $table->timestamp('acted_at')->nullable();

            $table->timestamps();

            // Each approval step can only happen once per project
            $table->unique(['research_project_id', 'sequence_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
