<?php

namespace Biigle\Http\Requests;

use Biigle\Label;
use Biigle\PendingVolume;
use Biigle\Visibility;
use DB;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePendingVolumeLabelMap extends FormRequest
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
            'label_map' => 'required|array|min:1',
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
                $validator->errors()->add('label_map', 'A volume must be created from the pending volume first.');
                return;
            }

            $metadata = $this->pendingVolume->getMetadata();
            if (is_null($metadata)) {
                $validator->errors()->add('label_map', 'No metadata file found.');
                return;
            }

            $map = $this->input('label_map');
            $metaLabels = $metadata->getFileLabels() + $metadata->getAnnotationLabels();
            foreach ($map as $id => $dbId) {
                if (!array_key_exists($id, $metaLabels)) {
                    $validator->errors()->add('label_map', "Label ID {$id} does not exist in the metadata file.");
                    return;
                }
            }

            $onlyLabels = $this->pendingVolume->only_annotation_labels + $this->pendingVolume->only_file_labels;
            if (!empty($onlyLabels)) {
                $diff = array_diff(array_keys($map), $onlyLabels);
                if (!empty($diff)) {
                    $validator->errors()->add('label_map', 'Some chosen metadata labels were excluded by a previously defined subset of annotation and/or file labels to import.');
                }
            }

            $count = Label::whereIn('id', array_values($map))->count();
            if (count($map) !== $count) {
                $validator->errors()->add('label_map', 'Some label IDs do not exist in the database.');
            }

            $count = Label::whereIn('id', array_values($map))
                ->whereIn('label_tree_id', function ($query) {
                    // All public and all accessible private label trees.
                    $query->select('id')
                        ->from('label_trees')
                        ->where('visibility_id', Visibility::publicId())
                        ->union(
                            DB::table('label_tree_user')
                                ->select('id')
                                ->where('user_id', $this->user()->id)
                        );
                })
                ->count();

            if (count($map) !== $count) {
                $validator->errors()->add('label_map', 'You do not have access to some label IDs in the database.');
            }
        });
    }
}
