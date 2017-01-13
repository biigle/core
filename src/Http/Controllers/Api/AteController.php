<?php

namespace Biigle\Modules\Ate\Http\Controllers\Api;

use DB;
use Biigle\Role;
use Biigle\Label;
use Biigle\Project;
use Biigle\Volume;
use Biigle\Annotation;
use Biigle\AnnotationLabel;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Ate\Jobs\RemoveAnnotationPatches;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpFoundation\File\Exception\FileNotFoundException;

class AteController extends Controller
{
    /**
     * Show the patch image of an annotation
     *
     * @api {get} annotations/:id/patch Get an annotation patch
     * @apiGroup Annotations
     * @apiName ShowAnnotationPatch
     * @apiParam {Number} id The annotation ID.
     * @apiPermission projectMember
     * @apiDescription Responds with an image file. If there is an active annotation session, access to annotations hidden by the session is denied.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function showPatch($id)
    {
        $annotation = Annotation::with('image')->findOrFail($id);
        $this->authorize('access', $annotation);

        $file = config('ate.patch_storage').'/'.
            $annotation->image->volume_id.'/'.
            $annotation->id.'.'.config('ate.patch_format');

        try {
            return response()->download($file);
        } catch (FileNotFoundException $e) {
            abort(404, $e->getMessage());
        }
    }


    /**
     * Save changes of an ATE session for a volume
     *
     * @api {post} volumes/:id/ate Save ATE session
     * @apiGroup ATE
     * @apiName VolumesStoreATE
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
    public function saveVolume(Request $request, Guard $auth, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('edit-in', $volume);
        $this->validateAteInput($request);

        $user = $auth->user();

        $dismissed = $request->input('dismissed', []);
        $changed = $request->input('changed', []);

        if (count($dismissed) === 0 && count($changed) === 0) {
            return;
        }

        $affectedAnnotations = $this->getAffectedAnnotations($dismissed, $changed);

        if (!$this->anotationsBelongToVolumes($affectedAnnotations, [$id])) {
            abort(400, 'All annotations must belong to the specified volume.');
        }

        if ($user->isAdmin) {
            // admins have no restrictions
            $projects = $volume->projects()->pluck('id');
        } else {
            // all projects that the user and the volume have in common
            // and where the user is editor or admin
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

        $availableLabelTreeIds = DB::table('label_tree_project')
            ->whereIn('project_id', $projects)
            ->distinct()
            ->pluck('label_tree_id');

        $requiredLabelTreeIds = $this->getRequiredLabelTrees($changed);

        if ($requiredLabelTreeIds->diff($availableLabelTreeIds)->count() > 0) {
            throw new AuthorizationException('You may only attach labels that belong to one of the label trees available for the specified volume.');
        }

        $this->save($user, $dismissed, $changed);

        // remove annotations that now have no more labels attached
        $toDelete = Annotation::whereIn('id', $affectedAnnotations)
            ->whereDoesntHave('labels')
            ->pluck('id')
            ->toArray();

        Annotation::whereIn('id', $toDelete)->delete();
        // the annotation model observer does not fire for this query so we dispatch
        // the remove patch job manually here
        $this->dispatch(new RemoveAnnotationPatches($id, $toDelete));
    }

    /**
     * Save changes of an ATE session for a project
     *
     * @api {post} projects/:id/ate Save ATE session
     * @apiGroup ATE
     * @apiName ProjectsStoreATE
     * @apiParam {Number} id The project ID.
     * @apiPermission projectEditor
     * @apiDescription see the 'Save ATE session' endpoint for a volume for more information
     *
     * @apiParam (Optional arguments) {Object} dismissed Map from a label ID to a list of IDs of annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed Map from annotation ID to a label ID that should be attached to the annotation.
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function saveProject(Request $request, Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('edit-in', $project);
        $this->validateAteInput($request);

        $volumeIds = $project->volumes()->pluck('id');

        $dismissed = $request->input('dismissed', []);
        $changed = $request->input('changed', []);

        if (count($dismissed) === 0 && count($changed) === 0) {
            return;
        }

        $affectedAnnotations = $this->getAffectedAnnotations($dismissed, $changed);

        if (!$this->anotationsBelongToVolumes($affectedAnnotations, $volumeIds)) {
            abort(400, 'All annotations must belong to the volumes of the project.');
        }

        $requiredLabelTreeIds = $this->getRequiredLabelTrees($changed);
        $availableLabelTreeIds = $project->labelTrees()->pluck('id');

        if ($requiredLabelTreeIds->diff($availableLabelTreeIds)->count() > 0) {
            throw new AuthorizationException('You may only attach labels that belong to one of the label trees available for the project.');
        }

        $this->save($auth->user(), $dismissed, $changed);

        // remove annotations that now have no more labels attached
        $toDelete = Annotation::join('images', 'images.id', '=', 'annotations.image_id')
            ->whereIn('annotations.id', $affectedAnnotations)
            ->whereDoesntHave('labels')
            ->select('annotations.id', 'images.volume_id')
            ->get();

        Annotation::whereIn('id', $toDelete->pluck('id'))->delete();

        // the annotation model observer does not fire for this query so we dispatch
        // the remove patch job manually here
        $toDelete->groupBy('volume_id')->each(function ($annotations, $volumeId) {
            $this->dispatch(new RemoveAnnotationPatches(
                $volumeId,
                $annotations->pluck('id')->toArray()
            ));
        });
    }

    /**
     * Validates the input for saving an ATE session
     *
     * @param Request $request
     */
    protected function validateAteInput(Request $request)
    {
        $this->validate($request, [
            'dismissed' => 'array',
            'changed' => 'array',
        ]);
    }

