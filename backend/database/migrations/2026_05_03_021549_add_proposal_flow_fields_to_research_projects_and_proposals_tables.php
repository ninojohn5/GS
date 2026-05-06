<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_projects', function (Blueprint $table) {
            if (!Schema::hasColumn('research_projects', 'scholarly_work_type')) {
                $table->string('scholarly_work_type')->nullable()->after('type');
            }

            if (!Schema::hasColumn('research_projects', 'total_budget')) {
                $table->decimal('total_budget', 15, 2)->nullable()->after('budget');
            }

            if (!Schema::hasColumn('research_projects', 'proposal_form')) {
                $table->string('proposal_form')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'proposal_form_path')) {
                $table->string('proposal_form_path')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'cv_files')) {
                $table->longText('cv_files')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'cv_paths')) {
                $table->longText('cv_paths')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'work_plan_file')) {
                $table->string('work_plan_file')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'work_plan_path')) {
                $table->string('work_plan_path')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'framework_file')) {
                $table->string('framework_file')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'framework_path')) {
                $table->string('framework_path')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'references_file')) {
                $table->string('references_file')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'references_path')) {
                $table->string('references_path')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'signature')) {
                $table->longText('signature')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'signature_path')) {
                $table->string('signature_path')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'signatures')) {
                $table->longText('signatures')->nullable();
            }

            if (!Schema::hasColumn('research_projects', 'signature_paths')) {
                $table->longText('signature_paths')->nullable();
            }
        });

        Schema::table('proposals', function (Blueprint $table) {
            if (!Schema::hasColumn('proposals', 'past_works')) {
                $table->longText('past_works')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'agency_difference_extent')) {
                $table->text('agency_difference_extent')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'similar_work_elsewhere')) {
                $table->boolean('similar_work_elsewhere')->default(false);
            }

            if (!Schema::hasColumn('proposals', 'similar_work_details')) {
                $table->text('similar_work_details')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'preferred_evaluators')) {
                $table->longText('preferred_evaluators')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'signature')) {
                $table->longText('signature')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'signatures')) {
                $table->longText('signatures')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'signature_paths')) {
                $table->longText('signature_paths')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'proposal_form')) {
                $table->string('proposal_form')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'proposal_form_path')) {
                $table->string('proposal_form_path')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'cv_files')) {
                $table->longText('cv_files')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'cv_paths')) {
                $table->longText('cv_paths')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'work_plan_file')) {
                $table->string('work_plan_file')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'work_plan_path')) {
                $table->string('work_plan_path')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'framework_file')) {
                $table->string('framework_file')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'framework_path')) {
                $table->string('framework_path')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'references_file')) {
                $table->string('references_file')->nullable();
            }

            if (!Schema::hasColumn('proposals', 'references_path')) {
                $table->string('references_path')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('research_projects', function (Blueprint $table) {
            $columns = [
                'scholarly_work_type',
                'total_budget',
                'proposal_form',
                'proposal_form_path',
                'cv_files',
                'cv_paths',
                'work_plan_file',
                'work_plan_path',
                'framework_file',
                'framework_path',
                'references_file',
                'references_path',
                'signature',
                'signature_path',
                'signatures',
                'signature_paths',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('research_projects', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('proposals', function (Blueprint $table) {
            $columns = [
                'past_works',
                'agency_difference_extent',
                'similar_work_elsewhere',
                'similar_work_details',
                'preferred_evaluators',
                'signature',
                'signatures',
                'signature_paths',
                'proposal_form',
                'proposal_form_path',
                'cv_files',
                'cv_paths',
                'work_plan_file',
                'work_plan_path',
                'framework_file',
                'framework_path',
                'references_file',
                'references_path',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('proposals', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};