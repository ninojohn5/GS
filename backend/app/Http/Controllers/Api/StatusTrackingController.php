<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;

class StatusTrackingController extends Controller
{
    // GET /api/projects/{projectId}/status-history
    public function index($projectId)
    {
        $project = ResearchProject::with(['proposal', 'evaluations'])->findOrFail($projectId);

        $rawHistory = $project->statusHistories()
            ->with('changedBy')
            ->orderBy('created_at', 'desc')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Remove duplicate status rows
        |--------------------------------------------------------------------------
        | Keeps one row per status and prefers the row that has remarks.
        */
        $history = $rawHistory
            ->groupBy('status')
            ->map(function ($items) {
                $withRemarks = $items->first(function ($item) {
                    return !empty($item->remarks);
                });

                return $withRemarks ?: $items->first();
            })
            ->values()
            ->map(function ($h) {
                return [
                    'status'    => $h->status,
                    'remarks'   => $h->remarks,
                    'date'      => $h->created_at->format('Y-m-d'),
                    'time'      => $h->created_at->format('h:i A'),
                    'action_by' => $h->changedBy?->name ?? '—',
                    'role'      => $h->changedBy?->role ?? null,
                ];
            });

        $evaluationScore = $project->evaluations->count() > 0
            ? round($project->evaluations->avg('total_score'), 2)
            : null;

        return response()->json([
            'project' => [
                'id'               => $project->id,
                'title'            => $project->title,
                'reference_no'     => $project->reference_no,
                'current_status'   => $project->status,
                'submitted_at'     => $project->proposal?->submitted_at?->format('Y-m-d'),
                'evaluation_score' => $evaluationScore,
            ],
            'history' => $history,
        ]);
    }
}