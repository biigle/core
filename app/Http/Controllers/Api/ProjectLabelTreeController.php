<?php

namespace Dias\Http\Controllers\Api;

use Dias\Project;
use Dias\LabelTree;
use Dias\Visibility;
use Illuminate\Auth\Access\AuthorizationException;

class ProjectLabelTreeController extends Controller
{
    /**
     * Display all label trees used by the specified project
     *
     * @api {get} projects/:id/label-trees Get all used label trees
     * @apiGroup Projects
     * @apiName IndexProjectLabelTrees
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Global",
     *       "description": "The global label tree",
     *       "labels": [
     *           {
     *               "id": 1,
     *               "name": "Trash",
     *               "color": "bada55",
     *               "parent_id": null,
     *               "aphia_id": null,
     *               "label_tree_id": 1
     *           }
     *       ]
     *    },
     *    {
     *       "id": 2,
     *       "name": "Special",
     *       "description": "The project specific label tree",
     *       "labels": []
     *    }
     * ]
     *
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        return $project->labelTrees()
            ->select('id', 'name', 'description')
            ->with('labels')
            ->get();
    }

    /**
     * Display all label trees that can be used by the specified project
     *
     * @api {get} projects/:id/label-trees/available Get all available label trees
     * @apiGroup Projects
     * @apiName IndexProjectAvailableLabelTrees
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Global",
     *       "description": "The global label tree"
     *    },
     *    {
     *       "id": 2,
     *       "name": "Special",
     *       "description": "The project specific label tree"
     *    }
     * ]
     *
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function available($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $public = LabelTree::public()
            ->select('id', 'name', 'description')->get();
        $authorized = $project->authorizedLabelTrees()
            ->select('id', 'name', 'description')->get();

        return $public->merge($authorized)->unique('id')->all();
    }

    /**
     * Adds a label tree to the specified project
     *
     * @api {post} projects/:id/label-trees Add a label tree
     * @apiGroup Projects
     * @apiName AttachProjectLabelTrees
     * @apiPermission projectAdmin
     * @apiDescription The label tree must be either public or have the project authorized to use it.
     *
     * @apiParam {Number} id The project ID
     *
     * @apiParam (Required attributes) {Number} id The label tree ID
     *
     * @apiParamExample {String} Request example:
     * id: 3
     *
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function store($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);
        $this->validate($this->request, Project::$attachLabelTreeRules);

        $treeId = $this->request->input('id');

        // only do anything if the tree is not already attached
        if (!$project->labelTrees()->where('id', $treeId)->exists()) {
            $tree = LabelTree::findOrFail($this->request->input('id'));

            // only attach if the project is allowed to
            if ((int)$tree->visibility_id === Visibility::$public->id || $tree->authorizedProjects()->where('label_tree_authorized_project.project_id', $id)->exists()) {
                $project->labelTrees()->attach($tree->id);
            } else {
                throw new AuthorizationException('The project is not authorized to use this label tree.');
            }
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
     * Removes a label tree form the specified project.
     *
     * @api {delete} projects/:pid/label-trees/:lid Remove a label tree
     * @apiGroup Projects
     * @apiName DetachProjectLabelTrees
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} pid The project ID.
     * @apiParam {Number} lid The label tree ID.
     *
     * @param  int  $pid
     * @param  int  $lid
     * @return \Illuminate\Http\Response
     */
    public function destroy($pid, $lid)
    {
        $project = Project::findOrFail($pid);
        $this->authorize('update', $project);
        $count = $project->labelTrees()->detach($lid);

        if (static::isAutomatedRequest($this->request)) {
            return;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('deleted', $count > 0);
        }
        return redirect()->back()
            ->with('deleted', $count > 0);
    }
}
