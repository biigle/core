<?php

namespace Biigle\Http\Requests;

use Biigle\PendingVolume;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePendingVolumeUserMap extends FormRequest
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
            'user_map' => 'required|array|min:1',
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
                $validator->errors()->add('user_map', 'A volume must be created from the pending volume first.');
                return;
            }

            $metadata = $this->pendingVolume->getMetadata();
            if (is_null($metadata)) {
                $validator->errors()->add('user_map', 'No metadata file found.');
                return;
            }

            $map = $this->input('user_map');
            $metaUsers = $metadata->getUsers();
            foreach ($map as $id => $dbId) {
                if (!array_key_exists($id, $metaUsers)) {
                    $validator->errors()->add('user_map', "User ID {$id} does not exist in the metadata file.");
                    return;
                }
            }

            $count = User::whereIn('id', array_values($map))->count();
            if (count($map) !== $count) {
                $validator->errors()->add('user_map', 'Some user IDs do not exist in the database.');
            }
        });
    }
}
