<?php

namespace Biigle\Http\Requests;

use Biigle\Volume;

class FilterVolumeAnnotationsRequest extends FilterAnnotationsRequest
{
    /**
     * To which volume the annotations are being filtered.
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
        $this->labelId = intval($this->route('id2'));

        return $this->user()->can('access', $this->volume);
    }
}
