<?php

namespace Biigle\Http\Controllers\Api;

use DB;
use Ramsey\Uuid\Uuid;
use Biigle\LabelTree;
use Biigle\LabelTreeVersion;
use Biigle\Http\Requests\StoreLabelTreeVersion;
use Biigle\Http\Requests\UpdateLabelTreeVersion;
use Biigle\Http\Requests\DestroyLabelTreeVersion;

class LabelTreeVersionController extends Controller
{

    /**
     * Creates a new label tree version.
     *
     * @api {post} label-trees/:id/version Create a new label tree version
     * @apiGroup Label Trees
     * @apiName StoreLabelTreeVersions
     * @apiPermission labelTreeAdmin
     * @apiDescription This will create a copy of the label tree which can no longer be modified.
     *
     * @apiParam (Required attributes) {String} name Name of the new label tree version.
     *
     * @apiParam (Optional attributes) {String} description Description of the new label tree version. If empty, the description of the master label tree will be taken.
     *
     * @apiSuccessExample {json} Success response:
     *
     * {
     *    "id": 1,
     *    "name": "v1.0",
     *    "description": "First version of the label tree.",
     *    "label_tree_id": 1
     * }
     *
     * @param StoreLabelTreeVersion $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreLabelTreeVersion $request)
    {
        $version = DB::transaction(function () use ($request) {
            $version = new LabelTreeVersion;
            $version->name = $request->input('name');
            $version->label_tree_id = $request->tree->id;
            $version->save();

            $versionTree = $request->tree->replicate();
            $versionTree->uuid = Uuid::uuid4();
            $versionTree->version_id = $version->id;
            if ($request->filled('description')) {
                $versionTree->description = $request->input('description');
            }
            $versionTree->save();

            $versionTree->authorizedProjects()
                ->sync($request->tree->authorizedProjects()->pluck('id'));

            $this->replicateLabels($request->tree, $versionTree);

            return $version;
        });

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect('label-tree-versions', [$request->tree->id, $version->id])
                ->with('message', 'Label tree version created.')
                ->with('messageType', 'success');
        }
    }

    /**
     * Updates the attributes of the specified label tree version.
     *
     * @api {put} label-tree-versions/:id Update a label tree version
     * @apiGroup Label Trees
     * @apiName UpdateLabelTreeVersionss
     * @apiPermission labelTreeAdmin
     *
     * @apiParam {Number} id The label tree version ID
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the label tree version.
     *
     * @param UpdateLabelTreeVersion $request
     * @return \Illuminate\Http\Response
     */
    public function update(UpdateLabelTreeVersion $request)
    {
        $version = $request->version;
        $version->name = $request->input('name', $version->name);
        $version->save();
    }

    /**
     * Removes the specified label tree version.
     *
     * @api {delete} label-tree-versions/:id Delete a label tree version
     * @apiGroup Label Trees
     * @apiName DestroyLabelTreeVersionss
     * @apiPermission labelTreeAdmin
     * @apiDescription A label tree version cannot be deleted if it contains labels that are still used somewhere.
     *
     * @apiParam {Number} id The label tree version ID.
     *
     * @param DestroyLabelTreeVersion $request
     * @return \Illuminate\Http\Response
     */
    public function destroy(DestroyLabelTreeVersion $request)
    {
        $request->version->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('message', 'Label tree version deleted.')
                ->with('messageType', 'success');
        }
    }

    /**
     * Replicate all labels of one label tree to another.
     *
     * @param LabelTree $oldTree
     * @param LabelTree $newTree
     */
    protected function replicateLabels(LabelTree $oldTree, LabelTree $newTree)
    {
        $oldLabels = $oldTree->labels;
        $newLabels = $oldLabels->map(function ($label) use ($newTree) {
            $label = $label->replicate(['parent_id']);
            $label->label_tree_id = $newTree->id;
            $label->uuid = Uuid::uuid4();

            return $label;
        });

        $parents = $oldLabels->pluck('parent_id');
        $idMap = [];

        foreach ($newLabels as $index => $label) {
            $label->save();
            $idMap[$oldLabels[$index]->id] = $label->id;
        }

        foreach ($parents as $index => $id) {
            if (!is_null($id)) {
                $newLabels[$index]->parent_id = $idMap[$id];
                $newLabels[$index]->save();
            }
        }
    }
}
