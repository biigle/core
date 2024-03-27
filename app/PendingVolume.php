<?php

namespace Biigle;

use Biigle\Traits\HasMetadataFile;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PendingVolume extends Model
{
    use HasFactory, HasMetadataFile;

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
        'import_annotations',
        'import_file_labels',
        'only_annotation_labels',
        'only_file_labels',
        'label_map',
        'user_map',
        'importing',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'metadata_file_path',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'only_annotation_labels' => 'array',
        'only_file_labels' => 'array',
        'label_map' => 'array',
        'user_map' => 'array',
    ];

    /**
     * Default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'only_annotation_labels' => '[]',
        'only_file_labels' => '[]',
        'label_map' => '[]',
        'user_map' => '[]',
    ];

    protected static function booted(): void
    {
        static::$metadataFileDisk = config('volumes.pending_metadata_storage_disk');

        static::deleting(function (PendingVolume $pv) {
            $pv->deleteMetadata(true);
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function volume(): BelongsTo
    {
        return $this->belongsTo(Volume::class);
    }
}
