<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Volume;
use Biigle\VideoAnnotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Biigle\Http\Controllers\Api\Controller;

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
     * Get all video annotations with uuids and annotation count for a given volume
     * 
     * @api {get} 
     * @apiGroup Volumes
     * @apiName test
     * @apiParam {Number} id The Volume ID
     * @apiPermission user
     * @apiDescription Returns a collection of project video labels, video UUIDs, and annotation label counts
     * 
     * @apiSuccessExample {json} Success response:
     * [{"id":1,
     * "name":"a",
     * "color":"f2617c",
     * "parent_id":null,
     * "label_tree_id":1,
     * "source_id":null,
     * "label_source_id":null,
     * "uuid":"6d2e6061-9ed1-41df-92f0-4862d0d4b12e",
     * "count":10}]
     *
     * @param int $id Volume ID
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getVolumeAnnotationLabels($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return DB::table('labels')
        ->join('video_annotation_labels', 'labels.id', '=', 'video_annotation_labels.label_id')
        ->join('video_annotations', 'video_annotation_labels.annotation_id', '=', 'video_annotations.id')
        ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
        ->where('videos.volume_id','=',$id)
        ->select('labels.*', DB::raw('COUNT(labels.id) as count'))
        ->groupBy('labels.id')
        ->get();
    }
}
