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
     * Get all video annotations with uuids for a given volume
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
	 * 	"uuid":"9198ea9c-ef97-4af7-8018-407d16eafb65",
	 * 	"labels":[{
	 *			"id":41,
	 *			"annotation_id":41,
	 *			"label_id":14,
	 *			"user_id":1,
	 *			"created_at":"2024-11-13T07:17:54.000000Z",
	 *			"updated_at":"2024-11-13T07:17:54.000000Z",
	 *			"label":{
	 *				"id":14,
	 *				"name":"a",
	 *				"color":"49f2c5",
	 *				"parent_id":null,
	 *				"label_tree_id":486,
	 *				"source_id":null,
	 *				"label_source_id":null
	 *				}
	 *      }]
	 * }]
     * 
     *
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
