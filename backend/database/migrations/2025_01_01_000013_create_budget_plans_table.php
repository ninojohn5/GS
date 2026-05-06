<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | BUDGET_PLANS
    |--------------------------------------------------------------------------
    | Maps to the Financial Plan / Budget Plan form from the PDF.
    | Each row = one line item in the budget.
    |
    | From the PDF example:
    |   1 paper x Php 16,000.00 = Total Php 16,000.00
    |   (Research Activities — Paper Presentation Registration)
    |
    | BudgetPlanDetail.jsx organizes items by year (1, 2, 3) and
    | by category (Personnel, Equipment, Travel, Supplies, Services, Other).
    */
    public function up(): void
    {
        Schema::create('budget_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->cascadeOnDelete();

            $table->unsignedTinyInteger('year_no');
            // 1, 2, or 3 — matches the 3-year breakdown in the frontend

            $table->string('category');
            // Personnel, Equipment, Travel, Supplies, Services, Other

            $table->text('description');
            // e.g. "Research Assistants (2 positions)"

            $table->decimal('quantity', 10, 2)->default(1);
            $table->string('unit')->nullable();
            // e.g. "person", "unit", "month"

            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            // total_amount = quantity * unit_price (can be overridden)

            $table->enum('funding_source', ['GAA', 'STF', 'Others'])->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_plans');
    }
};
