<?php

namespace Biigle\Http\Controllers\Views\LabelTrees;

use Biigle\Project;
use Biigle\LabelTree;
use Biigle\Visibility;
use Biigle\LabelTreeVersion;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Views\Controller;

class LabelTreeVersionsController extends Controller
{
    /**
     * Show the label tree version page.
     *
     * @param Request $request
     * @param int $tid Label tree ID
     * @param int $vid Label tree version ID
     *
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $tid, $vid)
    {
        $version = LabelTreeVersion::where('label_tree_id', $tid)->findOrFail($vid);
        $this->authorize('access', $version);

        $tree = LabelTree::where('version_id', $vid)->firstOrFail();

        return redirect()->route('label-trees', $tree->id);
    }

    /**
     * Show the create label tree version page.
     *
     * @param int $id Label tree ID
     *
     * @return \Illuminate\Http\Response
     */
    public function create($id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('create', [LabelTreeVersion::class, $tree]);

        return view('label-trees.versions.create', ['tree' => $tree]);
    }
}
