<?php

namespace Biigle\Modules\LabelTrees\Http\Controllers;

use Biigle\Project;
use Biigle\LabelTree;
use Biigle\Visibility;
use Biigle\LabelTreeVersion;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Views\Controller;

class LabelTreeMergeController extends Controller
{
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

        return view('label-trees::merge.show', [
            'baseTree' => $baseTree->load('labels'),
            'mergeTree' => $mergeTree->load('labels'),
        ]);
    }
}
