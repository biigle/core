<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreLabelTreeAuthorizedProject;
use Biigle\LabelTree;
use Biigle\Visibility;
use DB;
use Illuminate\Http\Request;

class LabelTreeAuthorizedProjectController extends Controller
{
    /**
     * Authorize a project to use a private label tree.
     *
     * @api {post} label-trees/:id/authorized-projects Add authorized project
     * @apiGroup Label Trees
     * @apiName StoreLabelTreesAuthorizedProjects
     * @apiPermission labelTreeAdmin
     *
     * @apiParam {Number} id The label tree ID
     *
     * @apiParam (Required attributes) {Number} id ID of the project to authorize
     *
     * @param StoreLabelTreeAuthorizedProject $request
     * @return \Illuminate\Http\RedirectResponse|void
     */
    public function store(StoreLabelTreeAuthorizedProject $request)
    {
        $id = $request->input('id');
        $tree = $request->tree;
        if (!$tree->authorizedProjects()->where('id', $id)->exists()) {
            DB::transaction(function () use ($tree, $id) {
                $rows = $tree->versions()
                    ->join('label_trees', 'label_trees.version_id', '=', 'label_tree_versions.id')
                    ->pluck('label_trees.id')
                    ->concat([$tree->id])
                    ->map(fn ($treeId) => [
                        'label_tree_id' => $treeId,
                        'project_id' => $id,
                    ])
                    ->all();

                DB::table('label_tree_authorized_project')->insert($rows);
            });
        }

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('saved', true);
        }
    }

    /**
     * Remove authorization of a project to use a private label tree.
     *
     * @api {delete} label-trees/:lid/authorized-projects/:pid Remove authorized project
     * @apiGroup Label Trees
     * @apiName DestroyLabelTreesAuthorizedProjects
     * @apiPermission labelTreeAdmin
     * @apiDescription If the label tree is private, this action will remove the label tree or any of its versions from the list of label trees used by the project.
     *
     * @apiParam {Number} lid The label tree ID.
     * @apiParam {Number} pid The project ID.
     *
     * @param Request $request
     * @param  int  $lid
     * @param  int  $pid
     * @return \Illuminate\Http\RedirectResponse|void
     */
    public function destroy(Request $request, $lid, $pid)
    {
        $tree = LabelTree::findOrFail($lid);
        $this->authorize('update', $tree);

        DB::transaction(function () use ($tree, $pid) {
            $treeIds = $tree->versions()
                ->join('label_trees', 'label_trees.version_id', '=', 'label_tree_versions.id')
                ->pluck('label_trees.id')
                ->concat([$tree->id]);

            DB::table('label_tree_authorized_project')
                ->where('project_id', $pid)
                ->whereIn('label_tree_id', $treeIds)
                ->delete();

            if ($tree->visibility_id === Visibility::privateId()) {
                DB::table('label_tree_project')
                    ->where('project_id', $pid)
                    ->whereIn('label_tree_id', $treeIds)
                    ->delete();
            }
        });

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('deleted', true);
        }
    }
}
