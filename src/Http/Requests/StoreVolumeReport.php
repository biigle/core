<?php

namespace Biigle\Modules\Reports\Http\Requests;

use Biigle\Modules\Reports\ReportType;
use Biigle\Volume;
use Illuminate\Validation\Rule;

class StoreVolumeReport extends StoreReport
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
        if ($this->volume->isImageVolume()) {
            $types = [
                ReportType::imageAnnotationsAreaId(),
                ReportType::imageAnnotationsBasicId(),
                ReportType::imageAnnotationsCsvId(),
                ReportType::imageAnnotationsExtendedId(),
                ReportType::imageAnnotationsFullId(),
                ReportType::imageAnnotationsAbundanceId(),
                ReportType::imageLabelsBasicId(),
                ReportType::imageLabelsCsvId(),
                ReportType::imageLabelsImageLocationId(),
            ];
        } else {
            $types = [
                ReportType::videoAnnotationsCsvId(),
            ];
        }

        return array_merge(parent::rules(), [
            'type_id' => ['required', Rule::in($types)],
            'annotation_session_id' => "nullable|exists:annotation_sessions,id,volume_id,{$this->volume->id}",
        ]);
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        parent::withValidator($validator);

        $validator->after(function ($validator) {
            $typeId = intval($this->input('type_id'));
            if ($typeId === ReportType::imageLabelsImageLocationId() && !$this->volume->hasGeoInfo()) {
                $validator->errors()->add('id', 'The volume images have no geo coordinates.');
            }
        });
    }

    /**
     * Get the options for the new report.
     *
     * @return array
     */
    public function getOptions()
    {
        return array_merge(parent::getOptions(), [
            'annotationSession' => $this->input('annotation_session_id'),
        ]);
    }
}
