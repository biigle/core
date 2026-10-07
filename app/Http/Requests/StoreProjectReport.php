<?php

namespace Biigle\Http\Requests;

use Biigle\Image;
use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\Project;
use Biigle\ReportType;
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
            'type' => ['required', 'integer', Rule::enum(ReportType::class)]
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
     * @param \Illuminate\Validation\Validator $validator
     */
    protected function validateReportType($validator)
    {
        $imageReports = [
            ReportType::IMAGE_ANNOTATIONS_AREA,
            ReportType::IMAGE_ANNOTATIONS_BASIC,
            ReportType::IMAGE_ANNOTATIONS_CSV,
            ReportType::IMAGE_ANNOTATIONS_EXTENDED,
            ReportType::IMAGE_ANNOTATIONS_COCO,
            ReportType::IMAGE_ANNOTATIONS_FULL,
            ReportType::IMAGE_ANNOTATIONS_ABUNDANCE,
            ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION,
            ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION,
            ReportType::IMAGE_LABELS_BASIC,
            ReportType::IMAGE_LABELS_CSV,
            ReportType::IMAGE_LABELS_IMAGE_LOCATION,
            ReportType::IMAGE_IFDO,
        ];

        $videoReports = [
            ReportType::VIDEO_ANNOTATIONS_CSV,
            ReportType::VIDEO_LABELS_CSV,
            ReportType::VIDEO_IFDO,
        ];

        if ($this->isType($imageReports) && !$this->project->imageVolumes()->exists()) {
            $validator->errors()->add('type', 'The project does not contain any image volumes.');
        } elseif ($this->isType($videoReports) && !$this->project->videoVolumes()->exists()) {
            $validator->errors()->add('type', 'The project does not contain any video volumes.');
        }
    }

    /**
     * Validate the geo info for certain types.
     *
     * @param \Illuminate\Validation\Validator $validator
     */
    protected function validateGeoInfo($validator)
    {
        $needsGeoInfo = [
            ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION,
            ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION,
            ReportType::IMAGE_LABELS_IMAGE_LOCATION,
        ];

        if ($this->isType($needsGeoInfo)) {
            $hasGeoInfo = $this->project->imageVolumes()
                ->select('id')
                ->get()
                ->reduce(fn ($carry, $volume) => $carry && $volume->hasGeoInfo(), true);

            if (!$hasGeoInfo) {
                $validator->errors()->add('id', 'No volume has images with geo coordinates.');
            }
        }
    }

    /**
     * Validate image metadata for certain types.
     *
     * @param \Illuminate\Validation\Validator $validator
     */
    protected function validateImageMetadata($validator)
    {
        if ($this->isType(ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION)) {
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
     * @param \Illuminate\Validation\Validator $validator
     */
    protected function validateIfdos($validator)
    {
        if ($this->isType([ReportType::IMAGE_IFDO, ReportType::VIDEO_IFDO])) {
            foreach ($this->project->volumes as $volume) {
                if ($volume->metadata_parser === IfdoParser::class) {
                    return;
                }
            }

            $validator->errors()->add('id', 'The project has no volumes with attached iFDO files.');
        }
    }
}
