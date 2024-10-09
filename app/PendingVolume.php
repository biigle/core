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
     * @var array<int, string>
     */
    protected $fillable = [
        'media_type_id',
        'user_id',
        'project_id',
        'metadata_file_path',
        'metadata_parser',
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
     * @var array<int, string>
     */
    protected $hidden = [
        'metadata_file_path',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
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
     * @var array<string, string>
     */
    protected $attributes = [
        'only_annotation_labels' => '[]',
        'only_file_labels' => '[]',
        'label_map' => '[]',
        'user_map' => '[]',
    ];

    protected static function booted(): void
    {
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

    /**
     * {@inheritdoc}
     */
    public function getMetadataFileDisk(): string
    {
        return config('volumes.pending_metadata_storage_disk');
    }
}
