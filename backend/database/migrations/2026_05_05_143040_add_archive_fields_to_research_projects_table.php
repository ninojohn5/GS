<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_projects', function (Blueprint $table) {
            if (!Schema::hasColumn('research_projects', 'is_archived')) {
                $table->boolean('is_archived')->default(false)->after('status');
            }

            if (!Schema::hasColumn('research_projects', 'archived_by')) {
                $table->foreignId('archived_by')
                    ->nullable()
                    ->after('is_archived')
                    ->constrained('personnel')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('research_projects', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('archived_by');
            }

            if (!Schema::hasColumn('research_projects', 'archive_reason')) {
                $table->text('archive_reason')->nullable()->after('archived_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('research_projects', function (Blueprint $table) {
            if (Schema::hasColumn('research_projects', 'archive_reason')) {
                $table->dropColumn('archive_reason');
            }

            if (Schema::hasColumn('research_projects', 'archived_at')) {
                $table->dropColumn('archived_at');
            }

            if (Schema::hasColumn('research_projects', 'archived_by')) {
                $table->dropConstrainedForeignId('archived_by');
            }

            if (Schema::hasColumn('research_projects', 'is_archived')) {
                $table->dropColumn('is_archived');
            }
        });
    }
};