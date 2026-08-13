<?php

namespace Biigle\Http\Requests;

use Biigle\Http\Requests\FilterAnnotationsRequest;
use Biigle\Volume;

class FilterVolumeAnnotationsRequest extends FilterAnnotationsRequest
{
    /**
     * To which project the annotations are being filtered.
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
        $this->volume = Volume::findOrFail($this->route('vid'));

        return $this->user()->can('access', $this->volume);
    }
}
