<?php
namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\FilterVolumeAnnotationsRequest;
use Biigle\ImageAnnotation;
use Biigle\Traits\CompileFilters;
use Biigle\Volume;

class FilterImageAnnotationsByLabelController extends Controller
{
    use CompileFilters;

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
     * @apiParam (Optional arguments) {Array} filename Array of filename patterns to use to filter annotations
     * @apiParam (Optional arguments) {Array} created_at Array containing objects mapping field names (annotation, annotation_label) to date logical operators (gt, eq, neq, lt) and date Y-m-d values. Example: [{"ref" :"annotation", "operator": "gt", "date": "2026-01-01"}}] means an annotation created after 2026-01-01
     * @apiParam (Optional arguments) {Array} updated_at Array containing objects mapping field names (annotation, annotation_label) to date logical operators (gt, eq, neq, lt) and date Y-m-d values. Example: [{"ref" :"annotation", "operator": "gt", "date": "2026-01-01"}}] means an annotation updated after 2026-01-01
     * @apiParam (Optional arguments) {Boolean} union Whether the filters should be considered inclusive (OR) or exclusive (AND)
     * @apiPermission projectMember
     * @apiDescription Returns a map of image annotation IDs to their image UUIDs. If there is an active annotation session, annotations hidden by the session are not returned. Only available for image volumes.
     *
     * @param FilterVolumeAnnotationsRequest $request
     * @return \Illuminate\Support\Collection
     */
    public function index(FilterVolumeAnnotationsRequest $request)
    {
        $vid = $request->volume->id;
        $lid = $request->labelId;

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
            $query = ImageAnnotation::allowedBySession($session, $request->user());
        } else {
            $query = ImageAnnotation::query();
        }

        return $query->join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->where('images.volume_id', $vid)
            ->where('image_annotation_labels.label_id', $lid)
            ->when(!is_null($take), fn ($query) => $query->take($take))
            ->when(!empty($filters), fn ($query) => $this->compileFilterConditions('image', $query, $union, $filters))
            ->when($session, function ($query) use ($session, $request) {
                if ($session->hide_other_users_annotations) {
                    $query->where('image_annotation_labels.user_id', $request->user()->id);
                }
            })
            ->select('images.uuid', 'image_annotations.id')
            ->distinct()
            ->orderBy('image_annotations.id', 'desc')
            ->pluck('images.uuid', 'image_annotations.id');
    }
}
