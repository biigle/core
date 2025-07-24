<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\Project;
use Biigle\Traits\CompileFilters;
use Illuminate\Http\Request;

class FilterImageAnnotationsByLabelController extends Controller
{
    use CompileFilters;

    /**
     * Show all image annotations of the project that have a specific label attached.
     *
     * @api {get} projects/:pid/image-annotations/filter/label/:lid Get image annotations with a label
     * @apiGroup Projects
     * @apiName ShowProjectsImageAnnotationsFilterLabels
     * @apiParam {Number} pid The project ID
     * @apiParam {Number} lid The Label ID
     * @apiParam (Optional arguments) {Number} take Number of image annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited.
     * @apiParam (Optional arguments) {Array} shape_id Array of shape ids to use to filter images
     * @apiParam (Optional arguments) {Array} user_id Array of user ids to use to filter values
     * @apiParam (Optional arguments) {Array} annotation_size Array of annotation size category ids to use to filter values
     * @apiParam (Optional arguments) {Boolean} union Whether the filters should be considered inclusive (OR) or exclusive (AND)
     * @apiPermission projectMember
     * @apiDescription Returns a map of image annotation IDs to their image UUIDs.
     *
     * @param Request $request
     * @param  int  $pid Project ID
     * @param int $lid Label ID
     * @return \Illuminate\Support\Collection
     */
    public function index(Request $request, $pid, $lid)
    {
        $project = Project::findOrFail($pid);
        $this->authorize('access', $project);

        $this->validate($request, [
            'take' => 'integer',
            'shape_id' => 'array',
            'shape_id.*' => 'integer',
            'user_id' => 'array',
            'user_id.*' => 'integer',
            'annotation_size' => 'array',
            'annotation_size.*' => 'integer',
            'union' => 'boolean',
        ]);

        $take = $request->input('take');
        $filters = [
            'shape_id' => $request->input('shape_id'),
            'user_id' => $request->input('user_id'),
            'annotation_size' => $request->input('annotation_size'),
        ];
        $filters = array_filter($filters);
        $union = $request->input('union', false);

        return ImageAnnotation::join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->whereIn('images.volume_id', function ($query) use ($pid) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $pid);
            })
            ->when(!is_null($take), fn ($query) => $query->take($take))
            ->where('image_annotation_labels.label_id', $lid)
            ->when(!empty($filters), function ($query) use ($union, $filters) {
                // Handle annotation size filtering separately as it requires calculation
                if (isset($filters['annotation_size'])) {
                    $sizeValues = $filters['annotation_size'];
                    
                    if ($union) {
                        $query->where(function ($q) use ($sizeValues) {
                            foreach ($sizeValues as $value) {
                                if ($value < 0) {
                                    $q->orWhereRaw($this->getAnnotationSizeQuery(abs($value), true));
                                } else {
                                    $q->orWhereRaw($this->getAnnotationSizeQuery($value, false));
                                }
                            }
                        });
                    } else {
                        foreach ($sizeValues as $value) {
                            if ($value < 0) {
                                $query->whereRaw($this->getAnnotationSizeQuery(abs($value), true));
                            } else {
                                $query->whereRaw($this->getAnnotationSizeQuery($value, false));
                            }
                        }
                    }
                    
                    // Remove annotation_size from filters array to avoid double processing
                    unset($filters['annotation_size']);
                }
                
                // Process remaining filters normally
                if (!empty($filters)) {
                    $this->compileFilterConditions($query, $union, $filters);
                }
            })
            ->select('images.uuid', 'image_annotations.id')
            ->distinct()
            ->orderBy('image_annotations.id', 'desc')
            ->pluck('images.uuid', 'image_annotations.id');
    }

    /**
     * Get the SQL query for filtering annotations by size category.
     *
     * @param int $categoryId The size category ID
     * @param bool $negate Whether to negate the condition
     * @return string The SQL condition
     */
    private function getAnnotationSizeQuery(int $categoryId, bool $negate = false): string
    {
        $operator = $negate ? '!=' : '=';
        
        return "CASE 
            WHEN image_annotations.shape_id = " . \Biigle\Shape::circleId() . " THEN
                CASE 
                    WHEN POW((image_annotations.points->>2)::float, 2) * PI() = 0 THEN 0
                    WHEN POW((image_annotations.points->>2)::float, 2) * PI() < 100 THEN 1
                    WHEN POW((image_annotations.points->>2)::float, 2) * PI() < 1000 THEN 2
                    WHEN POW((image_annotations.points->>2)::float, 2) * PI() < 10000 THEN 3
                    WHEN POW((image_annotations.points->>2)::float, 2) * PI() < 100000 THEN 4
                    ELSE 5
                END
            WHEN image_annotations.shape_id = " . \Biigle\Shape::rectangleId() . " THEN
                CASE 
                    WHEN SQRT(POW((image_annotations.points->>0)::float - (image_annotations.points->>2)::float, 2) + POW((image_annotations.points->>1)::float - (image_annotations.points->>3)::float, 2)) * SQRT(POW((image_annotations.points->>2)::float - (image_annotations.points->>4)::float, 2) + POW((image_annotations.points->>3)::float - (image_annotations.points->>5)::float, 2)) = 0 THEN 0
                    WHEN SQRT(POW((image_annotations.points->>0)::float - (image_annotations.points->>2)::float, 2) + POW((image_annotations.points->>1)::float - (image_annotations.points->>3)::float, 2)) * SQRT(POW((image_annotations.points->>2)::float - (image_annotations.points->>4)::float, 2) + POW((image_annotations.points->>3)::float - (image_annotations.points->>5)::float, 2)) < 100 THEN 1
                    WHEN SQRT(POW((image_annotations.points->>0)::float - (image_annotations.points->>2)::float, 2) + POW((image_annotations.points->>1)::float - (image_annotations.points->>3)::float, 2)) * SQRT(POW((image_annotations.points->>2)::float - (image_annotations.points->>4)::float, 2) + POW((image_annotations.points->>3)::float - (image_annotations.points->>5)::float, 2)) < 1000 THEN 2
                    WHEN SQRT(POW((image_annotations.points->>0)::float - (image_annotations.points->>2)::float, 2) + POW((image_annotations.points->>1)::float - (image_annotations.points->>3)::float, 2)) * SQRT(POW((image_annotations.points->>2)::float - (image_annotations.points->>4)::float, 2) + POW((image_annotations.points->>3)::float - (image_annotations.points->>5)::float, 2)) < 10000 THEN 3
                    WHEN SQRT(POW((image_annotations.points->>0)::float - (image_annotations.points->>2)::float, 2) + POW((image_annotations.points->>1)::float - (image_annotations.points->>3)::float, 2)) * SQRT(POW((image_annotations.points->>2)::float - (image_annotations.points->>4)::float, 2) + POW((image_annotations.points->>3)::float - (image_annotations.points->>5)::float, 2)) < 100000 THEN 4
                    ELSE 5
                END
            WHEN image_annotations.shape_id IN (" . \Biigle\Shape::pointId() . ", " . \Biigle\Shape::lineId() . ") THEN 0
            ELSE 
                CASE 
                    WHEN json_array_length(image_annotations.points) < 6 THEN 0
                    ELSE 2
                END
        END {$operator} {$categoryId}";
    }
}
