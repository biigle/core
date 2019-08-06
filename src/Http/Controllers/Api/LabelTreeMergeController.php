<?php

namespace Biigle\Modules\LabelTrees\Http\Controllers\Api;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\LabelTrees\Http\Requests\StoreMerge;

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
     * @param StoreMerge $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreMerge $request)
    {
        // if ($request->filled('label_source_id')) {
        //     $source = LabelSource::findOrFail($request->input('label_source_id'));
        //     $labels = $source->getAdapter()->create($request->tree->id, $request);
        // } else {
        //     $label = new Label;
        //     $label->name = $request->input('name');
        //     $label->color = $request->input('color');
        //     $label->parent_id = $request->input('parent_id');
        //     $label->label_tree_id = $request->tree->id;
        //     $label->uuid = Uuid::uuid4();
        //     $label->save();

        //     $labels = [$label];
        // }

        // if ($this->isAutomatedRequest()) {
        //     return $labels;
        // }

        // return $this->fuzzyRedirect()->with('saved', true);
    }
}
