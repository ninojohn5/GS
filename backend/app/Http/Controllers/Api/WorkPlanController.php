<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\WorkPlan;
use Illuminate\Http\Request;

class WorkPlanController extends Controller
{
    // GET /api/projects/{projectId}/work-plan
    public function index($projectId)
    {
        $project = ResearchProject::findOrFail($projectId);
        $activities = $project->workPlans()->orderBy('milestone')->get();
        return response()->json($activities);
    }

    // POST /api/projects/{projectId}/work-plan
    public function store(Request $request, $projectId)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'milestone'    => 'required|string',
            'fund_cluster' => 'nullable|in:Regular Agency Fund,Internally-Generated Fund,Business Related Fund',
            'start_date'   => 'nullable|date',
            'end_date'     => 'nullable|date|after_or_equal:start_date',
            'target_year'  => 'nullable|integer',
            'jan' => 'boolean', 'feb' => 'boolean', 'mar' => 'boolean',
            'apr' => 'boolean', 'may' => 'boolean', 'jun' => 'boolean',
            'jul' => 'boolean', 'aug' => 'boolean', 'sep' => 'boolean',
            'oct' => 'boolean', 'nov' => 'boolean', 'dec' => 'boolean',
        ]);

        $activity = WorkPlan::create([
            ...$data,
            'research_project_id' => $projectId,
            'status'              => 'Pending',
        ]);

        return response()->json($activity, 201);
    }

    // PUT /api/projects/{projectId}/work-plan/{id}
    public function update(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $activity = WorkPlan::where('research_project_id', $projectId)->findOrFail($id);

        $data = $request->validate([
            'title'          => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'milestone'      => 'sometimes|string',
            'status'         => 'sometimes|in:Pending,In Progress,Completed',
            'accomplishment' => 'nullable|string',
            'start_date'     => 'nullable|date',
            'end_date'       => 'nullable|date',
            'jan' => 'boolean', 'feb' => 'boolean', 'mar' => 'boolean',
            'apr' => 'boolean', 'may' => 'boolean', 'jun' => 'boolean',
            'jul' => 'boolean', 'aug' => 'boolean', 'sep' => 'boolean',
            'oct' => 'boolean', 'nov' => 'boolean', 'dec' => 'boolean',
        ]);

        $activity->update($data);

        return response()->json($activity->fresh());
    }

    // DELETE /api/projects/{projectId}/work-plan/{id}
    public function destroy(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $activity = WorkPlan::where('research_project_id', $projectId)->findOrFail($id);
        $activity->delete();

        return response()->json(['message' => 'Activity deleted.']);
    }
}
