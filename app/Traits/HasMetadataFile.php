<?php

namespace Biigle\Traits;

use Biigle\MediaType;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Cache;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use SplFileInfo;

trait HasMetadataFile
{
    /**
     * Name of the storage disk where the metadata files are stored.
     */
    public static string $metadataFileDisk;

    public function hasMetadata(): bool
    {
        return !is_null($this->metadata_file_path);
    }

    public function saveMetadata(UploadedFile $file): void
    {
        $this->metadata_file_path = $this->id;
        if ($extension = $file->getClientOriginalExtension()) {
            $this->metadata_file_path .= '.'.$extension;
        }
        $file->storeAs('', $this->metadata_file_path, static::$metadataFileDisk);
        $this->save();
    }

    public function getMetadata(): ?VolumeMetadata
    {
        if (!$this->hasMetadata()) {
            return null;
        }

        $disk = static::$metadataFileDisk;
        $key = "metadata-{$disk}-{$this->metadata_file_path}";

        return Cache::store('array')->remember($key, 60, function () use ($disk) {
            $tmpPath = tempnam(sys_get_temp_dir(), 'metadata');
            try {
                $from = Storage::disk($disk)->readStream($this->metadata_file_path);
                $to = fopen($tmpPath, 'w');
                stream_copy_to_stream($from, $to);
                $type = ($this->media_type_id === MediaType::imageId()) ? 'image' : 'video';

                $parser = new $this->metadata_parser(new SplFileInfo($tmpPath));

                return $parser->getMetadata();
            } finally {
                fclose($to);
                File::delete($tmpPath);
            }
        });
    }

    /**
     * @param boolean $noUpdate Do not set metadata_file_path to null.
     */
    public function deleteMetadata($noUpdate = false): void
    {
        if ($this->hasMetadata()) {
            Storage::disk(static::$metadataFileDisk)->delete($this->metadata_file_path);
            if (!$noUpdate) {
                $this->update(['metadata_file_path' => null]);
            }
        }
    }
}
