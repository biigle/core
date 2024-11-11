<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Labels;

use Generator;
use Biigle\Label;
use Biigle\Shape;
use Biigle\Volume;
use Biigle\ImageAnnotation;
use Illuminate\Http\Request;
use Biigle\ImageAnnotationLabel;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Biigle\Http\Controllers\Api\Controller;

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
     * Get all annotation labels with their image uuid used in a volume
     * 
     * @api {get} 
     * @apiGroup Labels
     * @apiName test
     * @apiParam {Number} id The Volume ID
     * @apiPermission user
     * @apiDescription Returns an array containing the annotation count and an array with arr
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
                        'annotationLabels' => $annotation->labels,
                    ];
                }
            }
        };

        return response()->streamJson($annotationData());
    }
}