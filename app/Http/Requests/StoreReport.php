<?php

namespace Biigle\Http\Requests;

use Biigle\ReportType;
use Illuminate\Foundation\Http\FormRequest;

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
            'separate_users' => 'nullable|boolean',
            'export_area' => 'nullable|boolean',
            'newest_label' => 'nullable|boolean|prohibited_if:all_labels,true',
            'only_labels' => 'nullable|array|prohibited_if:all_labels,true',
            'only_labels.*' => 'integer|exists:labels,id',
            'aggregate_child_labels' => "nullable|boolean|prohibited_if:all_labels,true",
            'disable_notifications' => "nullable|boolean",
            'strip_ifdo' => "nullable|boolean",
            'all_labels' => 'nullable|boolean',
            'skip_attributes' => 'nullable|boolean',
            'yolo_image_path' => 'nullable|string|max:512',
            'yolo_train_split' => 'nullable|numeric|between:0,1',
            'yolo_val_split' => 'nullable|numeric|between:0,1',
            'yolo_test_split' => 'nullable|numeric|between:0,1',
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
            $exportArea = boolval($this->input('export_area', false));

            if ($exportArea && !$this->isAllowedForExportArea()) {
                $validator->errors()->add('export_area', 'The export area is not supported for this report type.');
            }

            $aggregate = boolval($this->input('aggregate_child_labels', false));
            if ($aggregate && !$this->isAllowedForAggregateChildLabels()) {
                $validator->errors()->add('aggregate_child_labels', 'Child labels can only be aggregated for basic, extended and abundance image annotation reports.');
            }

            $allLabels = boolval($this->input('all_labels', false));
            if ($allLabels && !$this->isAllowedForAllLabels()) {
                $validator->errors()->add('all_labels', "The 'all labels' option is only supported for image annotation abundance reports.");
            }

            if ($this->input('separate_label_trees', false) && $this->input('separate_users', false)) {
                $validator->errors()->add('separate_label_trees', 'Only one of separate_label_trees or separate_users may be specified.');
            }

            if ($this->isAllowedForYolo() && $validator->errors()->isEmpty()) {
                $sum = array_sum($this->getYoloSplit());
                if (abs($sum - 1) > 0.001) {
                    $validator->errors()->add('yolo_train_split', 'The train, validation and test splits must add up to 1.');
                }
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
            'separateUsers' => boolval($this->input('separate_users', false)),
            'newestLabel' => boolval($this->input('newest_label', false)),
            'onlyLabels' => $this->input('only_labels', []),
        ];

        if ($this->isAllowedForExportArea()) {
            $options['exportArea'] = boolval($this->input('export_area', false));
        }

        if ($this->isAllowedForAggregateChildLabels()) {
            $options['aggregateChildLabels'] = boolval($this->input('aggregate_child_labels', false));
        }

        if ($this->has('disable_notifications')) {
            $options['disableNotifications'] = boolval($this->input('disable_notifications', false));
        }

        if ($this->isAllowedForStripIfdo()) {
            $options['stripIfdo'] = boolval($this->input('strip_ifdo', false));
        }

        if ($this->isAllowedForAllLabels()) {
            $options['allLabels'] = boolval($this->input('all_labels', false));
        }

        if ($this->isAllowedForSkipAttributes()) {
            $options['skipAttributes'] = boolval($this->input('skip_attributes', false));
        }

        if ($this->isAllowedForYolo()) {
            $options['yoloImagePath'] = $this->input('yolo_image_path');
            $options['yoloSplit'] = $this->getYoloSplit();
        }

        return $options;
    }

    /**
     * Check if the requested reporty type ID is in the supplied array.
     *
     * @param array|int $allowed
     *
     * @return boolean
     */
    protected function isType($allowed)
    {
        $id = intval($this->input('type_id'));

        if (is_array($allowed)) {
            return in_array($id, $allowed);
        }

        return $id === $allowed;
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
     * Check if skip_attributes may be configured for the requested report type.
     *
     * @return boolean
     */
    protected function isAllowedForSkipAttributes()
    {
        return $this->isType([
            ReportType::imageAnnotationsCsvId(),
            ReportType::videoAnnotationsCsvId(),
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
            ReportType::imageAnnotationsAbundanceId(),
        ]);
    }

    /**
     * Check if all_labels may be configured for the requested report type.
     *
     * @return boolean
     */
    protected function isAllowedForAllLabels()
    {
        return $this->isType([
            ReportType::imageAnnotationsAbundanceId(),
        ]);
    }

    /**
     * Check if the YOLO options may be configured for the requested report type.
     *
     * @return boolean
     */
    protected function isAllowedForYolo()
    {
        return $this->isType(ReportType::imageAnnotationsYoloId());
    }

    /**
     * Get the train, validation and test split for a YOLO report.
     *
     * The report form only submits non-zero values. If none of the splits is given,
     * the default split is used. Otherwise missing splits are zero.
     *
     * @return array
     */
    protected function getYoloSplit()
    {
        $keys = ['yolo_train_split', 'yolo_val_split', 'yolo_test_split'];

        if (!$this->hasAny($keys)) {
            return [0.7, 0.2, 0.1];
        }

        return array_map(fn ($key) => floatval($this->input($key, 0)), $keys);
    }

    /**
     * Check if strip_ifdo may be configured for the requested report type.
     *
     * @return boolean
     */
    protected function isAllowedForStripIfdo()
    {
        return $this->isType([
            ReportType::imageIfdoId(),
            ReportType::videoIfdoId(),
        ]);
    }
}
