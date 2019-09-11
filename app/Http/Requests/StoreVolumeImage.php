<?php

namespace Biigle\Http\Requests;

use Biigle\Volume;
use Biigle\Rules\VolumeImages;
use Biigle\Rules\VolumeImageUnique;
use Illuminate\Foundation\Http\FormRequest;

class StoreVolumeImage extends FormRequest
{
    /**
     * The volume to create the images in.
     *
     * @var Volume
     */
    public $volume;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->volume = Volume::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->volume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'images' => [
                'required',
                'array',
                new VolumeImages($this->volume->url),
                new VolumeImageUnique($this->volume)
            ],
            'images.*' => ['max:512'],
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        $images = $this->input('images');
        if (is_string($images)) {
            $this->merge([
                'images' => Volume::parseImagesQueryString($images),
            ]);
        }
    }
}
