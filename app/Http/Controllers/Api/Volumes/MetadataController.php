<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreVolumeMetadata;
use Biigle\Rules\ImageMetadata;
use Biigle\Rules\VideoMetadata;
use Biigle\Traits\ChecksMetadataStrings;
use Biigle\Video;
use Carbon\Carbon;
use DB;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class MetadataController extends Controller
{
    use ChecksMetadataStrings;

    /**
     * @api {post} volumes/:id/images/metadata Add image metadata
     * @apiDeprecated use now (#Volumes:StoreVolumeMetadata).
     * @apiGroup Volumes
     * @apiName StoreVolumeImageMetadata
     * @apiPermission projectAdmin
     */

    /**
     * Add or update file metadata for a volume.
     *
     * @api {post} volumes/:id/metadata Add file metadata
     * @apiGroup Volumes
     * @apiName StoreVolumeMetadata
     * @apiPermission projectAdmin
     * @apiDescription This endpoint allows adding or updating metadata such as geo coordinates for volume file.
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Attributes) {String} metadata_text CSV-like string with file metadata. See "metadata columns" for the possible columns. Each column may occur only once. There must be at least one column other than `filename`. For video metadata, multiple rows can contain metadata from different times of the same video. In this case, the `filename` of the rows must match and each row needs a (different) `taken_at` timestamp.
     * @apiParam (Attributes) {File} metadata_csv Alternative to `metadata_text`. This field allows the upload of an actual CSV file. See `metadata_text` for the further description.
     * @apiParam (Attributes) {File} ifdo_file iFDO metadata file to upload and link with the volume. The metadata of this file is not used for the volume or volume files. Use `metadata_text` or `metadata_csv` for this.
     *
     * @apiParam (metadata columns) {String} filename The filename of the file the metadata belongs to. This column is required.
     * @apiParam (metadata columns) {String} taken_at The date and time where the file was taken. Example: `2016-12-19 12:49:00`
     * @apiParam (metadata columns) {Number} lng Longitude where the file was taken in decimal form. If this column is present, `lat` must be present, too. Example: `52.3211`
     * @apiParam (metadata columns) {Number} lat Latitude where the file was taken in decimal form. If this column is present, `lng` must be present, too. Example: `28.775`
     * @apiParam (metadata columns) {Number} gps_altitude GPS Altitude where the file was taken in meters. Negative for below sea level. Example: `-1500.5`
     * @apiParam (metadata columns) {Number} distance_to_ground Distance to the sea floor in meters. Example: `30.25`
     * @apiParam (metadata columns) {Number} area Area shown by the file in m². Example `2.6`.
     *
     * @apiParamExample {String} Request example:
     * file: "filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area
     * image_1.png,2016-12-19 12:49:00,52.3211,28.775,-1500.5,30.25,2.6"
     *
     * @param StoreVolumeMetadata $request
     *
     * @return void
     */
    public function store(StoreVolumeMetadata $request)
    {
        if ($request->hasFile('ifdo_file')) {
            $request->volume->saveIfdo($request->file('ifdo_file'));
        }

        if ($request->input('metadata')) {
            DB::transaction(function () use ($request) {
                if ($request->volume->isImageVolume()) {
                    $this->updateImageMetadata($request);
                } else {
                    $this->updateVideoMetadata($request);
                }
            });

            $request->volume->flushGeoInfoCache();
        }
    }

    /**
     * Update volume metadata for each image.
     *
     * @param StoreVolumeMetadata $request
     */
    protected function updateImageMetadata(StoreVolumeMetadata $request)
    {
        $metadata = $request->input('metadata');
        $images = $request->volume->images()
            ->select('id', 'filename', 'attrs')
            ->get()
            ->keyBy('filename');

        $columns = array_shift($metadata);

        foreach ($metadata as $row) {
            $row = collect(array_combine($columns, $row));
            $image = $images->get($row['filename']);
            // Remove empty cells.
            $row = $row->filter();
            $fill = $row->only(ImageMetadata::ALLOWED_ATTRIBUTES);
            if ($fill->has('taken_at')) {
                $fill['taken_at'] = Carbon::parse($fill['taken_at']);
            }
            $image->fillable(ImageMetadata::ALLOWED_ATTRIBUTES);
            $image->fill($fill->toArray());

            $metadata = $row->only(ImageMetadata::ALLOWED_METADATA);
            $image->metadata = array_merge($image->metadata, $metadata->toArray());
            $image->save();
        }
    }

    /**
     * Update volume metadata for each video.
     *
     * @param StoreVolumeMetadata $request
     */
    protected function updateVideoMetadata(StoreVolumeMetadata $request)
    {
        $metadata = $request->input('metadata');
        $videos = $request->volume->videos()
            ->get()
            ->keyBy('filename');

        $columns = collect(array_shift($metadata));
        $rowsByFile = collect($metadata)
            ->map(fn ($row) => $columns->combine($row))
            ->map(function ($row) {
                if ($row->has('taken_at')) {
                    $row['taken_at'] = Carbon::parse($row['taken_at']);
                }

                return $row;
            })
            ->groupBy('filename');

        foreach ($rowsByFile as $filename => $rows) {
            $video = $videos->get($filename);
            $merged = $this->mergeVideoMetadata($video, $rows);
            $video->fillable(VideoMetadata::ALLOWED_ATTRIBUTES);
            $video->fill($merged->only(VideoMetadata::ALLOWED_ATTRIBUTES)->toArray());
            // Fields for allowed metadata are filtered in mergeVideoMetadata(). We use
            // except() with allowed attributes here so any metadata fields that were
            // previously stored for the video but are not contained in ALLOWED_METADATA
            // are not deleted.
            $video->metadata = $merged->except(VideoMetadata::ALLOWED_ATTRIBUTES)->toArray();
            $video->save();
        }
    }

    /**
     * Merge existing video metadata with new metaddata based on timestamps.
     *
     * Timestamps of existing metadata are extended, even if no new values are provided
     * for the fields. New values are extended with existing timestamps, even if these
     * timestamps are not provided in the new metadata.
     *
     * @param Video $video
     * @param Collection $rows
     *
     * @return Collection
     */
    protected function mergeVideoMetadata(Video $video, Collection $rows)
    {
        $metadata = collect();
        // Everything will be indexed by the timestamps below.
        $origTakenAt = collect($video->taken_at)->map(fn ($time) => $time->getTimestamp());
        $newTakenAt = $rows->pluck('taken_at')->filter()->map(fn ($time) => $time->getTimestamp());

        if ($origTakenAt->isEmpty() && $this->hasMetadata($video)) {
            if ($rows->count() > 1 || $newTakenAt->isNotEmpty()) {
                throw ValidationException::withMessages(
                    [
                        'metadata' => ["Metadata of video '{$video->filename}' has no 'taken_at' timestamps and cannot be updated with new metadata that has timestamps."],
                    ]
                );
            }

            return $rows->first();
        } elseif ($newTakenAt->isEmpty()) {
            throw ValidationException::withMessages(
                [
                    'metadata' => ["Metadata of video '{$video->filename}' has 'taken_at' timestamps and cannot be updated with new metadata that has no timestamps."],
                ]
            );
        }

        // These are used to fill missing values with null.
        $origTakenAtNull = $origTakenAt->combine($origTakenAt->map(fn ($x) => null));
        $newTakenAtNull = $newTakenAt->combine($newTakenAt->map(fn ($x) => null));

        /** @var \Illuminate\Support\Collection<string, mixed> */
        $originalAttributes = collect(VideoMetadata::ALLOWED_ATTRIBUTES)
            ->mapWithKeys(fn ($key) => [$key => $video->$key]);

        /** @var \Illuminate\Support\Collection<string, mixed> */
        $originalMetadata = collect(VideoMetadata::ALLOWED_METADATA)
            ->mapWithKeys(fn ($key) => [$key => null])
            ->merge($video->metadata);

        $originalData = $originalMetadata->merge($originalAttributes);

        foreach ($originalData as $key => $originalValues) {
            $originalValues = collect($originalValues);
            if ($originalValues->isNotEmpty()) {
                $originalValues = $origTakenAt->combine($originalValues);
            }

            // Pluck returns an array filled with null if the key doesn't exist.
            $newValues = $newTakenAt
                ->combine($rows->pluck($key))
                ->filter([$this, 'isFilledString']);

            // This merges old an new values, leaving null where no values are given
            // (for an existing or new timestamp). The union order is essential.
            $newValues = $newValues
                ->union($originalValues)
                ->union($origTakenAtNull)
                ->union($newTakenAtNull);

            // Do not insert completely empty new values.
            if ($newValues->filter([$this, 'isFilledString'])->isEmpty()) {
                continue;
            }

            // Sort everything by ascending timestamps.
            $metadata[$key] = $newValues->sortKeys()->values();
        }

        // Convert numeric fields to numbers.
        foreach (VideoMetadata::NUMERIC_FIELDS as $key => $value) {
            if ($metadata->has($key)) {
                $metadata[$key]->transform(function ($x) {
                    // This check is required since floatval would return 0 for
                    // an empty value. This could skew metadata.
                    return $this->isFilledString($x) ? floatval($x) : null;
                });
            }
        }

        return $metadata;
    }

    /**
     * Determine if a video has any metadata.
     *
     * @param Video $video
     *
     * @return boolean
     */
    protected function hasMetadata(Video $video)
    {
        foreach (VideoMetadata::ALLOWED_ATTRIBUTES as $key) {
            if (!is_null($video->$key)) {
                return true;
            }
        }

        return !empty($video->metadata);
    }
}
