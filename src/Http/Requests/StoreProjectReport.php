<?php

namespace Biigle\Modules\Reports\Http\Requests;

use Biigle\Image;
use Biigle\Modules\MetadataIfdo\IfdoParser;
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
            'type_id' => 'required|integer|exists:report_types,id',
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
            $this->validateReportType($validator);
            $this->validateGeoInfo($validator);
            $this->validateImageMetadata($validator);
            $this->validateIfdos($validator);
        });
    }

    /**
     * Validate the report types.
     *
     * @param \Illuminate\Validator\Validator $validator
     */
    protected function validateReportType($validator)
    {
        $imageReports = [
            ReportType::imageAnnotationsAreaId(),
            ReportType::imageAnnotationsBasicId(),
            ReportType::imageAnnotationsCsvId(),
            ReportType::imageAnnotationsExtendedId(),
            ReportType::imageAnnotationsCocoId(),
            ReportType::imageAnnotationsFullId(),
            ReportType::imageAnnotationsAbundanceId(),
            ReportType::imageAnnotationsImageLocationId(),
            ReportType::imageAnnotationsAnnotationLocationId(),
            ReportType::imageLabelsBasicId(),
            ReportType::imageLabelsCsvId(),
            ReportType::imageLabelsImageLocationId(),
            ReportType::imageIfdoId(),
        ];

        $videoReports = [
            ReportType::videoAnnotationsCsvId(),
            ReportType::videoLabelsCsvId(),
            ReportType::videoIfdoId(),
        ];

        if ($this->isType($imageReports) && !$this->project->imageVolumes()->exists()) {
            $validator->errors()->add('type_id', 'The project does not contain any image volumes.');
        } elseif ($this->isType($videoReports) && !$this->project->videoVolumes()->exists()) {
            $validator->errors()->add('type_id', 'The project does not contain any video volumes.');
        }
    }

    /**
     * Validate the geo info for certain types.
     *
     * @param \Illuminate\Validator\Validator $validator
     */
    protected function validateGeoInfo($validator)
    {
        $needsGeoInfo = [
            ReportType::imageAnnotationsAnnotationLocationId(),
            ReportType::imageAnnotationsImageLocationId(),
            ReportType::imageLabelsImageLocationId(),
        ];

        if ($this->isType($needsGeoInfo)) {
            $hasGeoInfo = $this->project->imageVolumes()
                ->select('id')
                ->get()
                ->reduce(function ($carry, $volume) {
                    return $carry && $volume->hasGeoInfo();
                }, true);

            if (!$hasGeoInfo) {
                $validator->errors()->add('id', 'No volume has images with geo coordinates.');
            }
        }
    }

    /**
     * Validate image metadata for certain types.
     *
     * @param \Illuminate\Validator\Validator $validator
     */
    protected function validateImageMetadata($validator)
    {
        if ($this->isType(ReportType::imageAnnotationsAnnotationLocationId())) {
            $query = Image::join('project_volume', 'project_volume.volume_id', '=', 'images.volume_id')
                ->where('project_volume.project_id', $this->project->id);

            $hasImagesWithMetadata = (clone $query)
                ->whereNotNull('attrs->metadata->yaw')
                ->whereNotNull('attrs->metadata->distance_to_ground')
                ->exists();

            if (!$hasImagesWithMetadata) {
                $validator->errors()->add('id', 'No volume has images with yaw and/or distance to ground metadata.');
            }

            $hasImagesWithDimensions = (clone $query)
                ->whereNotNull('attrs->width')
                ->whereNotNull('attrs->height')
                ->exists();

            if (!$hasImagesWithDimensions) {
                $validator->errors()->add('id', 'No volume has images with dimension information. Try again later if the images are new and still being processed.');
            }
        }
    }

    /**
     * Check if some volumes have iFDO files (if an iFDO report is requested).
     *
     * @param \Illuminate\Validator\Validator $validator
     */
    protected function validateIfdos($validator)
    {
        if ($this->isType([ReportType::imageIfdoId(), ReportType::videoIfdoId()])) {
            foreach ($this->project->volumes as $volume) {
                if ($volume->metadata_parser === IfdoParser::class) {
                    return;
                }
            }

            $validator->errors()->add('id', 'The project has no volumes with attached iFDO files.');
        }
    }
}
