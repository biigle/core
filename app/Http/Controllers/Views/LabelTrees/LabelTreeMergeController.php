<?php

namespace Biigle\Http\Controllers\Views\LabelTrees;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\LabelTreeVersion;
use Biigle\Project;
use Biigle\Visibility;
use DB;
use Illuminate\Http\Request;

class LabelTreeMergeController extends Controller
{
    /**
     * Show the label tree merge index page.
     *
     * @param Request $request
     * @param int $id ID of the base label tree
     *
     * @return mixed
     */
    public function index(Request $request, $id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('createLabel', $tree);
        $mergeCandidates = LabelTree::accessibleBy($request->user())
            ->where('id', '!=', $tree->id)
            ->select('id', 'name', 'description', 'version_id')
            ->with('version')
            ->get();

        return view('label-trees.merge.index', [
            'tree' => $tree,
            'mergeCandidates' => $mergeCandidates,
        ]);
    }

    /**
     * Show the label tree merge page.
     *
     * @param int $id1 ID of the base label tree
     * @param int $id2 ID of the label tree to merge into the base
     *
     * @return mixed
     */
    public function show($id1, $id2)
    {
        $baseTree = LabelTree::findOrFail($id1);
        $this->authorize('createLabel', $baseTree);
        $mergeTree = LabelTree::findOrFail($id2);
        $this->authorize('access', $mergeTree);

        $usedLabels = $baseTree->labels()->used()->pluck('labels.id');

        return view('label-trees.merge.show', [
            'baseTree' => $baseTree->load('labels'),
            'mergeTree' => $mergeTree->load('labels'),
            'usedLabels' => $usedLabels,
        ]);
    }
}
