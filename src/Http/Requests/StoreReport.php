<?php

namespace Biigle\Modules\Reports\Http\Requests;

use Biigle\MediaType;
use Biigle\Modules\Reports\ReportType;
use Biigle\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReport extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'separate_label_trees' => 'nullable|boolean',
            'export_area' => 'nullable|boolean',
            'newest_label' => 'nullable|boolean',
            'only_labels' => 'nullable|array',
            'only_labels.*' => 'exists:labels,id',
            'aggregate_child_labels' => "nullable|boolean",
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
            if ($this->has('export_area') && !$this->isAllowedForExportArea()) {
                $validator->errors()->add('export_area', 'The export area is only supported for image annotation reports.');
            }

            if ($this->has('aggregate_child_labels') && !$this->isAllowedForAggregateChildLabels()) {
                $validator->errors()->add('aggregate_child_labels', 'Child labels can only be aggregated for basic, extended and abundance image annotation reports.');
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
        $options = [
            'separateLabelTrees' => boolval($this->input('separate_label_trees', false)),
            'newestLabel' => boolval($this->input('newest_label', false)),
            'onlyLabels' => $this->input('only_labels', []),
        ];

        if ($this->isAllowedForExportArea()) {
            $options['exportArea'] = boolval($this->input('export_area', false));
        }

        if ($this->isAllowedForAggregateChildLabels()) {
            $options['aggregateChildLabels'] = boolval($this->input('aggregate_child_labels', false));
        }

        return $options;
    }

    /**
     * Check if the requested reporty type ID is in the supplied array.
     *
     * @param array $allowed
     *
     * @return boolean
     */
    protected function isType($allowed)
    {
        return in_array(intval($this->input('type_id')), $allowed);
    }

    /**
     * Check if export_area may be configured for the requested report type.
     *
     * @return boolean
     */
    protected function isAllowedForExportArea()
    {
        return $this->isType([
            ReportType::imageAnnotationsAreaId(),
            ReportType::imageAnnotationsBasicId(),
            ReportType::imageAnnotationsCsvId(),
            ReportType::imageAnnotationsExtendedId(),
            ReportType::imageAnnotationsFullId(),
            ReportType::imageAnnotationsAbundanceId(),
        ]);
    }

    /**
     * Check if aggregate_child_labels may be configured for the requested report type.
     *
     * @return boolean
     */
    protected function isAllowedForAggregateChildLabels()
    {
        return $this->isType([
            ReportType::imageAnnotationsBasicId(),
            ReportType::imageAnnotationsExtendedId(),
            ReportType::imageAnnotationsAbundanceId(),
        ]);
    }
}
