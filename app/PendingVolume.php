<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\UploadedFile;
use Storage;

class PendingVolume extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'media_type_id',
        'user_id',
        'project_id',
        'metadata_file_path',
        'volume_id',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'metadata_file_path',
    ];

    protected static function booted(): void
    {
        static::deleting(function (PendingVolume $pv) {
            if ($pv->hasMetadata()) {
                $disk = config('volumes.pending_metadata_storage_disk');
                Storage::disk($disk)->delete($pv->metadata_file_path);
            }
        });
    }

    public function hasMetadata(): bool
    {
        return !is_null($this->metadata_file_path);
    }

    public function saveMetadata(UploadedFile $file): void
    {
        $disk = config('volumes.pending_metadata_storage_disk');
        $extension = $file->getExtension();
        $this->metadata_file_path = "{$this->id}.{$extension}";
        $file->storeAs('', $this->metadata_file_path, $disk);
        $this->save();
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
