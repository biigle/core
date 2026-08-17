<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\FilterVolumeAnnotationsRequest;
use Biigle\Traits\CompileFilters;
use Biigle\VideoAnnotation;
use Illuminate\Http\Request;

class FilterVideoAnnotationsByLabelController extends Controller
{
    use CompileFilters;

    /**
     * Show all video annotations of the volume that have a specific label attached.
     *
     * @api {get} volumes/:vid/video-annotations/filter/label/:lid Get video annotations with a label
     * @apiGroup Volumes
     * @apiName ShowVolumesVideoAnnotationsFilterLabels
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The Label ID
     * @apiParam (Optional arguments) {Number} take Number of video annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited.
     * @apiParam (Optional arguments) {Array} shape_id Array of shape ids to use to filter videos
     * @apiParam (Optional arguments) {Array} user_id Array of user ids to use to filter values
     * @apiParam (Optional arguments) {Array} filename Array of filename patterns to use to filter annotations
     * @apiParam (Optional arguments) {Array} created_at Array containing objects mapping field names (annotation, annotation_label) to date operators (gt, gte, eq, lt, lte) and date Y-m-d values. Example: [{"annotation": {"gt": "2026-01-01"}}] means an annotation created after 2026-01-01
     * @apiParam (Optional arguments) {Array} updated_at Array containing objects mapping field names (annotation, annotation_label) to date operators (gt, gte, eq, lt, lte) and date Y-m-d values. Example: [{"annotation": {"gt": "2026-01-01"}}] means an annotation updated after 2026-01-01
     * @apiParam (Optional arguments) {Boolean} union Whether the filters should be considered inclusive (OR) or exclusive (AND)
     * @apiPermission projectMember
     * @apiDescription Returns a map of video annotation IDs to their video UUIDs. If there is an active annotation session, annotations hidden by the session are not returned. Only available for video volumes.
     *
     * @param FilterVolumeAnnotationsRequest $request
     * @param int $lid Label ID
     * @return \Illuminate\Support\Collection
     */
    public function index(FilterVolumeAnnotationsRequest $request, $lid)
    {
        $vid = $request->volume->id;

        $take = $request->input('take');
        $filters = [
            'shape_id' => $request->input('shape_id'),
            'user_id' => $request->input('user_id'),
            'filename' => $request->input('filename'),
            'created_at' => $request->input('created_at'),
            'updated_at' => $request->input('updated_at'),
        ];

        $filters = array_filter($filters);
        $union = $request->input('union', false);

        $session = $request->volume->getActiveAnnotationSession($request->user());

        if ($session) {
            $query = VideoAnnotation::allowedBySession($session, $request->user());
        } else {
            $query = VideoAnnotation::query();
        }

        return $query->join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->where('videos.volume_id', $vid)
            ->where('video_annotation_labels.label_id', $lid)
            ->when(!empty($filters), fn ($query) => $this->compileFilterConditions('video', $query, $union, $filters))
            ->when($session, function ($query) use ($session, $request) {
                if ($session->hide_other_users_annotations) {
                    $query->where('video_annotation_labels.user_id', $request->user()->id);
                }
            })
            ->when(!is_null($take), fn ($query) => $query->take($take))
            ->select('videos.uuid', 'video_annotations.id')
            ->distinct()
            ->orderBy('video_annotations.id', 'desc')
            ->pluck('videos.uuid', 'video_annotations.id');
    }
}
