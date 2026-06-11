<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\Proposal;
use App\Models\ProposalStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProposalController extends Controller
{
    public function saveDraft(Request $request)
    {
        $project = $this->saveProposalFlow($request, 'Draft');

        return response()->json([
            'message' => 'Draft saved successfully.',
            'project' => $project,
        ], 201);
    }

    public function submit(Request $request)
    {
        $project = $this->saveProposalFlow($request, 'Submitted');

        return response()->json([
            'message' => 'Proposal submitted successfully.',
            'project' => $project,
        ], 201);
    }

    public function myProposals(Request $request)
    {
        $projects = ResearchProject::where('created_by', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($id);

        $data = $request->validate([
            'scholarly_work_type'     => 'required|in:Research,Extension,Instructional Material Development',
            'category'                => 'nullable|string|max:255',
            'lead_agency'             => 'nullable|string|max:255',
            'site_area'               => 'nullable|string|max:255',
            'is_first_time'           => 'nullable',
            'has_external_collab'     => 'nullable',
            'external_collab_details' => 'nullable|string',
            'submitted_elsewhere'     => 'nullable',
            'other_agency_name'       => 'nullable|string',
            'other_agency_amount'     => 'nullable|string|max:255',
            'difference_explanation'  => 'nullable|string',
        ]);

        $projectData = [
            'type'                => $data['scholarly_work_type'],
            'scholarly_work_type' => $data['scholarly_work_type'],
            'category'            => $data['category'] ?? null,
            'lead_agency'         => $data['lead_agency'] ?? null,
            'site_area'           => $data['site_area'] ?? null,
        ];

        $this->fillExistingColumns($project, 'research_projects', $projectData);
        $project->save();

        $proposal = Proposal::updateOrCreate(
            ['research_project_id' => $project->id],
            [
                'scholarly_work_type'     => $data['scholarly_work_type'],
                'category'                => $data['category'] ?? null,
                'lead_agency'             => $data['lead_agency'] ?? null,
                'site_area'               => $data['site_area'] ?? null,
                'is_first_time'           => $this->toBool($data['is_first_time'] ?? false),
                'has_external_collab'     => $this->toBool($data['has_external_collab'] ?? false),
                'external_collab_details' => $data['external_collab_details'] ?? null,
                'submitted_elsewhere'     => $this->toBool($data['submitted_elsewhere'] ?? false),
                'other_agency_name'       => $data['other_agency_name'] ?? null,
                'other_agency_amount'     => $data['other_agency_amount'] ?? null,
                'difference_explanation'  => $data['difference_explanation'] ?? null,
                'submitted_at'            => now(),
            ]
        );

        return response()->json($proposal, 201);
    }

    public function show(Request $request, $id)
    {
        $project = ResearchProject::with(['proposal', 'proponents.personnel'])
            ->findOrFail($id);

        $user = $request->user();

        if ($user->role === 'researcher' && (int) $project->created_by !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $proposal = $project->proposal;

        $proponents = $project->proponents->map(function ($proponent) {
            return [
                'id'                  => $proponent->personnel?->id,
                'personnel_id'        => $proponent->personnel?->id,
                'proponent_record_id' => $proponent->id,
                'name'                => $proponent->personnel?->name,
                'email'               => $proponent->personnel?->email,
                'department'          => $proponent->personnel?->department,
                'program'             => $proponent->personnel?->program,
                'position'            => $proponent->personnel?->position,
                'role'                => $proponent->role,
                'cv_path'             => $proponent->cv_path,
            ];
        })->values();

        return response()->json([
            'project' => array_merge($project->toArray(), [
                'proponents' => $proponents,
            ]),
            'proposal' => $proposal,
        ]);
    }

    private function saveProposalFlow(Request $request, string $status)
    {
        $data = $request->validate([
            'title'                    => 'required|string|max:255',
            'scholarly_work_type'      => 'required|in:Research,Extension,Instructional Material Development',

            // Added fields for Project View
            'category'                 => 'nullable|string|max:255',
            'lead_agency'              => 'nullable|string|max:255',
            'site_area'                => 'nullable|string|max:255',

            'total_budget'             => 'nullable|string|max:255',
            'start_date'               => 'nullable|date',
            'end_date'                 => 'nullable|date',

            'signatures'               => 'nullable|string',

            'similar_work_elsewhere'   => 'nullable',
            'similar_work_details'     => 'nullable|string',

            'is_first_time'            => 'nullable',
            'past_works'               => 'nullable|string',

            'has_external_collab'      => 'nullable',
            'external_collab_details'  => 'nullable|string',

            'submitted_elsewhere'      => 'nullable',
            'other_agency_name'        => 'nullable|string',
            'other_agency_amount'      => 'nullable|string|max:255',
            'agency_difference_extent' => 'nullable|string',

            'proponents'               => 'nullable|string',
            'preferred_evaluators'     => 'nullable|string',

            'proposal_form'            => 'nullable|file|mimes:pdf,doc,docx|max:20480',
            'cv_files.*'               => 'nullable|file|mimes:pdf,doc,docx|max:20480',
            'work_plan_file'           => 'nullable|file|mimes:pdf,doc,docx,xlsx|max:20480',
            'framework_file'           => 'nullable|file|mimes:pdf,doc,docx|max:20480',
            'references_file'          => 'nullable|file|mimes:pdf,doc,docx|max:20480',
        ]);

        return DB::transaction(function () use ($request, $data, $status) {
            $project = $this->findOrCreateWorkingProject($request, $data, $status);

            // CV count must match proponent count on submit
            if ($status === 'Submitted') {
                $proponentsRaw = json_decode($data['proponents'] ?? '[]', true);
                $proponentCount = is_array($proponentsRaw) ? count($proponentsRaw) : 0;
                $cvCount = $request->hasFile('cv_files') ? count($request->file('cv_files')) : 0;

                // Check against existing CVs on the project
                $existingCvs = $project->cv_files
                    ? (is_array($project->cv_files) ? $project->cv_files : json_decode($project->cv_files, true))
                    : [];

                $totalCvs = $cvCount > 0 ? $cvCount : (is_array($existingCvs) ? count($existingCvs) : 0);

                if ($proponentCount > 0 && $totalCvs < $proponentCount) {
                    abort(422, "CV count mismatch: {$proponentCount} proponent(s) found but only {$totalCvs} CV file(s) uploaded. Please upload one CV per proponent.");
                }
            }

            $proposalFormPath = $this->storeUploadedFile($request, 'proposal_form', 'proposal_forms');
            $workPlanPath     = $this->storeUploadedFile($request, 'work_plan_file', 'work_plans');
            $frameworkPath    = $this->storeUploadedFile($request, 'framework_file', 'frameworks');
            $referencesPath   = $this->storeUploadedFile($request, 'references_file', 'references');

            $rawSignatures = $request->input('signatures');
            $decodedSignatures = json_decode($rawSignatures ?: '{}', true);

            if (!is_array($decodedSignatures)) {
                $decodedSignatures = [];
            }

            $signaturePaths = [];

            foreach ($decodedSignatures as $proponentId => $signature) {
                $path = $this->storeSignature($signature);

                if ($path) {
                    $signaturePaths[$proponentId] = $path;
                }
            }

            $cvPaths = [];

            if ($request->hasFile('cv_files')) {
                foreach ($request->file('cv_files') as $file) {
                    $cvPaths[] = $file->store('cv_files', 'public');
                }
            }

            $projectData = [
                'title'               => $data['title'],
                'type'                => $data['scholarly_work_type'],
                'scholarly_work_type' => $data['scholarly_work_type'],

                // Added fields for Project View
                'category'            => $data['category'] ?? null,
                'lead_agency'         => $data['lead_agency'] ?? null,
                'site_area'           => $data['site_area'] ?? null,

                'budget'              => $data['total_budget'] ?? null,
                'total_budget'        => $data['total_budget'] ?? null,
                'start_date'          => $data['start_date'] ?? null,
                'end_date'            => $data['end_date'] ?? null,
                'created_by'          => $request->user()->id,
                'status'              => $status,
            ];

            if (!$project->exists && Schema::hasColumn('research_projects', 'reference_no')) {
                $projectData['reference_no'] = $this->generateReferenceNo();
            }

            if ($proposalFormPath) {
                $projectData['proposal_form']      = $proposalFormPath;
                $projectData['proposal_form_path'] = $proposalFormPath;
            }

            if ($workPlanPath) {
                $projectData['work_plan_file'] = $workPlanPath;
                $projectData['work_plan_path'] = $workPlanPath;
            }

            if ($frameworkPath) {
                $projectData['framework_file'] = $frameworkPath;
                $projectData['framework_path'] = $frameworkPath;
            }

            if ($referencesPath) {
                $projectData['references_file'] = $referencesPath;
                $projectData['references_path'] = $referencesPath;
            }

            if (!empty($cvPaths)) {
                $projectData['cv_files'] = json_encode($cvPaths);
                $projectData['cv_paths'] = json_encode($cvPaths);
            }

            if (!empty($decodedSignatures)) {
                $projectData['signatures'] = json_encode($decodedSignatures);
            }

            if (!empty($signaturePaths)) {
                $projectData['signature_paths'] = json_encode($signaturePaths);
            }

            $this->fillExistingColumns($project, 'research_projects', $projectData);
            $project->save();

            $proposal = Proposal::where('research_project_id', $project->id)->first();

            if (!$proposal) {
                $proposal = new Proposal();
                $proposal->research_project_id = $project->id;
            }

            $proposalData = [
                'scholarly_work_type'      => $data['scholarly_work_type'],

                // Added fields, only saved if proposals table has these columns
                'category'                 => $data['category'] ?? null,
                'lead_agency'              => $data['lead_agency'] ?? null,
                'site_area'                => $data['site_area'] ?? null,

                'is_first_time'            => $this->toBool($data['is_first_time'] ?? true),
                'has_external_collab'      => $this->toBool($data['has_external_collab'] ?? false),
                'external_collab_details'  => $data['external_collab_details'] ?? null,
                'submitted_elsewhere'      => $this->toBool($data['submitted_elsewhere'] ?? false),
                'other_agency_name'        => $data['other_agency_name'] ?? null,
                'other_agency_amount'      => $data['other_agency_amount'] ?? null,
                'difference_explanation'   => $data['agency_difference_extent'] ?? null,
                'agency_difference_extent' => $data['agency_difference_extent'] ?? null,
                'similar_work_elsewhere'   => $this->toBool($data['similar_work_elsewhere'] ?? false),
                'similar_work_details'     => $data['similar_work_details'] ?? null,
                'past_works'               => $data['past_works'] ?? null,
                'preferred_evaluators'     => $data['preferred_evaluators'] ?? null,

                'signatures'               => !empty($decodedSignatures) ? json_encode($decodedSignatures) : null,
                'signature_paths'          => !empty($signaturePaths) ? json_encode($signaturePaths) : null,
            ];

            if ($status !== 'Draft') {
                $proposalData['submitted_at'] = now();
            }

            if ($proposalFormPath) {
                $proposalData['proposal_form']      = $proposalFormPath;
                $proposalData['proposal_form_path'] = $proposalFormPath;
            }

            if ($workPlanPath) {
                $proposalData['work_plan_file'] = $workPlanPath;
                $proposalData['work_plan_path'] = $workPlanPath;
            }

            if ($frameworkPath) {
                $proposalData['framework_file'] = $frameworkPath;
                $proposalData['framework_path'] = $frameworkPath;
            }

            if ($referencesPath) {
                $proposalData['references_file'] = $referencesPath;
                $proposalData['references_path'] = $referencesPath;
            }

            if (!empty($cvPaths)) {
                $proposalData['cv_files'] = json_encode($cvPaths);
                $proposalData['cv_paths'] = json_encode($cvPaths);
            }

            $this->fillExistingColumns($proposal, 'proposals', $proposalData);
            $proposal->save();

            $this->syncProponents($project->id, $data['proponents'] ?? null, $cvPaths);

            // Log status history for Submitted (not Draft)
            if ($status === 'Submitted') {
                $wasRevision = isset($project->id) &&
                    ResearchProject::find($project->id)?->getOriginal('status') === 'For Revision';

                ProposalStatusHistory::create([
                    'research_project_id' => $project->id,
                    'status'              => 'Submitted',
                    'changed_by'          => $request->user()->id,
                    'remarks'             => $wasRevision
                        ? 'Proposal resubmitted by researcher after revision.'
                        : 'Proposal submitted by researcher.',
                ]);
            }

            return $project->fresh();
        });
    }

    private function findOrCreateWorkingProject(Request $request, array $data, string $status)
    {
        if ($request->filled('project_id')) {
            return ResearchProject::where('created_by', $request->user()->id)
                ->findOrFail($request->input('project_id'));
        }

        // Look for existing Draft OR For Revision project with same title
        $existingProject = ResearchProject::where('created_by', $request->user()->id)
            ->whereIn('status', ['Draft', 'For Revision'])
            ->where('title', $data['title'])
            ->latest()
            ->first();

        if ($existingProject) {
            return $existingProject;
        }

        $project = new ResearchProject();
        $project->created_by = $request->user()->id;

        return $project;
    }

    private function syncProponents($projectId, $proponentsJson, array $cvPaths = [])
    {
        if (!Schema::hasTable('proponents')) {
            return;
        }

        $rawProponents = $this->jsonArray($proponentsJson);

        DB::table('proponents')->where('research_project_id', $projectId)->delete();

        foreach ($rawProponents as $index => $item) {
            if (is_array($item)) {
                $personnelId =
                    $item['personnel_id']
                    ?? ($item['personnel']['id'] ?? null)
                    ?? $item['id']
                    ?? null;

                $role = $item['role'] ?? ($index === 0 ? 'Leader' : 'Member');
            } else {
                $personnelId = $item;
                $role = $index === 0 ? 'Leader' : 'Member';
            }

            if (!$personnelId || is_array($personnelId) || is_object($personnelId)) {
                continue;
            }

            $role = strtolower(trim((string) $role));

            $role = match ($role) {
                'leader' => 'Leader',
                'co-leader', 'co leader', 'coleader' => 'Co-Leader',
                'member' => 'Member',
                default => $index === 0 ? 'Leader' : 'Member',
            };

            $row = [
                'research_project_id' => $projectId,
                'personnel_id'        => $personnelId,
                'role'                => $role,
                'created_at'          => now(),
                'updated_at'          => now(),
            ];

            if (Schema::hasColumn('proponents', 'cv_path')) {
                $row['cv_path'] = $cvPaths[$index] ?? null;
            }

            DB::table('proponents')->insert($row);
        }
    }

    private function fillExistingColumns($model, string $table, array $data)
    {
        foreach ($data as $column => $value) {
            if (Schema::hasColumn($table, $column)) {
                $model->{$column} = $value;
            }
        }
    }

    private function storeUploadedFile(Request $request, string $key, string $folder)
    {
        if (!$request->hasFile($key)) {
            return null;
        }

        return $request->file($key)->store($folder, 'public');
    }

    private function storeSignature($signature)
    {
        if (!$signature || !is_string($signature)) {
            return null;
        }

        if (!Str::startsWith($signature, 'data:image')) {
            return null;
        }

        if (!Str::contains($signature, ',')) {
            return null;
        }

        [$meta, $content] = explode(',', $signature, 2);

        $extension = Str::contains($meta, 'jpeg') || Str::contains($meta, 'jpg')
            ? 'jpg'
            : 'png';

        $fileName = 'signatures/' . Str::uuid() . '.' . $extension;

        Storage::disk('public')->put($fileName, base64_decode($content));

        return $fileName;
    }

    private function toBool($value)
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    private function jsonArray($json)
    {
        if (!$json) {
            return [];
        }

        $decoded = json_decode($json, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function generateReferenceNo()
    {
        $year = now()->format('Y');
        $nextNumber = ResearchProject::whereYear('created_at', $year)->count() + 1;

        do {
            $referenceNo = 'PRJ-' . $year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            $exists = ResearchProject::where('reference_no', $referenceNo)->exists();

            if ($exists) {
                $nextNumber++;
            }
        } while ($exists);

        return $referenceNo;
    }
}