<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Labels;

use Generator;
use Biigle\Label;
use Biigle\Shape;
use Biigle\Volume;
use Biigle\MediaType;
use Biigle\ImageAnnotation;
use Illuminate\Http\Request;
use Biigle\ImageAnnotationLabel;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Biigle\Http\Controllers\Api\Controller;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;

class ImageAnnotationsController extends Controller
{
    /**
     * Show image annotations of a label.
     *
     * @api {get} labels/:id/image-annotations Get image annotations with a label
     * @apiGroup Labels
     * @apiName ShowLabelImageAnnotations
     * @apiParam {Number} id The Label ID
     * @apiPermission user
     * @apiDescription Returns a map of image annotation IDs to their image UUIDs. Only annotations that are visible to the current user are returned.
     *
     * @param Request $request
     * @param int $id Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $id)
    {
        $label = Label::findOrFail($id);
        $this->validate($request, ['take' => 'integer']);

        return ImageAnnotation::visibleFor($request->user())
            ->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->withLabel($label)
            ->when($request->filled('take'), function ($query) use ($request) {
                return $query->take($request->input('take'));
            })
            ->select('images.uuid', 'image_annotations.id')
            ->distinct()
            ->orderBy('image_annotations.id', 'desc')
            ->pluck('images.uuid', 'image_annotations.id');
    }

    /**
     * Get all image annotations with uuids for a given volume
     * 
     * @api {get} 
     * @apiGroup Labels
     * @apiName test
     * @apiParam {Number} id The Volume ID
     * @apiPermission user
     * @apiDescription Returns a stream containing the video uuids and their annotation labels of a volume
     * 
     * @apiSuccessExample {json} Success response:
     * [{
	 *  "uuid":"8e2517f4-7636-42a1-9b8d-9c58092931e0",
	 *      "labels":[{
     *              "id":520,
     *              "annotation_id":517,
     *              "label_id":14,"user_id":1,
     *              "confidence":1,
     *              "label":{
     *                  "id":14,
     *                  "name":"a",
     *                  "color":"49f2c5",
     *                  "parent_id":null,
     *                  "label_tree_id":486,
     *                  "source_id":null,
     *                  "label_source_id":null
     *              }
     *      }]
	 * }]
     *
     * @param Request $request
     * @param int $id Label ID
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function getVolumeAnnotationLabels($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        $images = $volume->images()->has('annotations');
        $annotationData = function () use ($images): Generator {
            foreach ($images->lazy() as $img) {
                foreach ($img->annotations()->with('labels.label')->lazy() as $annotation) {
                    yield [
                        'uuid' => $img->uuid,
                        'labels' => $annotation->labels,
                    ];
                }
            }
        };

        return new StreamedJsonResponse($annotationData());
    }
}