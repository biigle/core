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
     * @var list<string>
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
        'attrs',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var list<string>
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
        'attrs' => 'array',
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

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<Volume, $this>
     */
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

    /**
     * Available annotation tools for image volumes.
     */
    const IMAGE_ANNOTATION_TOOLS = [
        'point', 'rectangle', 'circle', 'ellipse', 'linestring', 'measure',
        'polygon', 'polygonbrush', 'polygonEraser', 'polygonFill', 'magicwand'
    ];

    /**
     * Available annotation tools for video volumes.
     */
    const VIDEO_ANNOTATION_TOOLS = [
        'point', 'rectangle', 'circle', 'linestring', 'polygon', 'polygonbrush', 'polygonEraser', 'polygonFill', 'wholeframe'
    ];

    /**
     * All available annotation tools (for backward compatibility).
     */
    const ANNOTATION_TOOLS = [
        'point', 'rectangle', 'circle', 'ellipse', 'linestring', 'measure',
        'polygon', 'polygonbrush', 'polygonEraser', 'polygonFill', 'magicwand', 'wholeframe'
    ];

    /**
     * Get the enabled annotation tools for this pending volume.
     *
     * @return array
     */
    public function enabledAnnotationTools()
    {
        $defaultTools = $this->isImageVolume() ? static::IMAGE_ANNOTATION_TOOLS : static::VIDEO_ANNOTATION_TOOLS;
        return $this->getJsonAttr('enabled_annotation_tools', $defaultTools);
    }

    /**
     * Check if this is an image volume.
     *
     * @return bool
     */
    public function isImageVolume()
    {
        return $this->media_type_id === \Biigle\MediaType::imageId();
    }

    /**
     * Check if this is a video volume.
     *
     * @return bool
     */
    public function isVideoVolume()
    {
        return $this->media_type_id === \Biigle\MediaType::videoId();
    }

    /**
     * Set the enabled annotation tools for this pending volume.
     *
     * @param array $tools
     */
    public function setEnabledAnnotationTools($tools)
    {
        $this->setJsonAttr('enabled_annotation_tools', $tools);
    }

    /**
     * Get a JSON attribute.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    protected function getJsonAttr($key, $default = null)
    {
        $attrs = $this->attrs ?: [];
        return array_key_exists($key, $attrs) ? $attrs[$key] : $default;
    }

    /**
     * Set a JSON attribute.
     *
     * @param string $key
     * @param mixed $value
     */
    protected function setJsonAttr($key, $value)
    {
        $attrs = $this->attrs ?: [];
        $attrs[$key] = $value;
        $this->attrs = $attrs;
    }
}
