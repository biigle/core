<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Label;
use Biigle\Project;
use Biigle\Annotation;
use Illuminate\Http\Request;
use Illuminate\Auth\Access\AuthorizationException;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Modules\Largo\Http\Controllers\Api\LargoController as Controller;

class LargoController extends Controller
{
    /**
     * Save changes of an Largo session for a project.
     *
     * @api {post} projects/:id/largo Save Largo session
     * @apiGroup Largo
     * @apiName ProjectsStoreLargo
     * @apiParam {Number} id The project ID.
     * @apiPermission projectEditor
     * @apiDescription see the 'Save Largo session' endpoint for a volume for more information
     *
     * @apiParam (Optional arguments) {Object} dismissed Map from a label ID to a list of IDs of annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed Map from a label ID to a list of IDs of annotations to which this label should be attached.
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

        $this->applySave($request->user(), $dismissed, $changed, $force);

        // Remove annotations that now have no more labels attached.
        $toDelete = Annotation::join('images', 'images.id', '=', 'annotations.image_id')
            ->whereIn('annotations.id', $affectedAnnotations)
            ->whereDoesntHave('labels')
            ->select('annotations.id', 'images.volume_id')
            ->get();

        Annotation::whereIn('id', $toDelete->pluck('id'))->delete();

        // The annotation model observer does not fire for this query so we dispatch
        // the remove patch job manually here.
        $toDelete->groupBy('volume_id')->each(function ($annotations, $volumeId) {
            RemoveAnnotationPatches::dispatch($volumeId, $annotations->pluck('id')->toArray());
        });
    }
}
