<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\ImageAnnotation;
use Biigle\Label;
use Biigle\Modules\Largo\Http\Controllers\Api\LargoController as Controller;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Project;
use Biigle\Role;
use Biigle\Volume;
use DB;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

class LargoController extends Controller
{
    /**
     * Save changes of an Largo session for a volume.
     *
     * @api {post} volumes/:id/largo Save a volume session
     * @apiGroup Largo
     * @apiName VolumesStoreLargo
     * @apiParam {Number} id The volume ID.
     * @apiPermission projectEditor
     * @apiDescription From the `dismissed` map only image annotation labels that were attached by the requesting user will be detached (unless `force` is set to `true`). If the map contains image annotation labels that were not attached by the user, the information will be ignored. From the `changed` map, new image annotation labels will be created. If, after detaching `dismissed` image annotation labels and attaching `changed` image annotation labels, there is an image annotation whithout any label, the annotation will be deleted. All affected image annotations must belong to the same volume. If the user is not allowed to edit in this volume, the whole request will be denied. Only available for image volumes.
     *
     * @apiParam (Optional arguments) {Object} dismissed Map from a label ID to a list of IDs of annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed Map from a label ID to a list of IDs of annotations to which this label should be attached.
     * @apiParam (Optional arguments) {Object} force If set to `true`, project experts and admins can replace annotation labels attached by other users.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * {
     *    dismissed: {
     *       12: [1, 2, 3, 4],
     *       24: [15, 2, 10]
     *    },
     *    changed: {
     *       5: [1, 3],
     *       13: [10],
     *    }
     * }
     *
     * @param Request $request
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function save(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('edit-in', $volume);
        if ($volume->isVideoVolume()) {
            abort(400, 'Only available for image volumes.');
        }

        $this->validateLargoInput($request);

        $force = $request->input('force', false);

        if ($force) {
            $this->authorize('force-edit-in', $volume);
        }

        $dismissed = $request->input('dismissed', []);
        $changed = $request->input('changed', []);

        if (count($dismissed) === 0 && count($changed) === 0) {
            return;
        }

        $affectedAnnotations = $this->getAffectedAnnotations($dismissed, $changed);

        if (!$this->anotationsBelongToVolumes($affectedAnnotations, [$id])) {
            abort(400, 'All annotations must belong to the specified volume.');
        }

        $user = $request->user();
        $availableLabelTreeIds = $this->getAvailableLabelTrees($user, $volume);
        $requiredLabelTreeIds = $this->getRequiredLabelTrees($changed);

        if ($requiredLabelTreeIds->diff($availableLabelTreeIds)->count() > 0) {
            throw new AuthorizationException('You may only attach labels that belong to one of the label trees available for the specified volume.');
        }

        $this->applySave($user, $dismissed, $changed, $force);

        // Remove annotations that now have no more labels attached.
        $toDeleteQuery = ImageAnnotation::whereIn('image_annotations.id', $affectedAnnotations)
            ->whereDoesntHave('labels');

        $toDeleteArgs = $toDeleteQuery->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->pluck('images.uuid', 'image_annotations.id')
            ->toArray();

        if (!empty($toDeleteArgs)) {
            $toDeleteQuery->delete();
            // The annotation model observer does not fire for this query so we dispatch
            // the remove patch job manually here.
            RemoveAnnotationPatches::dispatch($toDeleteArgs);
        }
    }

    /**
     * Get label trees of projects that the user and the volume have in common.
     *
     * @param User $user
     * @param Volume $volume
     *
     * @return Collection
     */
    protected function getAvailableLabelTrees($user, $volume)
    {
        if ($user->can('sudo')) {
            // Global admins have no restrictions.
            $projects = $volume->projects()->pluck('id');
        } else {
            // All projects that the user and the volume have in common
            // and where the user is editor, expert or admin.
            $projects = Project::inCommon($user, $volume->id, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->pluck('id');
        }

        return DB::table('label_tree_project')
            ->whereIn('project_id', $projects)
            ->distinct()
            ->pluck('label_tree_id');
    }
}
