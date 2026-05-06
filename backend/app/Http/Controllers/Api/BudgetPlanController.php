<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\BudgetPlan;
use Illuminate\Http\Request;

class BudgetPlanController extends Controller
{
    // GET /api/projects/{projectId}/budget-plan
    public function index($projectId)
    {
        $project = ResearchProject::findOrFail($projectId);
        $items = $project->budgetPlans()->orderBy('year_no')->orderBy('category')->get();

        // Group by year for the frontend
        $grouped = $items->groupBy('year_no')->map(function ($yearItems, $year) {
            return [
                'year'     => $year,
                'items'    => $yearItems,
                'subtotal' => $yearItems->sum('total_amount'),
            ];
        })->values();

        return response()->json([
            'items'        => $items,
            'grouped'      => $grouped,
            'total_budget' => $items->sum('total_amount'),
        ]);
    }

    // POST /api/projects/{projectId}/budget-plan
    public function store(Request $request, $projectId)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $data = $request->validate([
            'year_no'        => 'required|integer|min:1|max:10',
            'category'       => 'required|string|max:100',
            'description'    => 'required|string',
            'quantity'       => 'nullable|numeric|min:0',
            'unit'           => 'nullable|string|max:50',
            'unit_price'     => 'required|numeric|min:0',
            'funding_source' => 'nullable|in:GAA,STF,Others',
        ]);

        $item = BudgetPlan::create([
            ...$data,
            'research_project_id' => $projectId,
            'quantity'            => $data['quantity'] ?? 1,
        ]);

        return response()->json($item, 201);
    }

    // PUT /api/projects/{projectId}/budget-plan/{id}
    public function update(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $item = BudgetPlan::where('research_project_id', $projectId)->findOrFail($id);

        $data = $request->validate([
            'year_no'        => 'sometimes|integer|min:1',
            'category'       => 'sometimes|string|max:100',
            'description'    => 'sometimes|string',
            'quantity'       => 'nullable|numeric|min:0',
            'unit'           => 'nullable|string|max:50',
            'unit_price'     => 'sometimes|numeric|min:0',
            'funding_source' => 'nullable|in:GAA,STF,Others',
        ]);

        $item->update($data);

        return response()->json($item->fresh());
    }

    // DELETE /api/projects/{projectId}/budget-plan/{id}
    public function destroy(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $item = BudgetPlan::where('research_project_id', $projectId)->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Budget item deleted.']);
    }
}
