<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Label;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Access\AuthorizationException;

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
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $label = Label::findOrFail($id);
        $this->authorize('update', $label);

        $this->validate($request, Label::$updateRules);

        // parent must be of the same tree
        if ($request->filled('parent_id')) {
            $exists = Label::where('id', $request->input('parent_id'))
                ->where('label_tree_id', $label->label_tree_id)
                ->exists();
            if (!$exists) {
                throw ValidationException::withMessages([
                    'parent_id' => ['The parent label must belong to the same label tree than the updated label.'],
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

        if (static::isAutomatedRequest($request)) {
            return;
        }

        if ($request->filled('_redirect')) {
            return redirect($request->input('_redirect'))
                ->with('deleted', true);
        }

        return redirect()->back()
            ->with('deleted', true);
    }
}
