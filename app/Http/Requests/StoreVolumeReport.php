<?php

namespace Biigle\Http\Requests;

use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\ReportType;
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
                ReportType::IMAGE_ANNOTATIONS_AREA->value,
                ReportType::IMAGE_ANNOTATIONS_BASIC->value,
                ReportType::IMAGE_ANNOTATIONS_CSV->value,
                ReportType::IMAGE_ANNOTATIONS_EXTENDED->value,
                ReportType::IMAGE_ANNOTATIONS_COCO->value,
                ReportType::IMAGE_ANNOTATIONS_FULL->value,
                ReportType::IMAGE_ANNOTATIONS_ABUNDANCE->value,
                ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION->value,
                ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value,
                ReportType::IMAGE_LABELS_BASIC->value,
                ReportType::IMAGE_LABELS_CSV->value,
                ReportType::IMAGE_LABELS_IMAGE_LOCATION->value,
                ReportType::IMAGE_IFDO->value,
            ];
        } else {
            $types = [
                ReportType::VIDEO_ANNOTATIONS_CSV->value,
                ReportType::VIDEO_LABELS_CSV->value,
                ReportType::VIDEO_IFDO->value,
            ];
        }

        return array_merge(parent::rules(), [
            'type' => ['required', Rule::in($types)],
            'annotation_session_id' => "nullable|integer|exists:annotation_sessions,id,volume_id,{$this->volume->id}",
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
            $needsGeoInfo = [
                ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value,
                ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION->value,
                ReportType::IMAGE_LABELS_IMAGE_LOCATION->value,
            ];

            if ($this->isType($needsGeoInfo) && !$this->volume->hasGeoInfo()) {
                $validator->errors()->add('id', 'The volume images have no geo coordinates.');
            }

            if ($this->isType(ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value)) {
                $hasImagesWithMetadata = $this->volume->images()
                    ->whereNotNull('attrs->metadata->yaw')
                    ->whereNotNull('attrs->metadata->distance_to_ground')
                    ->exists();

                if (!$hasImagesWithMetadata) {
                    $validator->errors()->add('id', 'The volume images have no yaw and/or distance to ground metadata.');
                }

                $hasImagesWithDimensions = $this->volume->images()
                    ->whereNotNull('attrs->width')
                    ->whereNotNull('attrs->height')
                    ->exists();

                if (!$hasImagesWithDimensions) {
                    $validator->errors()->add('id', 'The volume images have no dimension information. Try again later if the images are new and still being processed.');
                }
            }

            if ($this->isType([ReportType::IMAGE_IFDO->value, ReportType::VIDEO_IFDO->value]) && $this->volume->metadata_parser !== IfdoParser::class) {
                $validator->errors()->add('id', 'The volume has no attached iFDO file.');
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
