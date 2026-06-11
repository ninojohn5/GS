<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evaluation;
use App\Models\ProposalStatusHistory;
use App\Models\ResearchProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EvaluationController extends Controller
{
    // GET /api/evaluations/pending
    public function pending(Request $request)
    {
        $evaluatorId = $request->user()->id;

        $assignedProjectIds = DB::table('oral_presentation_evaluators')
            ->join(
                'oral_presentations',
                'oral_presentations.id',
                '=',
                'oral_presentation_evaluators.oral_presentation_id'
            )
            ->where('oral_presentation_evaluators.evaluator_id', $evaluatorId)
            ->pluck('oral_presentations.research_project_id')
            ->unique()
            ->values();

        $evaluatedProjectIds = Evaluation::where('evaluator_id', $evaluatorId)
            ->pluck('research_project_id')
            ->unique()
            ->values();

        $pendingIds = $assignedProjectIds->diff($evaluatedProjectIds)->values();

        $projects = ResearchProject::whereIn('id', $pendingIds)
        ->whereIn('status', [
            'Presentation Scheduled',
            'Scheduled',
            'Under Evaluation',
        ])
            ->with([
                'departmentCenter',
                'creator',
                'oralPresentation.evaluators',
            ])
            ->latest()
            ->get()
            ->map(function ($p) {
                return [
                    'id'           => $p->id,
                    'reference_no' => $p->reference_no,
                    'project_id'   => $p->reference_no ?: 'PRJ-' . $p->id,
                    'title'        => $p->title,
                    'dept'         => $p->departmentCenter?->name ?? $p->creator?->department ?? '',
                    'researcher'   => $p->creator?->name ?? '—',
                    'status'       => $p->status,
                    'presentation_date' => $p->oralPresentation?->presentation_date,
                    'presentation_time' => $p->oralPresentation?->presentation_time,
                    'venue'             => $p->oralPresentation?->venue,
                ];
            });

        return response()->json($projects);
    }

    // GET /api/evaluations/completed
    public function completed(Request $request)
    {
        $evaluatorId = $request->user()->id;
        $evaluatorName = $request->user()->name;

        $evaluations = Evaluation::where('evaluator_id', $evaluatorId)
            ->with('researchProject')
            ->latest()
            ->get()
            ->map(function ($e) use ($evaluatorName) {
                return [
                    'id'                         => $e->id,
                    'project_id'                 => $e->research_project_id,
                    'reference_no'               => $e->researchProject?->reference_no,
                    'title'                      => $e->researchProject?->title,
                    'evaluator'                  => $evaluatorName,
                    'date'                       => $e->evaluated_at?->format('Y-m-d'),
                    'score'                      => $e->total_score,
                    'remarks'                    => $e->overall_remarks,
                    'presentation_score'         => $e->presentation_score,
                    'relevance_discipline_score' => $e->relevance_discipline_score,
                    'relevance_rde_score'        => $e->relevance_rde_score,
                    'potential_benefits_score'   => $e->potential_benefits_score,
                    'comments'                   => $e->comments,
                ];
            });

        return response()->json($evaluations);
    }

    // POST /api/evaluations
    public function store(Request $request)
    {
        $data = $request->validate([
            'research_project_id'         => 'required|exists:research_projects,id',
            'presentation_score'          => 'required|numeric|min:0|max:40',
            'relevance_discipline_score'  => 'required|numeric|min:0|max:20',
            'relevance_rde_score'         => 'required|numeric|min:0|max:30',
            'potential_benefits_score'    => 'required|numeric|min:0|max:10',
            'significance_to_department'  => 'nullable|string',
            'units_to_be_credited'        => 'nullable|string',
            'significance_to_development' => 'nullable|string',
            'comments'                    => 'nullable|string',
            'signature_image'             => 'nullable|string',
            'signature_type'              => 'nullable|in:draw,upload,type',
        ]);

        $evaluatorId = $request->user()->id;
        $projectId = $data['research_project_id'];

        $alreadyEvaluated = Evaluation::where('research_project_id', $projectId)
            ->where('evaluator_id', $evaluatorId)
            ->exists();

        if ($alreadyEvaluated) {
            return response()->json([
                'message' => 'You have already evaluated this proposal.',
            ], 422);
        }

        // Block evaluation if presentation has not been scheduled yet
        $project = ResearchProject::findOrFail($projectId);
        $allowedStatuses = ['Presentation Scheduled', 'Scheduled', 'Under Evaluation'];
        if (!in_array($project->status, $allowedStatuses, true)) {
            return response()->json([
                'message' => 'This proposal is not ready for evaluation. The presentation must be scheduled first.',
            ], 422);
        }

        $assignedEvaluatorIds = DB::table('oral_presentation_evaluators')
            ->join(
                'oral_presentations',
                'oral_presentations.id',
                '=',
                'oral_presentation_evaluators.oral_presentation_id'
            )
            ->where('oral_presentations.research_project_id', $projectId)
            ->pluck('oral_presentation_evaluators.evaluator_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        // RDISO Director can evaluate any proposal without being formally assigned
        $isRdiso = $request->user()->role === 'rdiso_director';

        if (!$isRdiso && !$assignedEvaluatorIds->contains((int) $evaluatorId)) {
            return response()->json([
                'message' => 'You are not assigned to evaluate this proposal.',
            ], 403);
        }

        $evaluation = null;
        $project = null;

        DB::transaction(function () use (
            $data,
            $request,
            $projectId,
            $evaluatorId,
            $assignedEvaluatorIds,
            &$evaluation,
            &$project
        ) {
            $totalScore =
                (float) $data['presentation_score'] +
                (float) $data['relevance_discipline_score'] +
                (float) $data['relevance_rde_score'] +
                (float) $data['potential_benefits_score'];

            $evaluation = Evaluation::create([
                'research_project_id'         => $projectId,
                'evaluator_id'                => $evaluatorId,
                'presentation_score'          => $data['presentation_score'],
                'relevance_discipline_score'  => $data['relevance_discipline_score'],
                'relevance_rde_score'         => $data['relevance_rde_score'],
                'potential_benefits_score'    => $data['potential_benefits_score'],
                'total_score'                 => $totalScore,
                'overall_remarks'             => $data['comments'] ?? null,
                'significance_to_department'  => $data['significance_to_department'] ?? null,
                'units_to_be_credited'        => $data['units_to_be_credited'] ?? null,
                'significance_to_development' => $data['significance_to_development'] ?? null,
                'comments'                    => $data['comments'] ?? null,
                'signature_image'             => $data['signature_image'] ?? null,
                'signature_type'              => $data['signature_type'] ?? null,
                'evaluated_at'                => now(),
            ]);

            $project = ResearchProject::lockForUpdate()->findOrFail($projectId);

            $submittedEvaluatorIds = Evaluation::where('research_project_id', $projectId)
                ->whereIn('evaluator_id', $assignedEvaluatorIds)
                ->pluck('evaluator_id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();

            // Only mark as Evaluated when all *assigned* evaluators are done
            // RDISO Director evaluation does not count toward this check
            $allEvaluatorsDone =
                $assignedEvaluatorIds->count() > 0 &&
                $submittedEvaluatorIds->count() >= $assignedEvaluatorIds->count();

            $averageScore = Evaluation::where('research_project_id', $projectId)
                ->whereIn('evaluator_id', $assignedEvaluatorIds)
                ->avg('total_score');

            $updateData = [];

            if (Schema::hasColumn('research_projects', 'average_score')) {
                $updateData['average_score'] = $averageScore ? round($averageScore, 2) : null;
            }

            if ($allEvaluatorsDone) {
                $updateData['status'] = 'Evaluated';
            } elseif (in_array($project->status, ['Presentation Scheduled', 'Scheduled'], true)) {
                $updateData['status'] = 'Under Evaluation';
            }

            if (!empty($updateData)) {
                $project->update($updateData);
            }

            if ($allEvaluatorsDone) {
                ProposalStatusHistory::create([
                    'research_project_id' => $project->id,
                    'status'              => 'Evaluated',
                    'changed_by'          => $request->user()->id,
                    'remarks'             => 'All evaluator reviews completed. Forwarded to RDISO Director / ESO Director.',
                ]);
            } else {
                // Log every evaluator submission so the timeline shows all evaluators
                ProposalStatusHistory::create([
                    'research_project_id' => $project->id,
                    'status'              => 'Under Evaluation',
                    'changed_by'          => $request->user()->id,
                    'remarks'             => 'Evaluation submitted by ' . $request->user()->name . '.',
                ]);
            }
        });

        return response()->json([
        'message' => $project?->status === 'Evaluated'
            ? 'Evaluation submitted. All evaluators are done. Proposal forwarded to RDISO Director / ESO Director.'
            : 'Evaluation submitted successfully.',
            'evaluation' => $evaluation,
            'project'    => $project?->fresh(),
        ], 201);
    }

    // GET /api/evaluations/{id}
    public function show($id)
    {
        $evaluation = Evaluation::with(['researchProject', 'evaluator'])->findOrFail($id);

        return response()->json($evaluation);
    }
}