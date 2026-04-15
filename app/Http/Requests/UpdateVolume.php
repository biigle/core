<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\Handle;
use Biigle\Rules\VolumeAccessibleAtUrl;
use Biigle\Rules\VolumeUrl;
use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;

class UpdateVolume extends FormRequest
{
    /**
     * The volume to update.
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
        $urlRules = ['bail', 'filled', 'string', 'max:256', new VolumeUrl];

        // If the URL is being changed, also probe the volume's existing
        // files at the new URL — same per-file existence check that
        // StoreVolume applies on creation. Without this, a typo in the
        // new URL would silently re-point the volume at empty storage
        // (#829).
        $newUrl = $this->input('url');
        if (is_string($newUrl) && $newUrl !== '' && $newUrl !== $this->volume->url) {
            $urlRules[] = new VolumeAccessibleAtUrl($this->volume);
        }

        return [
            'name' => 'filled|max:512',
            'url' => $urlRules,
            'handle' => ['bail', 'nullable', 'string', 'max:256', new Handle],
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        // Backwards compatibility.
        if ($this->has('doi') && !$this->has('handle')) {
            $this->merge(['handle' => $this->input('doi')]);
        }
    }
}
