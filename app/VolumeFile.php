<?php

namespace Biigle;

use Biigle\FileCache\Contracts\File as FileContract;
use Biigle\Traits\HasJsonAttributes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

abstract class VolumeFile extends Model implements FileContract
{
    use HasJsonAttributes, HasFactory;

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Adds the `url` attribute to the model. The url is the absolute path
     * to the original file.
     *
     * @return string
     */
    public function getUrlAttribute()
    {
        return "{$this->volume->url}/{$this->filename}";
    }

    /**
     * {@inheritdoc}
     */
    public function getUrl()
    {
        return $this->url;
    }

    /**
     * The volume this video belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function volume()
    {
        return $this->belongsTo(Volume::class);
    }

    /**
     * Set the metadata attribute.
     *
     * @param array $value
     */
    public function setMetadataAttribute(?array $value)
    {
        return $this->setJsonAttr('metadata', $value);
    }

    /**
     * Get the metadata attribute.
     *
     * @return array
     */
    public function getMetadataAttribute()
    {
        return $this->getJsonAttr('metadata', []);
    }

    /**
     * Set the width attribute.
     *
     * @param int $value
     */
    public function setWidthAttribute($value)
    {
        $this->setJsonAttr('width', $value);
    }

    /**
     * Get the width attribute.
     *
     * @return int|null
     */
    public function getWidthAttribute()
    {
        return $this->getJsonAttr('width');
    }

    /**
     * Set the height attribute.
     *
     * @param int $value
     */
    public function setHeightAttribute($value)
    {
        $this->setJsonAttr('height', $value);
    }

    /**
     * Get the height attribute.
     *
     * @return int|null
     */
    public function getHeightAttribute()
    {
        return $this->getJsonAttr('height');
    }

    /**
     * Set the size attribute.
     *
     * @param int $value
     */
    public function setSizeAttribute($value)
    {
        $this->setJsonAttr('size', $value);
    }

    /**
     * Get the size attribute.
     *
     * @return int|null
     */
    public function getSizeAttribute()
    {
        return $this->getJsonAttr('size');
    }

    /**
     * Get the mimeType attribute.
     *
     * @return string
     */
    public function getMimeTypeAttribute()
    {
        return $this->getJsonAttr('mimetype');
    }

    /**
     * Set the mimeType attribute.
     *
     * @param string $value
     */
    public function setMimeTypeAttribute($value)
    {
        $this->setJsonAttr('mimetype', $value);
    }

    /**
     * URL to the thumbnail of this file.
     *
     * @return string
     */
    abstract public function getThumbnailUrlAttribute();

    /**
     * The labels, this volume file got attached by the users.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    abstract public function labels();

    /**
     * The annotations that belong to this file.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    abstract public function annotations();
}
