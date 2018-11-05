<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\LabelTree;
use Biigle\Visibility;
use Illuminate\Http\Request;
use Biigle\Http\Requests\StoreLabelTreeAuthorizedProject;

class LabelTreeAuthorizedProjectController extends Controller
{
    /**
     * Authorize a project to use a private label tree.
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
     * @param StoreLabelTreeAuthorizedProject $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreLabelTreeAuthorizedProject $request)
    {
        $id = $request->input('id');

        if (!$request->tree->authorizedProjects()->where('id', $id)->exists()) {
            $request->tree->authorizedProjects()->attach($id);
        }

        if (static::isAutomatedRequest($request)) {
            return;
        }

        if ($request->has('_redirect')) {
            return redirect($request->input('_redirect'))
                ->with('saved', true);
        }

        return redirect()->back()
            ->with('saved', true);
    }

    /**
     * Remove authorization of a project to use a private label tree.
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
     * @param Request $request
     * @param  int  $lid
     * @param  int  $pid
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $lid, $pid)
    {
        $tree = LabelTree::findOrFail($lid);
        $this->authorize('update', $tree);

        $tree->authorizedProjects()->detach($pid);

        if ((int) $tree->visibility_id === Visibility::privateId()) {
            $tree->projects()->detach($pid);
        }

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
