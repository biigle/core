<?php

namespace Dias\Http\Controllers\Api;

use Dias\LabelTree;
use Dias\Role;
use Dias\Visibility;
use Illuminate\Auth\Access\AuthorizationException;

class LabelTreeController extends Controller
{
    /**
     * Shows all public label trees
     *
     * @api {get} label-trees Get all public label trees
     * @apiGroup Label Trees
     * @apiName IndexLabelTrees
     * @apiPermission user
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Global",
     *       "description": "The global label category tree.",
     *       "created_at": "2015-02-10 09:45:30",
     *       "updated_at": "2015-02-10 09:45:30"
     *    }
     * ]
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return LabelTree::publicTrees()->select(
            'id',
            'name',
            'description',
            'created_at',
            'updated_at'
        )->get();
    }

    /**
     * Updates the attributes of the specified label tree
     *
     * @api {put} label-trees/:id Update a label tree
     * @apiGroup Label Trees
     * @apiName UpdateLabelTrees
     * @apiPermission labelTreeAdmin
     * @apiDescription If the visibility is set to private, the label tree will be removed from all projects that are not authorized to use them.
     *
     * @apiParam {Number} id The label tree ID
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the label tree.
     * @apiParam (Attributes that can be updated) {String} description Description of the label tree.
     * @apiParam (Attributes that can be updated) {Number} visibility_id ID of the new visibility of the label tree (public or private).
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update($id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('update', $tree);

        $this->validate($this->request, LabelTree::$updateRules);

        $tree->name = $this->request->input('name', $tree->name);
        $tree->description = $this->request->input('description', $tree->description);

        if ($this->request->has('visibility_id') && $this->request->input('visibility_id') === Visibility::$private->id) {
            $tree->detachUnauthorizedProjects();
        }

        $tree->visibility_id = $this->request->input('visibility_id', $tree->visibility_id);
        $tree->save();

        if (static::isAutomatedRequest($this->request)) {
            return;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('saved', true)
                ->with('message', 'Label tree updated.')
                ->with('messageType', 'success');
        }
        return redirect()->back()
            ->with('saved', true)
            ->with('message', 'Label tree updated.')
            ->with('messageType', 'success');
    }

    /**
     * Creates a new label tree
     *
     * @api {post} label-trees Create a new label tree
     * @apiGroup Label Trees
     * @apiName StoreLabelTrees
     * @apiPermission user
     * @apiDescription The user creating a new label tree will automatically become label tree admin.
     *
     * @apiParam (Required attributes) {String} name Name of the new label tree.
     * @apiParam (Required attributes) {Number} visibility_id ID of the visibility of the new label tree (public or private).
     *
     * @apiParam (Optional attributes) {String} description Description of the new label tree.
     *
     * @apiSuccessExample {json} Success response:
     *
     * {
     *    "id": 1,
     *    "name": "Global",
     *    "description": "The global label category tree.",
     *    "vilibility_id": 1,
     *    "created_at": "2015-02-10 09:45:30",
     *    "updated_at": "2015-02-10 09:45:30"
     * }
     *
     * @return \Illuminate\Http\Response
     */
    public function store()
    {
        $this->validate($this->request, LabelTree::$createRules);

        $tree = new LabelTree;
        $tree->name = $this->request->input('name');
        $tree->visibility_id = $this->request->input('visibility_id');
        $tree->description = $this->request->input('description');
        $tree->save();

        $tree->addMember($this->user, Role::$admin);

        if (static::isAutomatedRequest($this->request)) {
            return $tree;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('newTree', $tree)
                ->with('message', 'Label tree created.')
                ->with('messageType', 'success');
        }
        return redirect()->back()
            ->with('newTree', $tree)
            ->with('message', 'Label tree created.')
            ->with('messageType', 'success');
    }

    /**
     * Removes the specified label tree
     *
     * @api {delete} label-trees/:id Delete a label tree
     * @apiGroup Label Trees
     * @apiName DestroyLabelTrees
     * @apiPermission labelTreeAdmin
     * @apiDescription A label tree cannot be deleted if it contains labels that are still used somewhere.
     *
     * @apiParam {Number} id The label tree ID.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('destroy', $tree);

        if (!$tree->canBeDeleted()) {
            throw new AuthorizationException('A label tree can\'t be deleted if any of its labels are still in use.');
        }

        $tree->delete();

        if (static::isAutomatedRequest($this->request)) {
            return;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('deleted', true)
                ->with('message', 'Label tree deleted.')
                ->with('messageType', 'success');
        }
        return redirect()->back()
            ->with('deleted', true)
            ->with('message', 'Label tree deleted.')
                ->with('messageType', 'success');
    }
}
