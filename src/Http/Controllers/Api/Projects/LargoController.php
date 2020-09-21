<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\ImageAnnotation;
use Biigle\Label;
use Biigle\MediaType;
use Biigle\Modules\Largo\Http\Controllers\Api\LargoController as Controller;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Project;
use DB;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

class LargoController extends Controller
{
    /**
     * Save changes of an Largo session for a project.
     *
     * @api {post} projects/:id/largo Save a project session
     * @apiGroup Largo
     * @apiName ProjectsStoreLargo
     * @apiParam {Number} id The project ID.
     * @apiPermission projectEditor
     * @apiDescription See the 'Save a volume session' endpoint for more information
     *
     * @apiParam (Optional arguments) {Object} dismissed Map from a label ID to a list of IDs of image annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed Map from a label ID to a list of IDs of image annotations to which this label should be attached.
     * @apiParam (Optional arguments) {Object} force If set to `true`, project experts and admins can replace annotation labels attached by other users.
     *
     * @param Request $request
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function save(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('edit-in', $project);
        $this->validateLargoInput($request);

        $force = $request->input('force', false);

        if ($force) {
            $this->authorize('force-edit-in', $project);
        }

        $volumeIds = $project->imageVolumes()->pluck('id');

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

        // Roll back changes if any errors occur.
        DB::transaction(function () use ($request, $dismissed, $changed, $force, $affectedAnnotations) {
            $this->applySave($request->user(), $dismissed, $changed, $force);

            // Remove annotations that now have no more labels attached.
            $toDeleteQuery = ImageAnnotation::whereIn('image_annotations.id', $affectedAnnotations)
                ->whereDoesntHave('labels');

            $toDeleteArgs = $toDeleteQuery->join('images', 'images.id', '=', 'image_annotations.image_id')
                ->pluck('images.uuid', 'image_annotations.id')
                ->toArray();

            if (!empty($toDeleteArgs)) {
                $toDeleteQuery->delete();
                // The annotation model observer does not fire for this query so we
                // dispatch the remove patch job manually here.
                RemoveAnnotationPatches::dispatch($toDeleteArgs);
            }
        });
    }
}
