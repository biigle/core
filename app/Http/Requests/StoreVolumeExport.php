<?php

namespace Biigle\Http\Requests;

class StoreVolumeExport extends ShowExport
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, string>
     */
    public function rules()
    {
        return parent::rules() + [
            'description' => 'nullable|string|max:255',
        ];
    }
}
