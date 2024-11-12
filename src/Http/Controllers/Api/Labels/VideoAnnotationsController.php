<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Labels;

use Generator;
use Biigle\Label;
use Biigle\Volume;
use Biigle\MediaType;
use Biigle\VideoAnnotation;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;

class VideoAnnotationsController extends Controller
{
    /**
     * Show video annotations of a label.
     *
     * @api {get} labels/:id/video-annotations Get video annotations with a label
     * @apiGroup Labels
     * @apiName ShowLabelVideoAnnotations
     * @apiParam {Number} id The Label ID
     * @apiPermission user
     * @apiDescription Returns a map of video annotation IDs to their video UUIDs. Only annotations that are visible to the current user are returned.
     *
     * @param Request $request
     * @param int $id Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $id)
    {
        $label = Label::findOrFail($id);
        $this->validate($request, ['take' => 'integer']);

        return VideoAnnotation::visibleFor($request->user())
            ->join('videos', 'videos.id', '=', 'video_annotations.video_id')
            ->withLabel($label)
            ->when($request->filled('take'), function ($query) use ($request) {
                return $query->take($request->input('take'));
            })
            ->select('videos.uuid', 'video_annotations.id')
            ->distinct()
            ->orderBy('video_annotations.id', 'desc')
            ->pluck('videos.uuid', 'video_annotations.id');
    }

    /**
     * Get all annotation labels with their video uuid used in a volume
     * 
     * @api {get} 
     * @apiGroup Labels
     * @apiName test
     * @apiParam {Number} id The Volume ID
     * @apiPermission user
     * @apiDescription Returns a stream containing annotation labels and the corresponding uuid
     *
     * @param Request $request
     * @param int $id Label ID
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function getVolumeAnnotationLabels($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        $videos = $volume->videos()->has('annotations');
        $annotationData = function () use ($videos): Generator {
            foreach ($videos->lazy() as $vid) {
                foreach ($vid->annotations()->with('labels.label')->lazy() as $annotation) {
                    yield [
                        'uuid' => $vid->uuid,
                        'labels' => $annotation->labels,
                    ];
                }
            }
        };

        return new StreamedJsonResponse($annotationData());
    }
}
