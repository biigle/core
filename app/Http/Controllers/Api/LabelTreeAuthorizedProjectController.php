<?php

namespace Dias\Http\Controllers\Api;

use Dias\LabelTree;
use Dias\Visibility;

class LabelTreeAuthorizedProjectController extends Controller
{
    /**
     * Authorize a project to use a private label tree
     *
     * @api {post} label-trees/:id/authorized-projects Add authorized project
     * @apiGroup Label Trees
     * @apiName StoreLabelTreesAuthorizedProjects
     * @apiPermission labelTreeAdmin
     *
     * @apiParam {Number} id The label tree ID
     *
     * @apiParam (Required attributes) {Number} id ID of the project to authorize
     *
     * @return \Illuminate\Http\Response
     */
    public function store($id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('update', $tree);

        $this->validate($this->request, LabelTree::$authorizeProjectRules);

        $pid = $this->request->input('id');

        if (!$tree->authorizedProjects()->where('id', $pid)->exists()) {
            $tree->authorizedProjects()->attach($pid);
        }

        if (static::isAutomatedRequest($this->request)) {
            return;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('saved', true);
        }
        return redirect()->back()
            ->with('saved', true);
    }

    /**
     * Remove authorization of a project to use a private label tree
     *
     * @api {delete} label-trees/:lid/authorized-projects/:pid Remove authorized project
     * @apiGroup Label Trees
     * @apiName DestroyLabelTreesAuthorizedProjects
     * @apiPermission labelTreeAdmin
     * @apiDescription If the label tree is private, this action will remove the label tree
     * from the list of label trees used by the project.
     *
     * @apiParam {Number} lid The label tree ID.
     * @apiParam {Number} pid The project ID.
     *
     * @param  int  $lid
     * @param  int  $pid
     * @return \Illuminate\Http\Response
     */
    public function destroy($lid, $pid)
    {
        $tree = LabelTree::findOrFail($lid);
        $this->authorize('update', $tree);

        $tree->authorizedProjects()->detach($pid);

        if ((int) $tree->visibility_id === Visibility::$private->id) {
            $tree->projects()->detach($pid);
        }

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
