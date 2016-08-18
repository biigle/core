<?php

namespace Dias\Http\Controllers\Api;

use Dias\Label;
use Illuminate\Http\Request;
use Illuminate\Auth\Access\AuthorizationException;

class LabelController extends Controller
{
    /**
     * Delete a label
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

        if ($request->has('_redirect')) {
            return redirect($request->input('_redirect'))
                ->with('deleted', true);
        }
        return redirect()->back()
            ->with('deleted', true);
    }
}
