<?php

namespace Biigle\Modules\Largo\Http\Requests;

use Biigle\ImageAnnotation;
use Biigle\Label;
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
     * The dismissed request attribute.
     *
     * @var array
     */
    public $dismissed;

    /**
     * The changed request attribute.
     *
     * @var array
     */
    public $changed;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->force = $this->input('force', false);
        $this->dismissed = $this->input('dismissed', []);
        $this->changed = $this->input('changed', []);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'dismissed' => 'array',
            'changed' => 'array',
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
     * Check if all given annotations belong to the given volumes.
     *
     * @param array $annotations ImageAnnotation IDs
     * @param array $volumes Volume IDs
     *
     * @return bool
     */
    protected function anotationsBelongToVolumes($annotations, $volumes)
    {
        return !ImageAnnotation::join('images', 'image_annotations.image_id', '=', 'images.id')
            ->whereIn('image_annotations.id', $annotations)
            ->whereNotIn('images.volume_id', $volumes)
            ->exists();
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