    /**
     * Get a list of unique annotation IDs that are either dismissed or changed
     *
     * @param array $dismissed Array of all dismissed annotation IDs for each label
     * @param array $changed Array of IDs of changed annotations
     *
     * @return array
     */
    protected function getAffectedAnnotations($dismissed, $changed)
    {
        $affectedAnnotations = array_reduce($dismissed, function ($carry, $item) {
            return array_merge($carry, $item);
        }, []);

        return array_unique(array_merge($affectedAnnotations, array_keys($changed)));
    }

    /**
     * Check if all given annotations belong to the given volumes
     *
     * @param array $annotations Annotation IDs
     * @param array $volumes Volume IDs
     *
     * @return bool
     */
    protected function anotationsBelongToVolumes($annotations, $volumes)
    {
        return !Annotation::join('images', 'annotations.image_id', '=', 'images.id')
            ->whereIn('annotations.id', $annotations)
            ->whereNotIn('images.volume_id', $volumes)
            ->exists();
    }

    /**
     * Returns the IDs of all label trees that must be available to apply the changes
     *
     * @param array $changed Array of IDs of changed annotations
     *
     * @return array
     */
    protected function getRequiredLabelTrees($changed)
    {
        return Label::whereIn('id', array_unique(array_values($changed)))
            ->groupBy('label_tree_id')
            ->pluck('label_tree_id');
    }

    /**
     * Apply the changes of an ATE session
     *
     * Removes the dismissed annotation labels and creates the changed annotation labels.
     *
     * @param \Biigle\User $user
     * @param array $dismissed Array of all dismissed annotation IDs for each label
     * @param array $changed Array of IDs of changed annotations
     */
    protected function save($user, $dismissed, $changed)
    {
        $userId = $user->id;
        // remove dismissed annotation labels
        foreach ($dismissed as $labelId => $annotationIds) {
            AnnotationLabel::whereIn('annotation_id', $annotationIds)
                ->where('label_id', $labelId)
                ->where('user_id', $userId)
                ->delete();
        }

        // Skip the rest if no annotations have been changed.
        // The alreadyThereQuery below would FETCH ALL annotation labels if $changed were
        // empty! This almost certainly results in memory exhaustion.
        if (count($changed) === 0) {
            return;
        }

        // create new 'changed' annotation labels
        $newAnnotationLabels = [];
        $now = \Carbon\Carbon::now();

        // Get all labels that are already there exactly like they should be created
        // in the next step.
        $alreadyThereQuery = AnnotationLabel::select('id', 'annotation_id', 'label_id', 'user_id');
        $first = true;

        foreach ($changed as $annotationId => $labelId) {
            $callback = function ($query) use ($annotationId, $labelId, $userId) {
                $query->where('annotation_id', $annotationId)
                    ->where('label_id', $labelId)
                    ->where('user_id', $userId);
            };

            if ($first) {
                $first = false;
                $alreadyThereQuery->where($callback);
            } else {
                $alreadyThereQuery->orWhere($callback);
            }
        }

        $alreadyThere = $alreadyThereQuery->get();

        $existingAnnotations = Annotation::whereIn('id', array_keys($changed))
            ->pluck('id')
            ->toArray();

        foreach ($changed as $annotationId => $labelId) {
            // Skip all new annotation labels if their annotation no longer exists
            // or if they already exist exactly like they should be created.
            $skip = !in_array($annotationId, $existingAnnotations) ||
                !$alreadyThere->where('annotation_id', $annotationId)
                    ->where('label_id', $labelId)
                    ->isEmpty();

            if ($skip) {
                continue;
            }

            $newAnnotationLabels[] = [
                'annotation_id' => $annotationId,
                'label_id' => $labelId,
                'user_id' => $userId,
                'confidence' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        AnnotationLabel::insert($newAnnotationLabels);
    }
}
