<?php

namespace Biigle\Modules\Reports\Http\Requests;

use Biigle\MediaType;
use Biigle\Modules\Reports\ReportType;
use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVolumeReport extends FormRequest
{
    /**
     * The volume to generate a new report for.
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

        return $this->user()->can('access', $this->volume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'annotation_session_id' => "nullable|exists:annotation_sessions,id,volume_id,{$this->volume->id}",
            'type_id' => [
                'required',
                Rule::notIn([ReportType::videoAnnotationsCsvId()]),
                'exists:report_types,id',
            ],
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
            // if ($this->project->users()->where('id', $this->route('id2'))->exists()) {
            //     $validator->errors()->add('id', 'The user is already member of this project.');
            // }
        });
    }
}
