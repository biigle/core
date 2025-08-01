<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Traits\CompileFilters;
use Biigle\VideoAnnotation;
use Biigle\Volume;
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
     * @apiParam (Optional arguments) {Array} shape_id Array of shape ids to use to filter images
     * @apiParam (Optional arguments) {Array} user_id Array of user ids to use to filter values
     * @apiParam (Optional arguments) {Array} confidence Array of confidence category ids to use to filter values
     * @apiParam (Optional arguments) {Boolean} union Whether the filters should be considered inclusive (OR) or exclusive (AND)
     * @apiPermission projectMember
     * @apiDescription Returns a map of video annotation IDs to their video UUIDs. If there is an active annotation session, annotations hidden by the session are not returned. Only available for video volumes.
     *
     * @param Request $request
     * @param  int  $vid Volume ID
     * @param int $lid Label ID
     * @return \Illuminate\Support\Collection
     */
    public function index(Request $request, $vid, $lid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);

                $this->validate($request, [
            'session_id' => 'filled|exists:annotation_sessions,id',
            'shape_id' => 'filled|array',
            'shape_id.*' => 'exists:shapes,id',
            'user_id' => 'filled|array', 
            'user_id.*' => 'exists:users,id',
            'confidence' => 'filled|array',
            'confidence.*' => 'in:0,1,2,3,4',
        ]);

        $take = $request->input('take');
        $filters = [
            'shape_id' => $request->input('shape_id'),
            'user_id' => $request->input('user_id'),
            'confidence' => $request->input('confidence'),
        ];
        $filters = array_filter($filters);
        $union = $request->input('union', false);

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
            ->when(!empty($filters), function ($query) use ($union, $filters) {
                // Handle confidence filtering separately as it requires range conditions
                if (isset($filters['confidence'])) {
                    $confidenceValues = $filters['confidence'];
                    
                    if ($union) {
                        $query->where(function ($q) use ($confidenceValues) {
                            foreach ($confidenceValues as $value) {
                                if ($value < 0) {
                                    $q->orWhereRaw($this->getConfidenceQuery(abs($value)));
                                } else {
                                    $q->orWhereRaw($this->getConfidenceQuery($value));
                                }
                            }
                        });
                    } else {
                        foreach ($confidenceValues as $value) {
                            if ($value < 0) {
                                $query->whereRaw($this->getConfidenceQuery(abs($value)));
                            } else {
                                $query->whereRaw($this->getConfidenceQuery($value));
                            }
                        }
                    }
                    
                    // Remove confidence from filters array to avoid double processing
                    unset($filters['confidence']);
                }
                
                // Process remaining filters normally
                if (!empty($filters)) {
                    $this->compileFilterConditions($query, $union, $filters);
                }
            })
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

    /**
     * Get the SQL query for filtering video annotations by confidence category.
     *
     * @param int $categoryId The confidence category ID
     * @param bool $negate Whether to negate the condition
     * @return string The SQL condition
     */
    private function getConfidenceQuery($confidence)
    {
        switch ($confidence) {
            case 0: // Very low: 0 - 0.25
                return 'video_annotation_labels.confidence BETWEEN 0 AND 0.25';
            case 1: // Low: 0.25 - 0.5
                return 'video_annotation_labels.confidence BETWEEN 0.25 AND 0.5';
            case 2: // Medium: 0.5 - 0.75
                return 'video_annotation_labels.confidence BETWEEN 0.5 AND 0.75';
            case 3: // High: 0.75 - 0.9
                return 'video_annotation_labels.confidence BETWEEN 0.75 AND 0.9';
            case 4: // Very High: 0.9 - 1.0
                return 'video_annotation_labels.confidence BETWEEN 0.9 AND 1.0';
            default:
                return '1=1'; // No filter
        }
    }
}
