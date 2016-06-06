<?php

namespace Dias\Http\Controllers\Api;

use Dias\Label;
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
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $label = Label::findOrFail($id);
        $this->authorize('destroy', $label);

        if (!$label->canBeDeleted()) {
            throw new AuthorizationException('A label can only be deleted if it has no children and is not in use.');
        }

        $label->delete();

        if (static::isAutomatedRequest($this->request)) {
            return;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('deleted', true);
        }
        return redirect()->back()
            ->with('deleted', true);
    }
}
