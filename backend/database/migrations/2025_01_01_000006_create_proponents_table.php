<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('proponents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->cascadeOnDelete();
            $table->foreignId('personnel_id')->constrained('personnel')->cascadeOnDelete();

            $table->enum('role', ['Leader', 'Co-Leader', 'Member'])->default('Member');
            $table->string('cv_path')->nullable();

            $table->timestamps();

            $table->unique(['research_project_id', 'personnel_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proponents');
    }
};
