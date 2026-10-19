<?php

namespace Biigle;

use Biigle\Services\Export\LabelTreeExport;
use Biigle\Services\Export\UserExport;
use Biigle\Services\Export\VolumeExport;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use InvalidArgumentException;
use Storage;

class ExportFile extends Model
{
    protected $table = 'exports';

    protected static function booted(): void
    {
        static::deleted(fn (ExportFile $export) => $export->deleteFile());
    }

    protected function casts(): array
    {
        return [
            'user_id' => 'int',
            'entity_ids' => 'array',
            'ready_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getGenerator(): \Biigle\Services\Export\Export
    {
        return match ($this->type) {
            'volumes' => new VolumeExport($this->entity_ids),
            'labelTrees' => new LabelTreeExport($this->entity_ids),
            'users' => new UserExport($this->entity_ids),
            default => throw new InvalidArgumentException('Unknown export type.'),
        };
    }

    public function getTypeName(): string
    {
        return match ($this->type) {
            'volumes' => 'Volume',
            'labelTrees' => 'Label tree',
            'users' => 'User',
            default => throw new InvalidArgumentException('Unknown export type.'),
        };
    }

    public function deleteFile(): void
    {
        Storage::disk(config('sync.export_storage_disk'))
            ->delete($this->getStorageFilename());
    }

    public function getStorageFilename(): string
    {
        return "{$this->id}.zip";
    }
}
