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
            'rde_division_chief',
            'campus_director',
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
            'total_budget'     => $projects->sum('budget'),
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
            ->pluck('oral_presentations.research_project_id');

        $evaluatedIds = Evaluation::where('evaluator_id', $user->id)
            ->pluck('research_project_id');

        $pendingCount = $assignedProjectIds->diff($evaluatedIds)->count();

        $evaluations = Evaluation::where('evaluator_id', $user->id)->get();

        $avgScore = $evaluations->avg('total_score');

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
        ])->get();

        $statusCounts = $visibleProjects->groupBy('status')->map->count();

        return response()->json([
            'awaiting_evaluation' => $pendingCount,
            'evaluated'           => $evaluations->count(),
            'total_proposals'     => $visibleProjects->count(),
            'avg_score'           => round($avgScore ?? 0, 1),
            'status_counts'       => $statusCounts,
        ]);
    }

    private function approverStats($user)
    {
        $roleSequence = [
            'rde_division_chief' => 1,
            'campus_director'    => 2,
            'vprie'              => 3,
            'president'          => 4,
        ];

        $requiredStatus = [
            1 => 'Evaluated',
            2 => 'Endorsed',
            3 => 'Recommended',
            4 => 'Forwarded',
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
                    'total_budget' => $items->sum('budget'),
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
        /*
        |--------------------------------------------------------------------------
        | Admin should not see drafts
        |--------------------------------------------------------------------------
        */
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
        ])->get();

        $statusCounts = $visibleProjects->groupBy('status')->map->count();

        $totalFaculty = Personnel::where('role', 'researcher')->count();

        $totalEvaluators = Personnel::where('role', 'evaluator')->count();

        $systemUsers = Personnel::count();

        return response()->json([
            'total_faculty'    => $totalFaculty,
            'total_evaluators' => $totalEvaluators,
            'total_proposals'  => $visibleProjects->count(),
            'system_users'     => $systemUsers,

            'total_projects'   => $visibleProjects->count(),
            'total_budget'     => $visibleProjects->sum('budget'),

            'byStatus' => [
                'approved'         => $statusCounts->get('Approved', 0),
                'in_progress'      => $statusCounts->get('In Progress', 0),
                'submitted'        => $statusCounts->get('Submitted', 0),
                'draft'            => 0,
                'under_evaluation' => $statusCounts->get('Under Evaluation', 0),
                'for_revision'     => $statusCounts->get('For Revision', 0),
                'rejected'         => $statusCounts->get('Rejected', 0),
            ],

            'status_counts' => $statusCounts,

            'byDepartment' => [],
        ]);
    }
}