<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personnel', function (Blueprint $table) {
            if (!Schema::hasColumn('personnel', 'rank')) {
                $table->string('rank')->nullable()->after('program');
            }
            if (!Schema::hasColumn('personnel', 'expertise')) {
                $table->string('expertise')->nullable()->after('rank');
            }
            if (!Schema::hasColumn('personnel', 'gender')) {
                $table->string('gender', 50)->nullable()->after('expertise');
            }
            if (!Schema::hasColumn('personnel', 'contact_number')) {
                $table->string('contact_number', 50)->nullable()->after('gender');
            }
            if (!Schema::hasColumn('personnel', 'join_date')) {
                $table->date('join_date')->nullable()->after('contact_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('personnel', function (Blueprint $table) {
            $table->dropColumn(['rank', 'expertise', 'gender', 'contact_number', 'join_date']);
        });
    }
};