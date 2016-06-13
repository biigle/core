<?php

namespace Dias\Http\Controllers\Api;

use Dias\LabelTree;
use Dias\Label;

class LabelTreeLabelController extends Controller
{
    /**
     * Add a label to a label tree
     *
     * @api {post} label-trees/:id/labels Create a new label
     * @apiGroup Label Trees
     * @apiName StoreLabelTreesLabels
     * @apiPermission labelTreeEditor
     *
     * @apiParam {Number} id The label tree ID
     *
     * @apiParam (Required arguments) {String} name Name of the new label
     * @apiParam (Required arguments) {String} color Color of the new label as hexadecimal string (like `bada55`). May have an optional `#` prefix.
     *
     * @apiParam (Optional arguments) {Number} parent_id ID of the parent label for ordering in a tree-like structure.
     * @apiParam (Optional arguments) {Number} aphia_id The [WoRMS](http://www.marinespecies.org/) AphiaID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 4,
     *    "name": "Sea Cucumber",
     *    "parent_id": null,
     *    "aphia_id": 1234,
     *    "label_tree_id": 1,
     *    "color": "bada55"
     * }
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

        $label = new Label;
        $label->name = $this->request->input('name');
        $label->color = $this->request->input('color');
        $label->parent_id = $this->request->input('parent_id');
        $label->aphia_id = $this->request->input('aphia_id');
        $label->label_tree_id = $id;
        $label->save();

        if (static::isAutomatedRequest($this->request)) {
            return $label;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('saved', true);
        }
        return redirect()->back()
            ->with('saved', true);
    }
}
