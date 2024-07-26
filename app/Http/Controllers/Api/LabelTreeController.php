<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\DestroyLabelTree;
use Biigle\Http\Requests\StoreLabelTree;
use Biigle\Http\Requests\UpdateLabelTree;
use Biigle\LabelTree;
use Biigle\Role;
use Biigle\Visibility;
use DB;
use Illuminate\Http\Request;
use Ramsey\Uuid\Uuid;

class LabelTreeController extends Controller
{
    /**
     * Shows all label trees the user has access to.
     *
     * @api {get} label-trees Get accessible label trees
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
     * @param Request $request
     * @return \Illuminate\Database\Eloquent\Collection<int, LabelTree>
     */
    public function index(Request $request)
    {
        return LabelTree::accessibleBy($request->user())
            ->orderByDesc('id')
            ->select('id', 'name', 'description', 'created_at', 'updated_at', 'version_id')
            ->with('version')
            ->get();
    }

    /**
     * Shows a label tree.
     *
     * @api {get} label-trees/:id Show a label tree
     * @apiGroup Label Trees
     * @apiName ShowLabelTrees
     * @apiPermission labelTreeMemberIfPrivate
     *
     * @apiParam {Number} id The label tree ID
     *
     * @apiDescription The `role_id` of the members is their role in this label tree and not their global role.
     *
     * @apiSuccessExample {json} Success response:
     *
     * {
     *    "id": 1,
     *    "name": "My Label Tree",
     *    "description": "My private label tree.",
     *    "visibility_id": 2,
     *    "created_at": "2015-02-10 09:45:30",
     *    "updated_at": "2015-02-10 09:45:30",
     *    "labels": [
     *       {
     *          "id": 1,
     *          "name": "Trash",
     *          "color": "bada55",
     *          "parent_id": null,
     *          "label_tree_id": 1,
     *          "source_id": null,
     *          "label_source_id": null
     *       }
     *    ],
     *    "members": [
     *       {
     *          "id": 1,
     *          "firstname": "Cesar",
     *          "lastname": "Beier",
     *          "role_id": 2
     *       }
     *    ],
     *    "version": {
     *       "id": 1,
     *       "name": "v1.0",
     *       "description": null
     *    },
     *    "versions": []
     * }
     *
     *
     * @return LabelTree
     */
    public function show($id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('access', $tree);

        $tree->load(['labels', 'members', 'version', 'versions']);

        return $tree;
    }

    /**
     * Creates a new label tree.
     *
     * @api {post} label-trees Create a new label tree
     * @apiGroup Label Trees
     * @apiName StoreLabelTrees
     * @apiPermission editor
     * @apiDescription The user creating a new label tree will automatically become label tree admin.
     *
     * @apiParam (Required attributes) {String} name Name of the new label tree.
     * @apiParam (Required attributes) {Number} visibility_id ID of the visibility of the new label tree (public or private).
     *
     * @apiParam (Optional attributes) {String} description Description of the new label tree.
     * @apiParam (Optional attributes) {Number} project_id Target project for the new label tree. If this attribute is set and the user is an admin of the project, the new label tree will be immediately attached to this project.
     * @apiParam (Optional attributes) {Number} upstream_label_tree_id ID of a label tree to fork. All labels of the upstream label tree will be copied to the new label tree.
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
     * @param StoreLabelTree $request
     * @return LabelTree|\Illuminate\Http\RedirectResponse
     */
    public function store(StoreLabelTree $request)
    {
        $tree = DB::transaction(function () use ($request) {
            $tree = new LabelTree;
            $tree->name = $request->input('name');
            $tree->visibility_id = $request->input('visibility_id');
            $tree->description = $request->input('description');
            $tree->uuid = Uuid::uuid4();
            $tree->save();
            $tree->addMember($request->user(), Role::admin());

            if (isset($request->project)) {
                $tree->projects()->attach($request->project);
                $tree->authorizedProjects()->attach($request->project);
            }

            if (isset($request->upstreamLabelTree)) {
                $tree->replicateLabelsOf($request->upstreamLabelTree);
                $tree->load('labels');
            }

            return $tree;
        });

        if ($this->isAutomatedRequest()) {
            return $tree;
        }

        return $this->fuzzyRedirect('label-trees', $tree->id)
            ->with('newTree', $tree)
            ->with('message', 'Label tree created.')
            ->with('messageType', 'success');
    }

    /**
     * Updates the attributes of the specified label tree.
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
     * @param UpdateLabelTree $request
     * @return \Illuminate\Http\RedirectResponse|null
     */
    public function update(UpdateLabelTree $request)
    {
        $tree = $request->tree;
        $tree->name = $request->input('name', $tree->name);
        $tree->description = $request->input('description', $tree->description);
        $tree->visibility_id = $request->input('visibility_id', $tree->visibility_id);

        DB::transaction(function () use ($tree) {
            if ($tree->isDirty('visibility_id')) {
                // Propoagate the visibility change to all versions of the label tree.
                LabelTree::join('label_tree_versions', 'label_trees.version_id', '=', 'label_tree_versions.id')
                    ->where('label_tree_versions.label_tree_id', $tree->id)
                    ->update(['visibility_id' => $tree->visibility_id]);

                if ($tree->visibility_id === Visibility::privateId()) {
                    $tree->detachUnauthorizedProjects();
                }
            }

            if ($tree->isDirty('name')) {
                // Propoagate the name change to all versions of the label tree.
                LabelTree::join('label_tree_versions', 'label_trees.version_id', '=', 'label_tree_versions.id')
                    ->where('label_tree_versions.label_tree_id', $tree->id)
                    ->update(['name' => $tree->name]);
            }

            $tree->save();
        });


        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('saved', true)
                ->with('message', 'Label tree updated.')
                ->with('messageType', 'success');
        }
    }

    /**
     * Removes the specified label tree.
     *
     * @api {delete} label-trees/:id Delete a label tree
     * @apiGroup Label Trees
     * @apiName DestroyLabelTrees
     * @apiPermission labelTreeAdmin
     * @apiDescription A label tree cannot be deleted if it or any of its versions contain labels that are still used.
     *
     * @apiParam {Number} id The label tree ID.
     *
     * @param DestroyLabelTree $request
     * @return \Illuminate\Http\RedirectResponse|null
     */
    public function destroy(DestroyLabelTree $request)
    {
        $request->tree->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('deleted', true)
                ->with('message', 'Label tree deleted.')
                ->with('messageType', 'success');
        }
    }
}
