<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | WORK_PLANS
    |--------------------------------------------------------------------------
    | Maps to CSU BP Form 1 — Work Plan from the PDF.
    | Each row = one activity with monthly target checkmarks (Jan–Dec).
    |
    | The WorkPlanDetail.jsx page groups activities by milestone.
    | The "milestone" field here replaces the "program_category" from the
    | PDF to match what the frontend already uses.
    */
    public function up(): void
    {
        Schema::create('work_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->cascadeOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            $table->string('milestone');
            // Frontend uses: Research Foundation, Data Collection,
            //                Data Analysis, Dissemination
            // Maps to PDF's program_category but more specific

            $table->enum('fund_cluster', [
                'Regular Agency Fund',
                'Internally-Generated Fund',
                'Business Related Fund',
            ])->nullable();

            // Monthly targets — boolean per month (Jan–Dec)
            $table->boolean('jan')->default(false);
            $table->boolean('feb')->default(false);
            $table->boolean('mar')->default(false);
            $table->boolean('apr')->default(false);
            $table->boolean('may')->default(false);
            $table->boolean('jun')->default(false);
            $table->boolean('jul')->default(false);
            $table->boolean('aug')->default(false);
            $table->boolean('sep')->default(false);
            $table->boolean('oct')->default(false);
            $table->boolean('nov')->default(false);
            $table->boolean('dec')->default(false);

            $table->unsignedSmallInteger('target_year')->nullable();
            // Which calendar year this activity falls in

            $table->enum('status', ['Pending', 'In Progress', 'Completed'])->default('Pending');
            $table->text('accomplishment')->nullable();

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_plans');
    }
};
