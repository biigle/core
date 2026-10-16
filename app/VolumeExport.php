<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Storage;

class VolumeExport extends Model
{
    protected static function booted(): void
    {
        static::deleted(fn (VolumeExport $export) => $export->deleteFile());
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'int',
            'volume_ids' => 'array',
            'ready_at' => 'datetime',
        ];
    }

    /**
     * The user who requested the export.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Delete the stored archive.
     */
    public function deleteFile(): void
    {
        Storage::disk(config('sync.volume_export_storage_disk'))
            ->delete($this->getStorageFilename());
    }

    /**
     * Get the archive filename in storage.
     */
    public function getStorageFilename(): string
    {
        return "{$this->id}.zip";
    }
}
