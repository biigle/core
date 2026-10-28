<?php

namespace Biigle\Http\Controllers\Api\Labels;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Label;
use Biigle\VideoAnnotation;
use Illuminate\Http\Request;

class VideoAnnotationsController extends Controller
{
    /**
     * Show video annotations of a label.
     *
     * @api {get} labels/:id/video-annotations Get video annotations with a label
     * @apiGroup Labels
     * @apiName ShowLabelVideoAnnotations
     * @apiParam {Number} id The Label ID
     * @apiParam (Optional arguments) {Number} take Maximum number of annotations to return.
     * @apiPermission user
     * @apiDescription Returns a map of video annotation IDs to their video UUIDs. Only annotations that are visible to the current user are returned.
     *
     * @param Request $request
     * @param int $id Label ID
     * @return \Illuminate\Support\Collection
     */
    public function index(Request $request, $id)
    {
        $label = Label::findOrFail($id);
        $this->validate($request, ['take' => 'integer|min:1']);
        $user = $request->user();

        $visibleVolumeIds = fn ($query) => $query->select('project_volume.volume_id')
            ->from('project_volume')
            ->join('project_user', 'project_user.project_id', '=', 'project_volume.project_id')
            ->where('project_user.user_id', $user->id);

        return VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
            ->when(!$user->can('sudo'), fn ($query) => $query->whereIn('videos.volume_id', $visibleVolumeIds))
            // Use a subquery instead of a join because an annotation can have the same
            // label multiple times. The join would require a DISTINCT which prevents the
            // query from stopping early if "take" is given.
            ->whereIn('video_annotations.id', fn ($query) => $query->select('annotation_id')
                ->from('video_annotation_labels')
                ->where('label_id', $label->id))
            ->when($request->filled('take'), fn ($query) => $query->take($request->input('take')))
            ->select('videos.uuid', 'video_annotations.id')
            ->orderBy('video_annotations.id', 'desc')
            ->pluck('videos.uuid', 'video_annotations.id');
    }
}
