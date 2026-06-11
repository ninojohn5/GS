<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Evaluation;
use App\Models\Personnel;
use App\Models\ProposalStatusHistory;
use App\Models\ResearchProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Safely parse a budget value that may be a string like "10000/to be determined".
     * Returns the numeric portion if found, or 0.
     */
    private function parseBudget($value): float
    {
        if (!$value) return 0;
        // Extract first number from string (handles "10000/note", "₱10,000", etc.)
        $clean = preg_replace('/[^\d.]/', '', explode('/', (string) $value)[0]);
        return (float) $clean;
    }

    private function sumBudgets($collection): float
    {
        return $collection->sum(fn($p) => $this->parseBudget($p->budget));
    }
    // GET /api/dashboard/stats
    public function stats(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'researcher') {
            return $this->researcherStats($user);
        }

        if ($user->role === 'evaluator') {
            return $this->evaluatorStats($user);
        }

        if (in_array($user->role, [
            'rdiso_director',
            'vprie',
            'president',
        ])) {
            return $this->approverStats($user);
        }

        return $this->adminStats();
    }

    private function researcherStats($user)
    {
        $projects = ResearchProject::where('created_by', $user->id)->get();

        $statusCounts = $projects->groupBy('status')->map->count();

        $recentActivity = ProposalStatusHistory::whereIn('research_project_id', $projects->pluck('id'))
            ->with(['researchProject', 'changedBy'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($history) {
                return [
                    'title'      => $history->status . ' - ' . optional($history->researchProject)->title,
                    'by'         => optional($history->changedBy)->name,
                    'date'       => $history->created_at->format('Y-m-d H:i'),
                    'project_id' => optional($history->researchProject)->reference_no,
                ];
            });

        return response()->json([
            'my_projects'      => $projects->count(),
            'submitted'        => $statusCounts->get('Submitted', 0),
            'approved'         => $statusCounts->get('Approved', 0),
            'draft'            => $statusCounts->get('Draft', 0),
            'for_revision'     => $statusCounts->get('For Revision', 0),
            'rejected'         => $statusCounts->get('Rejected', 0),
            'total_budget'     => $this->sumBudgets($projects),
            'local_count'      => $projects->where('funding_type', 'local')->count() + $projects->whereNull('funding_type')->count(),
            'external_count'   => $projects->where('funding_type', 'external')->count(),
            'status_counts'    => $statusCounts,
            'recent_activity'  => $recentActivity,
        ]);
    }

    private function evaluatorStats($user)
    {
        $assignedProjectIds = DB::table('oral_presentation_evaluators')
            ->join(
                'oral_presentations',
                'oral_presentations.id',
                '=',
                'oral_presentation_evaluators.oral_presentation_id'
            )
            ->where('oral_presentation_evaluators.evaluator_id', $user->id)
            ->pluck('oral_presentations.research_project_id')
            ->unique()
            ->values();

        $evaluatedIds = Evaluation::where('evaluator_id', $user->id)
            ->pluck('research_project_id')
            ->unique()
            ->values();

        $pendingCount = $assignedProjectIds->diff($evaluatedIds)->count();

        $evaluations = Evaluation::where('evaluator_id', $user->id)->get();

        $avgScore = $evaluations->avg('total_score');

        // Only count projects this evaluator is actually assigned to
        $assignedProjects = ResearchProject::whereIn('id', $assignedProjectIds)->get();

        $statusCounts = $assignedProjects->groupBy('status')->map->count();

        return response()->json([
            'awaiting_evaluation' => $pendingCount,
            'evaluated'           => $evaluations->count(),
            'total_proposals'     => $assignedProjectIds->count(), // only assigned ones
            'avg_score'           => round($avgScore ?? 0, 1),
            'status_counts'       => $statusCounts,
        ]);
    }

    private function approverStats($user)
    {
        $roleSequence = [
            'rdiso_director' => 1,
            'vprie'          => 2,
            'president'      => 3,
        ];

        $requiredStatus = [
            1 => 'Evaluated',
            2 => 'Endorsed',
            3 => 'Recommended',
        ];

        $sequence = $roleSequence[$user->role] ?? null;

        if (!$sequence) {
            return response()->json([
                'pending'      => 0,
                'approved'     => 0,
                'completed'    => 0,
                'rejected'     => 0,
                'returned'     => 0,
                'total'        => 0,
                'approvalRate' => 0,
                'byStatus'     => [
                    'pending'   => 0,
                    'approved'  => 0,
                    'rejected'  => 0,
                    'returned'  => 0,
                    'completed' => 0,
                ],
                'byDepartment' => [],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Pending proposals for this specific approver role
        |--------------------------------------------------------------------------
        */
        $pendingProjects = ResearchProject::where('status', $requiredStatus[$sequence])
            ->with('departmentCenter')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Completed actions by this logged-in approver
        |--------------------------------------------------------------------------
        */
        $actions = Approval::where('personnel_id', $user->id)
            ->with('researchProject.departmentCenter')
            ->get();

        $completedCount = $actions->count();

        $approvedCount = $actions
            ->whereIn('action', [
                'Endorsed',
                'Recommended',
                'Forwarded',
                'Approved',
            ])
            ->count();

        $rejectedCount = $actions
            ->where('action', 'Rejected')
            ->count();

        $returnedCount = $actions
            ->where('action', 'Returned')
            ->count();

        $total = $pendingProjects->count() + $completedCount;

        $approvalRate = $completedCount > 0
            ? round(($approvedCount / $completedCount) * 100)
            : 0;

        /*
        |--------------------------------------------------------------------------
        | Status distribution for the approver dashboard
        |--------------------------------------------------------------------------
        */
        $byStatus = [
            'pending'   => $pendingProjects->count(),
            'approved'  => $approvedCount,
            'rejected'  => $rejectedCount,
            'returned'  => $returnedCount,
            'completed' => $completedCount,
        ];

        /*
        |--------------------------------------------------------------------------
        | Budget by department
        |--------------------------------------------------------------------------
        | Combines pending projects and projects from completed actions.
        */
        $completedProjects = $actions
            ->pluck('researchProject')
            ->filter();

        $allRelevantProjects = $pendingProjects
            ->concat($completedProjects)
            ->unique('id')
            ->values();

        $byDepartment = $allRelevantProjects
            ->groupBy(function ($project) {
                return $project->departmentCenter?->name ?? 'Unassigned';
            })
            ->map(function ($items, $department) {
                return [
                    'department'   => $department,
                    'total_budget' => $this->sumBudgets($items),
                    'count'        => $items->count(),
                ];
            })
            ->values();

        return response()->json([
            'pending'      => $pendingProjects->count(),
            'approved'     => $approvedCount,
            'completed'    => $completedCount,
            'rejected'     => $rejectedCount,
            'returned'     => $returnedCount,
            'total'        => $total,
            'approvalRate' => $approvalRate,

            'byStatus' => $byStatus,

            'status_counts' => [
                'Pending'   => $pendingProjects->count(),
                'Approved'  => $approvedCount,
                'Rejected'  => $rejectedCount,
                'Returned'  => $returnedCount,
                'Completed' => $completedCount,
            ],

            'byDepartment' => $byDepartment,
        ]);
    }

    private function adminStats()
    {
        $visibleProjects = ResearchProject::whereIn('status', [
            'Submitted',
            'Presentation Scheduled',
            'Under Evaluation',
            'Evaluated',
            'Endorsed',
            'Recommended',
            'Forwarded',
            'Approved',
            'Rejected',
            'For Revision',
        ])->with('departmentCenter')->get();

        $statusCounts = $visibleProjects->groupBy('status')->map->count();

        $totalFaculty    = Personnel::where('role', 'researcher')->count();
        $totalEvaluators = Personnel::where('role', 'evaluator')->count();
        $systemUsers     = Personnel::count();

        // Build byDepartment from actual projects
        $byDepartment = $visibleProjects
            ->groupBy(function ($project) {
                return $project->departmentCenter?->name
                    ?? $project->department
                    ?? 'Unassigned';
            })
            ->map(function ($items, $department) {
                return [
                    'department'   => $department,
                    'total_budget' => $this->sumBudgets($items),
                    'count'        => $items->count(),
                ];
            })
            ->values();

        return response()->json([
            'total_faculty'    => $totalFaculty,
            'total_evaluators' => $totalEvaluators,
            'total_proposals'  => $visibleProjects->count(),
            'system_users'     => $systemUsers,

            'total_projects'   => $visibleProjects->count(),
            'total_budget'     => $this->sumBudgets($visibleProjects),

            'local_count'    => $visibleProjects->where('funding_type', 'local')->count()
                              + $visibleProjects->whereNull('funding_type')->count(),
            'external_count' => $visibleProjects->where('funding_type', 'external')->count(),

            'byStatus' => [
                'approved'                 => $statusCounts->get('Approved', 0),
                'submitted'                => $statusCounts->get('Submitted', 0),
                'presentation_scheduled'   => $statusCounts->get('Presentation Scheduled', 0),
                'under_evaluation'         => $statusCounts->get('Under Evaluation', 0),
                'evaluated'                => $statusCounts->get('Evaluated', 0),
                'endorsed'                 => $statusCounts->get('Endorsed', 0),
                'recommended'              => $statusCounts->get('Recommended', 0),
                'for_revision'             => $statusCounts->get('For Revision', 0),
                'rejected'                 => $statusCounts->get('Rejected', 0),
            ],

            'status_counts' => $statusCounts,
            'byDepartment'  => $byDepartment,
        ]);
    }
}