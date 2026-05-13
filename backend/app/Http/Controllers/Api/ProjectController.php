<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\Personnel;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    // GET /api/projects
    public function index(Request $request)
    {
        $user = $request->user();
        $showArchived = $request->boolean('archived');

        if ($user->role === 'researcher') {
            $projects = ResearchProject::where('created_by', $user->id)
                ->when($showArchived, function ($query) {
                    $query->where('is_archived', true);
                })
                ->when(! $showArchived, function ($query) {
                    $query->where(function ($q) {
                        $q->where('is_archived', false)
                            ->orWhereNull('is_archived');
                    });
                })
                ->with([
                    'departmentCenter',
                    'creator',
                    'proponents.personnel',
                    'proposal',
                    'oralPresentation.evaluators',
                ])
                ->latest()
                ->get();
        } else {
            $projects = ResearchProject::with([
                    'departmentCenter',
                    'creator',
                    'proponents.personnel',
                    'proposal',
                    'oralPresentation.evaluators',
                ])
                ->latest()
                ->get();
        }

        return response()->json($projects);
    }

    // POST /api/projects
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'                    => 'required|string|max:255',
            'type'                     => 'required|in:Research,Extension,Others',
            'category'                 => 'nullable|in:Basic Research,Applied Research,Developmental Research,Action Research',
            'department_center_id'     => 'nullable|exists:department_centers,id',
            'lead_agency'              => 'nullable|string',
            'address'                  => 'nullable|string',
            'tel_fax'                  => 'nullable|string',
            'email'                    => 'nullable|email',
            'site_area'                => 'nullable|string',
            'start_date'               => 'nullable|date',
            'end_date'                 => 'nullable|date|after_or_equal:start_date',
            'expected_completion_date' => 'nullable|date',
            'duration_months'          => 'nullable|integer|min:1',
            'budget'                   => 'nullable|string|max:255',
            'funding_type'             => 'nullable|in:local,external',
            'funding_agency'           => 'nullable|string|max:255',
            'external_amount'          => 'nullable|string|max:255',
            'nature_and_significance'  => 'nullable|string',
            'issues_to_address'        => 'nullable|string',
            'objectives'               => 'nullable|string',
            'concept'                  => 'nullable|string',
            'beneficiaries'            => 'nullable|string',
            'stakeholders'             => 'nullable|string',
            'methodology'              => 'nullable|string',
            'significance_impact'      => 'nullable|string',
        ]);

        $project = ResearchProject::create([
            ...$data,
            'created_by'  => $request->user()->id,
            'status'      => 'Draft',
            'is_archived' => false,
        ]);

        $project->proponents()->create([
            'personnel_id' => $request->user()->id,
            'role'         => 'Leader',
        ]);

        return response()->json(
            $project->load([
                'departmentCenter',
                'creator',
                'proponents.personnel',
                'proposal',
                'oralPresentation.evaluators',
            ]),
            201
        );
    }

    // GET /api/projects/{id}
    public function show(Request $request, $id)
    {
        $project = ResearchProject::with([
            'departmentCenter',
            'creator',
            'proponents.personnel',
            'proposal',
            'oralPresentation.evaluators',
            'evaluations.evaluator',
            'approvals.personnel',
            'statusHistories.changedBy',
        ])->findOrFail($id);

        $user = $request->user();

        if ($user->role === 'researcher' && (int) $project->created_by !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $preferredEvaluatorIds = [];

        if ($project->proposal && $project->proposal->preferred_evaluators) {
            $raw = $project->proposal->preferred_evaluators;

            if (is_string($raw)) {
                $decoded = json_decode($raw, true);
                $preferredEvaluatorIds = is_array($decoded) ? $decoded : [];
            } elseif (is_array($raw)) {
                $preferredEvaluatorIds = $raw;
            }
        }

        $preferredEvaluatorIds = collect($preferredEvaluatorIds)
            ->map(function ($id) {
                if (is_array($id)) {
                    return $id['id'] ?? $id['personnel_id'] ?? $id['evaluator_id'] ?? null;
                }

                return $id;
            })
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        $preferredEvaluators = Personnel::whereIn('id', $preferredEvaluatorIds)
            ->get([
                'id',
                'name',
                'email',
                'department',
                'program',
                'position',
                'rank',
                'expertise',
                'is_active',
            ])
            ->values();

        $projectArray = $project->toArray();
        $projectArray['preferred_evaluators_details'] = $preferredEvaluators;

        return response()->json($projectArray);
    }

    // PUT /api/projects/{id}
    public function update(Request $request, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($id);

        $data = $request->validate([
            'title'                   => 'sometimes|string|max:255',
            'type'                    => 'sometimes|in:Research,Extension,Others',
            'category'                => 'nullable|in:Basic Research,Applied Research,Developmental Research,Action Research',
            'department_center_id'    => 'nullable|exists:department_centers,id',
            'lead_agency'             => 'nullable|string',
            'address'                 => 'nullable|string',
            'site_area'               => 'nullable|string',
            'start_date'              => 'nullable|date',
            'end_date'                => 'nullable|date',
            'budget'                  => 'nullable|string|max:255',
            'funding_type'            => 'nullable|in:local,external',
            'funding_agency'          => 'nullable|string|max:255',
            'external_amount'         => 'nullable|string|max:255',
            'nature_and_significance' => 'nullable|string',
            'issues_to_address'       => 'nullable|string',
            'objectives'              => 'nullable|string',
            'methodology'             => 'nullable|string',
            'significance_impact'     => 'nullable|string',
        ]);

        $project->update($data);

        return response()->json(
            $project->fresh([
                'departmentCenter',
                'creator',
                'proponents.personnel',
                'proposal',
                'oralPresentation.evaluators',
            ])
        );
    }

    // POST /api/projects/{id}/submit
    public function submit(Request $request, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->where('status', 'Draft')
            ->findOrFail($id);

        $project->update([
            'status'      => 'Submitted',
            'is_archived' => false,
        ]);

        return response()->json([
            'message' => 'Proposal submitted successfully.',
            'project' => $project->fresh([
                'departmentCenter',
                'creator',
                'proponents.personnel',
                'proposal',
                'oralPresentation.evaluators',
            ]),
        ]);
    }

    // PATCH /api/projects/{id}/archive
    public function archive(Request $request, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($id);

        $project->update([
            'is_archived'    => true,
            'archived_by'    => $request->user()->id,
            'archived_at'    => now(),
            'archive_reason' => $request->input('archive_reason', 'Archived by researcher'),
        ]);

        return response()->json([
            'message' => 'Project archived successfully.',
            'project' => $project->fresh(),
        ]);
    }

    // PATCH /api/projects/{id}/restore
    public function restore(Request $request, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($id);

        $project->update([
            'is_archived'    => false,
            'archived_by'    => null,
            'archived_at'    => null,
            'archive_reason' => null,
        ]);

        return response()->json([
            'message' => 'Project restored successfully.',
            'project' => $project->fresh(),
        ]);
    }
}