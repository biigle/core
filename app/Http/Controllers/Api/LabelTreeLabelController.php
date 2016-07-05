<?php

namespace Dias\Http\Controllers\Api;

use Illuminate\Validation\ValidationException;
use Dias\LabelTree;
use Dias\Label;
use Dias\LabelSource;

class LabelTreeLabelController extends Controller
{
    /**
     * Add labels to a label tree
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
     * @return \Illuminate\Http\Response
     */
    public function store($id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('create-label', $tree);

        $this->validate($this->request, Label::$createRules);

        // parent must be of the same tree
        if ($this->request->has('parent_id')) {
            $exists = Label::where('id', $this->request->input('parent_id'))
                ->where('label_tree_id', $id)
                ->exists();
            if (!$exists) {
                return $this->buildFailedValidationResponse($this->request, [
                    'parent_id' => ['The parent label must belong to the same label tree than the new label.']
                ]);
            }
        }

        if ($this->request->has('label_source_id')) {
            $source = LabelSource::findOrFail($this->request->input('label_source_id'));
            try {
                $labels = $source->getAdapter()->create($id, $this->request);
            } catch (ValidationException $e) {
                return $this->buildFailedValidationResponse($this->request, $e->response);
            }
        } else {
            $label = new Label;
            $label->name = $this->request->input('name');
            $label->color = $this->request->input('color');
            $label->parent_id = $this->request->input('parent_id');
            $label->label_tree_id = (int) $id;
            $label->save();

            $labels = [$label];
        }

        if (static::isAutomatedRequest($this->request)) {
            return $labels;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('saved', true);
        }
        return redirect()->back()
            ->with('saved', true);
    }
}
