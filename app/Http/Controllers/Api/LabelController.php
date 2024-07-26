<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\DestroyLabel;
use Biigle\Http\Requests\UpdateLabel;

class LabelController extends Controller
{
    /**
     * Update a label.
     *
     * @api {put} labels/:id Update a label
     * @apiGroup Labels
     * @apiName UpdateLabels
     * @apiPermission labelTreeEditor
     *
     * @apiParam {Number} id The label ID
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the label.
     * @apiParam (Attributes that can be updated) {String} color Color of the label as hexadecimal string (like `bada55`). May have an optional `#` prefix.
     * @apiParam (Attributes that can be updated) {Number} parent_id ID of the parent label for ordering in a tree-like structure.
     *
     * @param UpdateLabel $request
     */
    public function update(UpdateLabel $request)
    {
        $label = $request->label;
        $label->name = $request->input('name', $label->name);
        $label->color = $request->input('color', $label->color);
        $label->parent_id = $request->input('parent_id', $label->parent_id);

        $label->save();
    }

    /**
     * Delete a label.
     *
     * @api {delete} labels/:id Delete a label
     * @apiGroup Labels
     * @apiName DestroyLabels
     * @apiPermission labelTreeEditor
     * @apiDescription A label may only be deleted if it doesn't have child labels and is
     * not in use anywhere (e.g. attached to an annotation).
     *
     * @apiParam {Number} id The label ID
     *
     * @param DestroyLabel $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(DestroyLabel $request)
    {
        $request->label->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('deleted', true);
        }
    }
}
