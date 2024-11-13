<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Generator;
use Biigle\Volume;
use Biigle\VideoAnnotation;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;

class FilterVideoAnnotationsByLabelController extends Controller
{
    /**
     * Show all video annotations of the volume that have a specific label attached.
     *
     * @api {get} volumes/:vid/video-annotations/filter/label/:lid Get video annotations with a label
     * @apiGroup Volumes
     * @apiName ShowVolumesVideoAnnotationsFilterLabels
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The Label ID
     * @apiParam (Optional arguments) {Number} take Number of video annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited.
     * @apiPermission projectMember
     * @apiDescription Returns a map of video annotation IDs to their video UUIDs. If there is an active annotation session, annotations hidden by the session are not returned. Only available for video volumes.
     *
     * @param Request $request
     * @param  int  $vid Volume ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $vid, $lid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');

        $session = $volume->getActiveAnnotationSession($request->user());

        if ($session) {
            $query = VideoAnnotation::allowedBySession($session, $request->user());
        } else {
            $query = VideoAnnotation::query();
        }

        return $query->join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->where('videos.volume_id', $vid)
            ->where('video_annotation_labels.label_id', $lid)
            ->when($session, function ($query) use ($session, $request) {
                if ($session->hide_other_users_annotations) {
                    $query->where('video_annotation_labels.user_id', $request->user()->id);
                }
            })
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->take($take);
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
     * @apiGroup Volumes
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
     * @param int $id Volume ID
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function getVolumeAnnotationLabels($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        $videos = $volume->videos()->has('annotations');
        $annotationData = function () use ($videos): Generator {
            foreach ($videos->lazy() as $vid) {
                foreach ($vid->annotations()->has('labels')->with('labels.label')->lazy() as $annotation) {
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
