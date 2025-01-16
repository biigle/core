<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Illuminate\Http\Request;

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
        $this->validate($request, ['take' => 'integer', 'shape_id' => 'array', 'user_id' => 'array', 'union' => 'integer']);
        $take = $request->input('take');
        $shape_ids = $request->input('shape_id');
        $user_ids = $request->input('user_id');
        $union = $request->input('union', 0);

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
            ->when(!is_null($shape_ids), function ($query) use ($shape_ids, $union) {
                $this->compileFilterConditions($query, $union, $shape_ids, 'shape_id');
            }
            )
            ->when(!is_null($user_ids), function ($query) use ($user_ids, $union) {
                $this->compileFilterConditions($query, $union, $user_ids, 'user_id');
            })
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
    private function compileFilterConditions(&$query, $union, $filters, $filterName)
    {
        if ($union){
            $included = [];
            $excluded = [];
            foreach ($filters as &$filterValue){
                if ($filterValue < 0) {
                    array_push($excluded, intval(abs($filterValue)));
                } else {
                    array_push($included, intval($filterValue));
                }}
                $query->where(function($query) use ($included, $excluded, $filterName) {
                    if (count($included)){
                        $query->whereIn($filterName, $included, 'or');
                    }
                    if (count($excluded)){
                        $query->whereNotIn($filterName, $excluded, 'or');
                    }
                });
        } else {
            foreach ($filters as &$filterValue){
                if ($filterValue < 0) {
                    $query->whereNot($filterName, intval(abs($filterValue)));
                } else {
                    $query->where($filterName, intval($filterValue));
                }
            }
        }
    }
}
