<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ----------------------------------------------------------------
        // 1. budget column from numeric to string in research_projects
        // ----------------------------------------------------------------
        Schema::table('research_projects', function (Blueprint $table) {
            $table->string('budget', 255)->nullable()->change();
        });

        // ----------------------------------------------------------------
        // 2. Add funding_type, funding_agency, external_amount columns
        // ----------------------------------------------------------------
        Schema::table('research_projects', function (Blueprint $table) {
            if (!Schema::hasColumn('research_projects', 'funding_type')) {
                $table->enum('funding_type', ['local', 'external'])->nullable()->after('budget');
            }
            if (!Schema::hasColumn('research_projects', 'funding_agency')) {
                $table->string('funding_agency', 255)->nullable()->after('funding_type');
            }
            if (!Schema::hasColumn('research_projects', 'external_amount')) {
                $table->string('external_amount', 255)->nullable()->after('funding_agency');
            }
        });
    }

    public function down(): void
    {
        // Revert role renames
        DB::table('personnel')
            ->where('role', 'rdiso_director')
            ->update(['role' => 'rde_division_chief']);

        // Revert budget column
        Schema::table('research_projects', function (Blueprint $table) {
            $table->decimal('budget', 15, 2)->nullable()->change();
        });

        // Drop added columns
        Schema::table('research_projects', function (Blueprint $table) {
            $table->dropColumnIfExists('funding_type');
            $table->dropColumnIfExists('funding_agency');
            $table->dropColumnIfExists('external_amount');
        });
    }
};