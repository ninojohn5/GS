<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_projects', function (Blueprint $table) {
            if (!Schema::hasColumn('research_projects', 'signatures')) {
                $table->longText('signatures')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'signature_paths')) {
                $table->longText('signature_paths')->nullable();
            }
        });

        Schema::table('proposals', function (Blueprint $table) {
            if (!Schema::hasColumn('proposals', 'signatures')) {
                $table->longText('signatures')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'signature_paths')) {
                $table->longText('signature_paths')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('research_projects', function (Blueprint $table) {
            if (Schema::hasColumn('research_projects', 'signatures')) {
                $table->dropColumn('signatures');
            }

            if (Schema::hasColumn('research_projects', 'signature_paths')) {
                $table->dropColumn('signature_paths');
            }
        });

        Schema::table('proposals', function (Blueprint $table) {
            if (Schema::hasColumn('proposals', 'signatures')) {
                $table->dropColumn('signatures');
            }

            if (Schema::hasColumn('proposals', 'signature_paths')) {
                $table->dropColumn('signature_paths');
            }
        });
    }
};