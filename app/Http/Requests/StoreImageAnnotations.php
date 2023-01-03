<?php

namespace Biigle\Http\Requests;

use Biigle\Image;
use Biigle\Label;
use Illuminate\Foundation\Http\FormRequest;

class StoreImageAnnotations extends FormRequest
{
    /**
     * Maximum number of new annotations that can be created in a single request.
     *
     * @var int
     */
    const LIMIT = 100;

    /**
     * Unique image IDs of this request.
     *
     * @var array
     */
    public $imageIds;

    /**
     * The images on which the annotations should be created.
     *
     * @var array
     */
    public $images;

    /**
     * The labels that should be attached to the new annotations.
     *
     * @var array
     */
    public $labels;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $input = collect($this->all());
        $this->imageIds = $input->pluck('image_id')
            ->unique()
            // Filter because the IDs are validated *after* authorization and could be
            // e.g. floats here.
            ->filter(fn ($id) => is_int($id));

        $this->images = Image::findMany($this->imageIds, ['id', 'volume_id']);

        $labelIds = $input->pluck('label_id')
            ->unique()
            // Filter because the IDs are validated *after* authorization and could be
            // e.g. floats here.
            ->filter(fn ($id) => is_int($id));

        $this->labels = Label::findMany($labelIds)->keyBy('id');

        return $this->images->reduce(function ($carry, $image) {
            return $carry && $this->user()->can('add-annotation', $image);
        }, true);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            '*.image_id' => 'required|integer|exists:images,id',
            '*.label_id' => 'required|integer|exists:labels,id',
            '*.confidence' => 'required|numeric|between:0,1',
            '*.shape_id' => 'required|integer|exists:shapes,id',
            '*.points' => 'required|array',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        if (count($this->all()) > self::LIMIT) {
            $validator->errors()->add('limit', 'No more than 100 annotations can be created with a single request.');
            $this->failedValidation($validator);
        }

        $validator->after(function ($validator) {
            if ($this->imageIds->count() !== $this->images->count()) {
                $validator->errors()->add('image_id', 'The image id does not exist.');
            }

            if ($this->imageIds->count() !== $this->images->count()) {
                $validator->errors()->add('image_id', 'The image id does not exist.');
            }
        });
    }
}
