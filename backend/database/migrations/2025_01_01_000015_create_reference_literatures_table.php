<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | REFERENCE_LITERATURES
    |--------------------------------------------------------------------------
    | Maps to the Literature/Reference Cited section of the F-RPP-002 form.
    | Each row = one citation/reference.
    |
    | The ReferencesDetail.jsx page groups references by category and
    | supports types: Journal, Book, Conference, Web.
    */
    public function up(): void
    {
        Schema::create('reference_literatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_project_id')->constrained('research_projects')->cascadeOnDelete();

            $table->unsignedSmallInteger('citation_no')->nullable();
            // Number in the reference list (1, 2, 3...)

            $table->string('authors');
            // APA format: e.g. "Davis, F. D." or "Garrison, D. R., Anderson, T., & Archer, W."

            $table->unsignedSmallInteger('year');

            $table->text('title');

            $table->text('source')->nullable();
            // Journal name, volume, pages OR book publisher

            $table->string('doi', 200)->nullable();
            $table->string('url', 500)->nullable();

            $table->enum('type', ['Journal', 'Book', 'Conference', 'Web'])->default('Journal');

            $table->string('category')->nullable();
            // Research topic category, e.g. "Technology Acceptance", "Blended Learning"
            // Used by frontend to group references

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reference_literatures');
    }
};
