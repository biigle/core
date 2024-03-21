<?php

namespace Biigle\Http\Requests;

use Biigle\PendingVolume;
use Illuminate\Foundation\Http\FormRequest;

class StorePendingVolumeImport extends FormRequest
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
            //
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
            $pv = $this->pendingVolume;

            if (is_null($pv->volume_id)) {
                $validator->errors()->add('id', 'A volume must be created from the pending volume first.');
                return;
            }

            if ($pv->importing) {
                $validator->errors()->add('id', 'An import is already in progress.');
                return;
            }

            if (!$pv->import_annotations && !$pv->import_file_labels) {
                $validator->errors()->add('id', 'Neither annotations nor file labels were set to be imported.');
                return;
            }

            $metadata = $pv->getMetadata();
            if (is_null($metadata)) {
                $validator->errors()->add('id', 'No metadata file found.');
                return;
            }

            if ($pv->import_annotations) {
                $labels = $metadata->getAnnotationLabels();

                if (empty($labels)) {
                    $validator->errors()->add('id', 'There are no annotations to import.');
                    return;
                }

                if ($pv->only_annotation_labels) {
                    $remaining = array_intersect_key($labels, array_flip($pv->only_annotation_labels));

                    if (empty($remaining)) {
                        $validator->errors()->add('id', 'There are no annotations to import with the chosen labels.');
                        return;
                    }
                }

            }

            if ($pv->import_file_labels) {
                $labels = $metadata->getFileLabels();

                if (empty($labels)) {
                    $validator->errors()->add('id', 'There are no file labels to import.');
                    return;
                }

                if ($pv->only_file_labels) {
                    $remaining = array_intersect_key($labels, array_flip($pv->only_file_labels));

                    if (empty($remaining)) {
                        $validator->errors()->add('id', 'There are no file labels to import with the chosen labels.');
                        return;
                    }
                }

            }
        });
    }
}
