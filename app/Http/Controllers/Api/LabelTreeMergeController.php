<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreLabelTreeMerge;
use Biigle\Label;
use DB;
use Ramsey\Uuid\Uuid;

class LabelTreeMergeController extends Controller
{
    /**
     * Add or remove many labels of a tree.
     *
     * @api {post} label-trees/:id/merge-labels Create/remove many labels
     * @apiGroup Label Trees
     * @apiName StoreLabelTreesMergeLabels
     * @apiPermission labelTreeEditor
     * @apiDescription Nested new labels can be created by setting the `children` array of labels that should be created (see the example). See the endpoint to create a single label for the properties of a new label. This endpoint is not compatible with label sources. Use the endpoint to create a single label for that.
     *
     * @apiParam {Number} id The label tree ID
     *
     * @apiParam (Required arguments) {Array} create Array of labels to create.
     * @apiParam (Required arguments) {Array} remove Array of label IDs to remove.
     *
     * @apiParamExample {json} Request example (JSON):
     * {
     *    "create": [
     *       {
     *          "name": "My new parent",
     *          "color": "bada55"
     *          "parent_id": 1337,
     *          "children": [
     *             {
     *                "name": "My new child",
     *                "color": "c0ffee"
     *             }
     *          ]
     *       }
     *    ],
     *    "remove": [1336]
     * }
     *
     * @param StoreLabelTreeMerge $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreLabelTreeMerge $request)
    {
        DB::transaction(function () use ($request) {
            $newIds = [];
            foreach ($request->create as $label) {
                // Parent labels are always created before their children so their IDs
                // were already added to $newIds.
                if (array_key_exists('parent_index', $label)) {
                    $label['parent_id'] = $newIds[$label['parent_index']];
                    unset($label['parent_index']);
                }

                $l = new Label;
                $l->name = $label['name'];
                $l->color = $label['color'];
                if (array_key_exists('parent_id', $label)) {
                    $l->parent_id = $label['parent_id'];
                }
                $l->label_tree_id = $request->tree->id;
                $l->uuid = Uuid::uuid4();
                $l->save();
                $newIds[] = $l->id;
            }

            $request->tree->labels()
                ->whereIn('id', $request->remove)
                ->delete();
        });


        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('saved', true);
        }
    }
}
