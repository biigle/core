<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\AnnotationGuidelineLabel;
use Biigle\Http\Requests\DestroyProjectLabelTree;
use Biigle\Http\Requests\StoreProjectLabelTree;
use Biigle\LabelTree;
use Biigle\Project;
use DB;

class ProjectLabelTreeController extends Controller
{
    /**
     * Display all label trees used by the specified project.
     *
     * @api {get} projects/:id/label-trees Get all used label trees
     * @apiGroup Projects
     * @apiName IndexProjectLabelTrees
     * @apiPermission projectMember
     * @apiDescription This endpoint lists all label trees that are used by the project.
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
     * @return \Illuminate\Database\Eloquent\Collection
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
     * Display label trees that match the given name and can be used by the specified project.
     *
     * @api {get} projects/:id/label-trees/available/:name Get matching label trees
     * @apiGroup Projects
     * @apiName IndexProjectAvailableLabelTrees
     * @apiPermission projectMember
     * @apiDescription This endpoint lists all matching label trees that _can be_ used by the project (do not confuse this with the "used label trees" endpoint).
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Global",
     *       "description": "The global label tree",
     *       "version": null
     *    },
     *    {
     *       "id": 2,
     *       "name": "Special",
     *       "description": "The project specific label tree",
     *       "version": null
     *    }
     * ]
     *
     * @param int $id Project ID
     * @param string $name Labeltree name
     * @return array<int, LabelTree>
     */
    public function available($id, $name)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $public = LabelTree::publicTrees()
            ->select('id', 'name', 'description', 'version_id')
            ->where('name', 'ilike', "%{$name}%")
            ->with('version')
            ->get();
        $authorized = $project->authorizedLabelTrees()
            ->select('id', 'name', 'description', 'version_id')
            ->where('name', 'ilike', "%{$name}%")
            ->with('version')
            ->get();

        return $public->merge($authorized)->unique('id')->all();
    }

    /**
     * Adds a label tree to the specified project.
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
     * @param StoreProjectLabelTree $request
     * @return \Illuminate\Http\RedirectResponse|void
     */
    public function store(StoreProjectLabelTree $request)
    {
        $request->project->labelTrees()->syncWithoutDetaching([$request->input('id')]);

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('saved', true);
        }
    }

    /**
     * Removes a label tree from the specified project.
     *
     * @api {delete} projects/:id/label-trees/:id2 Remove a label tree
     * @apiGroup Projects
     * @apiName DetachProjectLabelTrees
     * @apiPermission projectAdmin
     * @apiDescription Returns 409 if the label tree has annotation guideline labels in this project. Use the `force` argument to detach the label tree and delete the guideline labels.
     *
     * @apiParam {Number} id The project ID.
     * @apiParam {Number} id2 The label tree ID.
     *
     * @apiParam (Optional attributes) {Boolean} force Delete annotation guideline labels belonging to the label tree before detaching.
     *
     * @param DestroyProjectLabelTree $request
     * @return \Illuminate\Http\RedirectResponse|void
     */
    public function destroy(DestroyProjectLabelTree $request)
    {
        $count = DB::transaction(function () use ($request) {
            $treeId = $request->route('id2');
            AnnotationGuidelineLabel::join('annotation_guidelines', 'annotation_guidelines.id', '=', 'annotation_guideline_label.annotation_guideline_id')
                ->where('annotation_guidelines.project_id', $request->project->id)
                ->whereIn('label_id', fn ($q) => $q->select('id')->from('labels')->where('label_tree_id', $treeId))
                ->each(fn ($gl) => $gl->delete());

            return $request->project->labelTrees()->detach($treeId);
        });

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('deleted', $count > 0);
        }
    }
}
