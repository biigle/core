<?php

namespace Dias\Modules\Ate\Http\Controllers\Api;

use Dias\Http\Controllers\Api\Controller;
use DB;
use Dias\Annotation;
use Dias\Label;
use Dias\Transect;
use Dias\AnnotationLabel;
use Dias\Role;
use Symfony\Component\HttpFoundation\File\Exception\FileNotFoundException;
use Illuminate\Auth\Access\AuthorizationException;
use Dias\Modules\Ate\Jobs\RemoveAnnotationPatches;

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
     * @apiDescription Responds with an image file
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function showPatch($id)
    {
        $annotation = Annotation::with('image')->findOrFail($id);
        $this->authorize('access', $annotation);

        $file = config('ate.patch_storage').'/'.
            $annotation->image->transect_id.'/'.
            $annotation->id.'.'.config('ate.patch_format');

        try {
            return response()->download($file);
        } catch (FileNotFoundException $e) {
            abort(404, $e->getMessage());
        }
    }


    /**
     * Save changes of an ATE session for a transect
     *
     * @api {post} transects/:id/ate Save ATE session
     * @apiGroup ATE
     * @apiName TransectsStoreATE
     * @apiParam {Number} id The transect ID.
     * @apiPermission projectEditor
     * @apiDescription From the `dismissed` map only annotation labels that were attached by the requesting user will be detached. If the map contains annotation labels that were not attached by the user, the information will be ignored. From the `changed` map, new annotation labels will be created. If, after detaching `dismissed` annotation labels and attaching `changed` annotation labels, there is an annotation whithout any label, the annotation will be deleted. All affected annotations must belong to the same transect. If the user is not allowed to edit in this transect, the whole request will be denied.
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
     * @param int $id Transect ID
     * @return \Illuminate\Http\Response
     */
    public function save($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('edit-in', $transect);

        $dismissed = $this->request->input('dismissed', []);
        $changed = $this->request->input('changed', []);

        $affectedAnnotations = array_reduce($dismissed, function ($carry, $item) {
            return array_merge($carry, $item);
        }, []);

        $affectedAnnotations = array_merge($affectedAnnotations, array_keys($changed));
        $affectedAnnotations = array_unique($affectedAnnotations);

        // check if all annotations belong to this transect
        $invalid = Annotation::join('images', 'annotations.image_id', '=', 'images.id')
            ->whereIn('annotations.id', $affectedAnnotations)
            ->where('images.transect_id', '!=', $id)
            ->exists();

        if ($invalid) {
            abort(400, 'All annotations must belong to the specified transect.');
        }

        // check if all labels specified in 'changed' may be used for the annotations
        // (i.e. are from a label tree which is available for the transect)
        $requiredLabelTreeIds = Label::whereIn('id', array_unique(array_values($changed)))
            ->groupBy('label_tree_id')
            ->pluck('label_tree_id');

        if ($this->user->isAdmin) {
            // admins have no restrictions
            $projects = $transect->projects()->pluck('id');
        } else {
            // all projects that the user and the transect have in common
            // and where the user is editor or admin
            $projects = $this->user->projects()
                ->whereIn('id', function ($query) use ($transect) {
                    $query->select('project_transect.project_id')
                        ->from('project_transect')
                        ->join('project_user', 'project_transect.project_id', '=', 'project_user.project_id')
                        ->where('project_transect.transect_id', $transect->id)
                        ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id]);
                })
                ->pluck('id');
        }

        $availableLabelTreeIds = DB::table('label_tree_project')
            ->whereIn('project_id', $projects)
            ->pluck('label_tree_id');

        if ($requiredLabelTreeIds->diff($availableLabelTreeIds)->count() > 0) {
            throw new AuthorizationException('You may only attach labels that belong to one of the label trees available for the specified transect.');
        }

        // remove dismissed annotation labels
        foreach ($dismissed as $labelId => $annotationIds) {
            AnnotationLabel::whereIn('annotation_id', $annotationIds)
                ->where('label_id', $labelId)
                ->where('user_id', $this->user->id)
                ->delete();
        }

        // create new 'changed' annotation labels
        $newAnnotationLabels = [];
        $now = new \Carbon\Carbon;

        foreach ($changed as $annotationId => $labelId) {
            $newAnnotationLabels[] = [
                'annotation_id' => $annotationId,
                'label_id' => $labelId,
                'user_id' => $this->user->id,
                'confidence' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        AnnotationLabel::insert($newAnnotationLabels);

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
}
