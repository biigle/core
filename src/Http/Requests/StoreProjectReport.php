<?php

namespace Biigle\Modules\Reports\Http\Requests;

use Biigle\Modules\Reports\ReportType;
use Biigle\Project;
use Illuminate\Validation\Rule;

class StoreProjectReport extends StoreReport
{
    /**
     * The project to generate a new report for.
     *
     * @var Project
     */
    public $project;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->project = Project::findOrFail($this->route('id'));

        return $this->user()->can('access', $this->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return array_merge(parent::rules(), [
            'type_id' => 'required|exists:report_types,id',
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
            $imageReports = [
                ReportType::imageAnnotationsAreaId(),
                ReportType::imageAnnotationsBasicId(),
                ReportType::imageAnnotationsCsvId(),
                ReportType::imageAnnotationsExtendedId(),
                ReportType::imageAnnotationsFullId(),
                ReportType::imageAnnotationsAbundanceId(),
                ReportType::imageLabelsBasicId(),
                ReportType::imageLabelsCsvId(),
            ];

            $videoReports = [
                ReportType::videoAnnotationsCsvId(),
            ];

            if ($this->isType($imageReports) && !$this->project->imageVolumes()->exists()) {
                $validator->errors()->add('type_id', 'The project does not contain any image volumes.');
            } elseif ($this->isType($videoReports) && !$this->project->videoVolumes()->exists()) {
                $validator->errors()->add('type_id', 'The project does not contain any video volumes.');
            }
        });
    }
}
