<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Generator;
use Biigle\Volume;
use Biigle\ImageAnnotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Biigle\Http\Controllers\Api\Controller;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;

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
     * Get all image annotations with uuids for a given volume
     * 
     * @api {get} 
     * @apiGroup Volumes
     * @apiName test
     * @apiParam {Number} id The Volume ID
     * @apiPermission user
     * @apiDescription Returns a stream containing the image uuids and ids of annotations, labels and label trees
     * 
     * @apiSuccessExample {json} Success response:
     * [{
	 * 	"uuid":"9198ea9c-ef97-4af7-8018-407d16eafb65",
	 * 	"annotation_id":41,
	 *	"label_id":14,
	 *	"label_tree_id":123
	 * }]
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
