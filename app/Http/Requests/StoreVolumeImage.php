<?php

namespace Biigle\Http\Requests;

use Biigle\Volume;
use Biigle\Rules\VolumeImages;
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
            'images' => ['required', new VolumeImages],
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        $this->merge([
            'images' => Volume::parseImagesQueryString($this->input('images')),
        ]);
    }
}
