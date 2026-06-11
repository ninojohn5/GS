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
        | Build history — keep ALL "Under Evaluation" rows (one per evaluator)
        | but deduplicate other statuses (keep one with remarks if available).
        |--------------------------------------------------------------------------
        */
        $underEvalEntries = $rawHistory
            ->where('status', 'Under Evaluation')
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

        $otherEntries = $rawHistory
            ->where('status', '!=', 'Under Evaluation')
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

        // Merge and sort by original created_at desc
        $history = $rawHistory
            ->sortByDesc('created_at')
            ->filter(function ($h) {
                return true; // keep all
            })
            ->map(function ($h) {
                return [
                    'status'    => $h->status,
                    'remarks'   => $h->remarks,
                    'date'      => $h->created_at->format('Y-m-d'),
                    'time'      => $h->created_at->format('h:i A'),
                    'action_by' => $h->changedBy?->name ?? '—',
                    'role'      => $h->changedBy?->role ?? null,
                    '_key'      => $h->id, // unique key for dedup
                    '_status'   => $h->status,
                ];
            })
            // Deduplicate: for non-Under Evaluation statuses, keep one per status
            // For Under Evaluation, keep all (each = one evaluator)
            ->pipe(function ($items) {
                $seen = [];
                return $items->filter(function ($item) use (&$seen) {
                    if ($item['_status'] === 'Under Evaluation') {
                        return true; // always keep
                    }
                    if (in_array($item['_status'], $seen)) {
                        return false; // skip duplicate
                    }
                    $seen[] = $item['_status'];
                    return true;
                })->map(function ($item) {
                    unset($item['_key'], $item['_status']);
                    return $item;
                })->values();
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