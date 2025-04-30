<?php

namespace Biigle\Modules\Largo\Http\Requests;

use Biigle\ImageAnnotation;
use Biigle\Label;
use Biigle\VideoAnnotation;
use Illuminate\Foundation\Http\FormRequest;

class StoreLargoSession extends FormRequest
{
    /**
     * The force request attribute.
     *
     * @var bool
     */
    public $force;

    /**
     * The dismissed_image_annotations request attribute.
     *
     * @var array
     */
    public $dismissedImageAnnotations;

    /**
     * The changed_image_annotations request attribute.
     *
     * @var array
     */
    public $changedImageAnnotations;

    /**
     * The dismissed_video_annotations request attribute.
     *
     * @var array
     */
    public $dismissedVideoAnnotations;

    /**
     * The changed_video_annotations request attribute.
     *
     * @var array
     */
    public $changedVideoAnnotations;

    /**
     * Specifies whether the request is empty.
     *
     * @var bool
     */
    public $emptyRequest;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->force = $this->input('force', false);
        $this->dismissedImageAnnotations = $this->input('dismissed_image_annotations', []);
        $this->changedImageAnnotations = $this->input('changed_image_annotations', []);
        $this->dismissedVideoAnnotations = $this->input('dismissed_video_annotations', []);
        $this->changedVideoAnnotations = $this->input('changed_video_annotations', []);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'dismissed_image_annotations' => 'array',
            'changed_image_annotations' => 'array',
            'dismissed_video_annotations' => 'array',
            'changed_video_annotations' => 'array',
            'force' => 'bool',
        ];
    }

    /**
     * Get a list of unique annotation IDs that are either dismissed or changed.
     *
     * @param array $dismissed Array of all dismissed annotation IDs for each label
     * @param array $changed Array of all changed annotation IDs for each label
     *
     * @return array
     */
    protected function getAffectedAnnotations($dismissed, $changed)
    {
        if (!empty($dismissed)) {
            $dismissed = array_merge(...$dismissed);
        }

        if (!empty($changed)) {
            $changed = array_merge(...$changed);
        }

        return array_values(array_unique(array_merge($dismissed, $changed)));
    }

    /**
     * Check if all given image annotations belong to the given volumes.
     *
     * @param array $annotations ImageAnnotation IDs
     * @param array $volumes Volume IDs
     *
     * @return bool
     */
    protected function imageAnotationsBelongToVolumes($annotations, $volumes)
    {
        $chunkedAnnotations = array_chunk($annotations,config('biigle.db_param_limit') - count($volumes)); 
        foreach($chunkedAnnotations as $chunkedAnnotation){
            $queryReturn = ImageAnnotation::join('images', 'image_annotations.image_id', '=', 'images.id')
                ->whereIn('image_annotations.id', $chunkedAnnotation)
                ->whereNotIn('images.volume_id', $volumes)
                ->exists();
            if ($queryReturn){
                return false;
            }
        }
        return true;
        
    }

    /**
     * Check if all given video annotations belong to the given volumes.
     *
     * @param array $annotations VideoAnnotation IDs
     * @param array $volumes Volume IDs
     *
     * @return bool
     */
    protected function videoAnotationsBelongToVolumes($annotations, $volumes)
    {
        $chunkedAnnotations = array_chunk($annotations,config('biigle.db_param_limit') - count($volumes));
        foreach($chunkedAnnotations as $chunkedAnnotation){
            $queryReturn = VideoAnnotation::join('videos', 'video_annotations.video_id', '=', 'videos.id')
                ->whereIn('video_annotations.id', $chunkedAnnotation)
                ->whereNotIn('videos.volume_id', $volumes)
                ->exists();
            if ($queryReturn){
                return false;
            }
        }
        return true;
    }

    /**
     * Returns the IDs of all label trees that must be available to apply the changes.
     *
     * @param array $changed Array of all changed annotation IDs for each label
     *
     * @return array
     */
    protected function getRequiredLabelTrees($changed)
    {
        return Label::whereIn('id', array_keys($changed))
            ->groupBy('label_tree_id')
            ->pluck('label_tree_id');
    }
}
