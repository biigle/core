<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreLabel;
use Biigle\Label;
use Biigle\LabelSource;
use Ramsey\Uuid\Uuid;

class LabelTreeLabelController extends Controller
{
    /**
     * Add labels to a label tree.
     *
     * @api {post} label-trees/:id/labels Create new labels
     * @apiGroup Label Trees
     * @apiName StoreLabelTreesLabels
     * @apiPermission labelTreeEditor
     * @apiDescription If a label source is used to create a new label (or labels), this
     * endpoint may accept/require additional arguments. Also label sources may create
     * multiple new labels at once.
     *
     * @apiParam {Number} id The label tree ID
     *
     * @apiParam (Required arguments) {String} name Name of the new label
     * @apiParam (Required arguments) {String} color Color of the new label as hexadecimal string (like `bada55`). May have an optional `#` prefix.
     *
     * @apiParam (Optional arguments) {Number} parent_id ID of the parent label for ordering in a tree-like structure.
     * @apiParam (Optional arguments) {Number} label_source_id ID of the external label source (e.g. a database)
     * @apiParam (Optional arguments) {Number} source_id ID of the label in the external label source. Required is a label source is specified.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 4,
     *       "name": "Sea Cucumber",
     *       "parent_id": null,
     *       "label_tree_id": 1,
     *       "color": "bada55"
     *    }
     * ]
     *
     * @param StoreLabel $request
     * @return array|\Illuminate\Http\RedirectResponse
     */
    public function store(StoreLabel $request)
    {
        if ($request->filled('label_source_id')) {
            $source = LabelSource::findOrFail($request->input('label_source_id'));
            $labels = $source->getAdapter()->create($request->tree->id, $request);
        } else {
            $label = new Label;
            $label->name = $request->input('name');
            $label->color = $request->input('color');
            $label->parent_id = $request->input('parent_id');
            $label->label_tree_id = $request->tree->id;
            $label->uuid = Uuid::uuid4();
            $label->save();

            $labels = [$label];
        }

        if ($this->isAutomatedRequest()) {
            return $labels;
        }

        return $this->fuzzyRedirect()->with('saved', true);
    }
}
