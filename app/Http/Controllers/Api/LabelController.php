<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use Biigle\Label;
use Illuminate\Http\Request;
use Illuminate\Auth\Access\AuthorizationException;
use Biigle\Http\Controllers\Api\Traits\ValidatesLabelParents;

class LabelController extends Controller
{
    use ValidatesLabelParents;

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
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $label = Label::findOrFail($id);
        $this->authorize('update', $label);
        $this->validate($request, Label::$updateRules);

        if ($request->has('parent_id')) {
            try {
                $this->validateLabelParent($label->label_tree_id, $request->input('parent_id'));
            } catch (Exception $e) {
                return $this->buildFailedValidationResponse($request, [
                    'parent_id' => [$e->getMessage()],
                ]);
            }
        }

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
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        $label = Label::findOrFail($id);
        $this->authorize('destroy', $label);

        if (!$label->canBeDeleted()) {
            throw new AuthorizationException('A label can only be deleted if it has no children and is not in use.');
        }

        $label->delete();
    }
}
