<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use DB;
use Biigle\Role;
use Biigle\Label;
use Biigle\Volume;
use Biigle\Annotation;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Auth\Access\AuthorizationException;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Modules\Largo\Http\Controllers\Api\LargoController as Controller;

class LargoController extends Controller
{
    /**
     * Save changes of an Largo session for a volume.
     *
     * @api {post} volumes/:id/largo Save Largo session
     * @apiGroup Largo
     * @apiName VolumesStoreLargo
     * @apiParam {Number} id The volume ID.
     * @apiPermission projectEditor
     * @apiDescription From the `dismissed` map only annotation labels that were attached by the requesting user will be detached. If the map contains annotation labels that were not attached by the user, the information will be ignored. From the `changed` map, new annotation labels will be created. If, after detaching `dismissed` annotation labels and attaching `changed` annotation labels, there is an annotation whithout any label, the annotation will be deleted. All affected annotations must belong to the same volume. If the user is not allowed to edit in this volume, the whole request will be denied.
     *
     * @apiParam (Optional arguments) {Object} dismissed Map from a label ID to a list of IDs of annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed Map from annotation ID to a label ID that should be attached to the annotation.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * {
     *    dismissed: {
     *       12: [1, 2, 3, 4],
     *       24: [15, 2, 10]
     *    },
     *    changed: {
     *       1: 5,
     *       3: 5,
     *       10: 13
     *    }
     * }
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function save(Request $request, Guard $auth, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('edit-in', $volume);
        $this->validateLargoInput($request);

        $dismissed = $request->input('dismissed', []);
        $changed = $request->input('changed', []);

        if (count($dismissed) === 0 && count($changed) === 0) {
            return;
        }

        $affectedAnnotations = $this->getAffectedAnnotations($dismissed, $changed);

        if (!$this->anotationsBelongToVolumes($affectedAnnotations, [$id])) {
            abort(400, 'All annotations must belong to the specified volume.');
        }

        $user = $auth->user();
        $availableLabelTreeIds = $this->getAvailableLabelTrees($user, $volume);
        $requiredLabelTreeIds = $this->getRequiredLabelTrees($changed);

        if ($requiredLabelTreeIds->diff($availableLabelTreeIds)->count() > 0) {
            throw new AuthorizationException('You may only attach labels that belong to one of the label trees available for the specified volume.');
        }

        $this->applySave($user, $dismissed, $changed);

        // Remove annotations that now have no more labels attached.
        $toDelete = Annotation::whereIn('id', $affectedAnnotations)
            ->whereDoesntHave('labels')
            ->pluck('id')
            ->toArray();

        Annotation::whereIn('id', $toDelete)->delete();
        // The annotation model observer does not fire for this query so we dispatch
        // the remove patch job manually here.
        $this->dispatch(new RemoveAnnotationPatches($id, $toDelete));
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
        if ($user->isAdmin) {
            // Global admins have no restrictions.
            $projects = $volume->projects()->pluck('id');
        } else {
            // All projects that the user and the volume have in common
            // and where the user is editor or admin.
            $projects = $user->projects()
                ->whereIn('id', function ($query) use ($volume) {
                    $query->select('project_volume.project_id')
                        ->from('project_volume')
                        ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                        ->where('project_volume.volume_id', $volume->id)
                        ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id]);
                })
                ->pluck('id');
        }

        return DB::table('label_tree_project')
            ->whereIn('project_id', $projects)
            ->distinct()
            ->pluck('label_tree_id');
    }
}
