<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Users;

use Illuminate\Http\Request;
use Biigle\ImageAnnotationLabel;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Biigle\Project;

class GetUsersWithAnnotations extends Controller
{
    /**
     * Get all shapes currently available in Biigle
     *
     * @api {get} shapes
     *
     * @param Request $request
     */
    public function index(Request $request, $vid = null, $pid = null)
    {
        if (!is_null($vid)) {
            $volume = Volume::findOrFail($vid);
            $this->authorize('access', $volume);
        } else {
            $project = Project::findOrFail($pid);
            $this->authorize('access', $project);
        }
        $users = ImageAnnotationLabel::query()
            ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->when(!is_null($vid), function ($query) use ($vid) {
                $query->where('images.volume_id', $vid);
            })
            ->when(!is_null($pid), function ($query) use ($pid) {
                $query->where('images.project_id', $pid);
            })
            ->join('users', 'image_annotation_labels.user_id', '=', 'users.id')
            ->distinct('image_annotation_labels.user_id')
            ->select('image_annotation_labels.user_id', 'users.lastname', 'users.firstname')
            ->get();

        return $users;
    }
}
