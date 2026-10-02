<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Services\AnnotationGuidelineService;
use Biigle\Volume;
use Illuminate\Http\Request;

class AnnotationGuidelineController extends Controller
{
    /**
     * List the annotation guidelines that apply to a volume.
     *
     * @api {get} volumes/:id/annotation-guidelines Get annotation guidelines
     * @apiGroup Volumes
     * @apiName IndexVolumeAnnotationGuidelines
     * @apiPermission projectMember
     * @apiDescription Returns the annotation guidelines of all projects that the user and the volume have in common. `can_annotate` indicates whether the user can create annotations in the project of the guideline. The ID of a guideline with `enforced: true` and `can_annotate: true` can be sent as `guideline_id` when annotations are created or modified and when labels are attached files. If `must_use_guideline` is true, a `guideline_id` is required.
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *   "must_use_guideline": false,
     *   "guidelines": [
     *     {
     *       "id": 1,
     *       "project_id": 2,
     *       "description": "guideline description",
     *       "enforced": true,
     *       "only_shapes": [1, 3],
     *       "can_annotate": true,
     *       "labels": [{
     *         "id": 4,
     *         "name": "some label",
     *         "pivot": {
     *           "uuid": "...",
     *           "annotation_guideline_id": 1,
     *           "label_id": 4,
     *           "shape_id": 1,
     *           "description": "description of a label",
     *           "reference_image_url": null
     *         }
     *       }]
     *     }
     *   ]
     * }
     *
     * @param Request $request
     * @param AnnotationGuidelineService $service
     * @param int $id
     *
     * @return array
     */
    public function index(Request $request, AnnotationGuidelineService $service, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $user = $request->user();

        $guidelines = $service->getGuidelines($user, $volume->id)
            ->load('labels');

        return [
            'must_use_guideline' => $guidelines->isNotEmpty() && $service->mustUseGuideline($user, $volume->id),
            'guidelines' => $guidelines,
        ];
    }
}
