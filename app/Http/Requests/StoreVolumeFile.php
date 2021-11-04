<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\VolumeFiles;
use Biigle\Rules\VolumeFileUnique;
use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;

class StoreVolumeFile extends FormRequest
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
            'files' => [
                'required',
                'array',
                new VolumeFiles($this->volume->url, $this->volume->media_type_id),
                new VolumeFileUnique($this->volume),
            ],
            // Do not validate the maximum filename length with a 'files.*' rule because
            // this leads to a request timeout when the rule is expanded for a huge
            // number of files.
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        // This establishes backwards compatibility of the old 'images' attribute which
        // is now 'files'.
        if ($this->missing('files') && $this->has('images')) {
            $this->merge(['files' => $this->input('images')]);
        }

        $files = $this->input('files');
        if (is_string($files)) {
            $this->merge(['files' => Volume::parseFilesQueryString($files)]);
        }
    }
}
