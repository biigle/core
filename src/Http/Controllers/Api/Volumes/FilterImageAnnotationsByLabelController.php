<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Http\Query;

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
     * @apiParam (Optional arguments) {Array} shape_id Array of shape ids to use to filter images
     * @apiParam (Optional arguments) {Array} user_id Array of user ids to use to filter values
     * @apiParam (Optional arguments) {Boolean} union Whether the filters should be considered exclusive (AND) or inclusive (OR)
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
        $this->validate($request, [
            'take' => 'integer',
            'shape_id' => 'array',
            'shape_id.*' => 'integer',
            'user_id' => 'array',
            'user_id.*' => 'integer',
            'union' => 'boolean',
        ]);
        $take = $request->input('take');
        $shape_ids = $request->input('shape_id');
        $user_ids = $request->input('user_id');
        $union = $request->input('union', false);

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
            ->when(!is_null($shape_ids), function ($query) use ($shape_ids, $union) {
                $this->compileFilterConditions($query, $union, $shape_ids, 'shape_id');
            }
            )
            ->when(!is_null($user_ids), function ($query) use ($user_ids, $union) {
                $this->compileFilterConditions($query, $union, $user_ids, 'user_id');
            })
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
    *
    * Compile filter(s) that were requested and add them to the query
    * @param Query &$query To add filters to
    * @param bool $union Whether filters are considered inclusive (OR) or exclusive (AND)
    * @param array $filters Array of filters to add to the query
    * @param string $filterName Name of the filter column to apply the  filter to
    */
    private function compileFilterConditions(Query &$query, bool $union, array $filters, string $filterName): void
    {
        if ($union){
            $included = [];
            $excluded = [];
            foreach ($filters as $filterValue){
                if ($filterValue < 0) {
                    array_push($excluded, abs($filterValue));
                } else {
                    array_push($included, $filterValue);
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
                    $query->whereNot($filterName, abs($filterValue));
                } else {
                    $query->where($filterName, $filterValue);
                }
            }
        }
    }
}
