<?php

namespace Biigle\Http\Controllers\Views\LabelTrees;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelSource;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\User;
use Biigle\Visibility;
use Illuminate\Http\Request;

class LabelTreesController extends Controller
{
    /**
     * Show the label tree page.
     *
     * @param Request $request
     * @param int $id Label tree ID
     *
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $tree = LabelTree::findOrFail($id);

        $this->authorize('access', $tree);
        $user = $request->user();

        if (is_null($tree->version_id)) {
            return $this->showMasterLabelTree($tree, $user);
        }

        return $this->showVersionedLabelTree($tree, $user);
    }

    /**
     * Show the label tree list.
     *
     * @deprecated This is a legacy route and got replaced by the global search.
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return redirect()->route('search', ['t' => 'label-trees']);
    }

    /**
     * Show the create label tree page.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function create(Request $request)
    {
        $this->authorize('create', LabelTree::class);

        $visibilities = [
            Visibility::private(),
            Visibility::public(),
        ];

        if ($request->filled('project')) {
            $project = Project::findOrFail($request->input('project'));
            $this->authorize('update', $project);
        } else {
            $project = null;
        }

        if ($request->filled('upstream_label_tree')) {
            $upstreamLabelTree = LabelTree::findOrFail($request->input('upstream_label_tree'));
            $this->authorize('access', $upstreamLabelTree);
        } else {
            $upstreamLabelTree = null;
        }

        $selectedVisibility = (int) old('visibility_id') ?: $visibilities[0]->id;

        return view('label-trees.create', compact(
            'visibilities',
            'selectedVisibility',
            'project',
            'upstreamLabelTree'
        ));
    }

    /**
     * Show the label tree page of a master label tree.
     *
     * @param LabelTree $tree
     * @param User $user
     *
     * @return \Illuminate\Http\Response
     */
    protected function showMasterLabelTree(LabelTree $tree, User $user)
    {
        $labels = $tree->labels()
            ->select('id', 'name', 'parent_id', 'color', 'source_id')
            ->get();

        $visibilities = collect([
            Visibility::publicId() => Visibility::public()->name,
            Visibility::privateId() => Visibility::private()->name,
        ]);

        return view('label-trees.show.labels', [
            'tree' => $tree,
            'labels' => $labels,
            'visibilities' => $visibilities,
            'private' => $tree->visibility_id === Visibility::privateId(),
            'wormsLabelSource' => LabelSource::where('name', 'worms')->first(),
            'activeTab' => 'labels',
        ]);
    }

    /**
     * Show the label tree page of a versioned label tree.
     *
     * @param LabelTree $tree
     * @param User $user
     *
     * @return \Illuminate\Http\Response
     */
    protected function showVersionedLabelTree(LabelTree $tree, User $user)
    {
        $labels = $tree->labels()
            ->select('id', 'name', 'parent_id', 'color', 'source_id')
            ->get();

        if ($user->can('sudo')) {
            $projects = $tree->projects;
        } else {
            // All projects of the user that use the label tree version.
            $projects = Project::whereIn('id', function ($query) use ($user, $tree) {
                $query->select('project_user.project_id')
                    ->from('project_user')
                    ->join('label_tree_project', 'project_user.project_id', '=', 'label_tree_project.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('label_tree_project.label_tree_id', $tree->id);
            })->get();
        }

        return view('label-trees.versions.show.labels', [
            'version' => $tree->version,
            'tree' => $tree,
            'masterTree' => $tree->version->labelTree,
            'labels' => $labels,
            'projects' => $projects,
            'private' => $tree->visibility_id === Visibility::privateId(),
            'activeTab' => 'labels',
        ]);
    }
}
