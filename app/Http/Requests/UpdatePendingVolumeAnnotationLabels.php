<?php

namespace Biigle\Http\Requests;

use Biigle\PendingVolume;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePendingVolumeAnnotationLabels extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $this->pendingVolume = PendingVolume::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->pendingVolume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'labels' => 'required|array|min:1',
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
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if (is_null($this->pendingVolume->volume_id)) {
                $validator->errors()->add('labels', 'A volume must be created from the pending volume first.');
                return;
            }

            $labels = $this->input('labels');
            $metadata = $this->pendingVolume->getMetadata();
            if (is_null($metadata)) {
                $validator->errors()->add('labels', 'No metadata file found.');
                return;
            }

            $metaLabels = $metadata->getAnnotationLabels();
            foreach ($labels as $id) {
                if (!array_key_exists($id, $metaLabels)) {
                    $validator->errors()->add('labels', "Label ID {$id} does not exist in the metadata file.");
                    return;
                }
            }
        });
    }
}
