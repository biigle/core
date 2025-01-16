<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Volume;
use Biigle\ImageAnnotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Biigle\Http\Controllers\Api\Controller;

class FilterImageAnnotationsByLabelController extends Controller
{
    /**
     * Show all image annotations of the volume that have a specific label attached.
     *
     * @api {get} volumes/:vid/image-annotations/filter/label/:lid Get image annotations with a label
     * @apiGroup Volumes
     * @apiName ShowVolumesImageAnnotationsFilterLabels
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The Label ID
     * @apiParam (Optional arguments) {Number} take Number of image annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited.
     * @apiPermission projectMember
     * @apiDescription Returns a map of image annotation IDs to their image UUIDs. If there is an active annotation session, annotations hidden by the session are not returned. Only available for image volumes.
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
            $query = ImageAnnotation::allowedBySession($session, $request->user());
        } else {
            $query = ImageAnnotation::query();
        }

        return $query->join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->where('images.volume_id', $vid)
            ->where('image_annotation_labels.label_id', $lid)
            ->when($session, function ($query) use ($session, $request) {
                if ($session->hide_other_users_annotations) {
                    $query->where('image_annotation_labels.user_id', $request->user()->id);
                }
            })
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->take($take);
            })
            ->select('images.uuid', 'image_annotations.id')
            ->distinct()
            ->orderBy('image_annotations.id', 'desc')
            ->pluck('images.uuid', 'image_annotations.id');
    }

        /**
     * Get all image labels and annotation count for a given volume
     * 
     * @api {get} 
     * @apiGroup Volumes
     * @apiName test
     * @apiParam {Number} id The Volume ID
     * @apiPermission user
     * @apiDescription Returns a collection of project image labels, and annotation label counts
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
        ->join('image_annotation_labels', 'labels.id', '=', 'image_annotation_labels.label_id')
        ->join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
        ->join('images', 'image_annotations.image_id', '=', 'images.id')
        ->where('images.volume_id','=',$id)
        ->select('labels.*', DB::raw('COUNT(labels.id) as count'))
        ->groupBy('labels.id')
        ->get();
    }
}
