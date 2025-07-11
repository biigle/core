<?php

namespace Biigle;

use Biigle\Traits\HasJsonAttributes;
use Biigle\Traits\HasMetadataFile;
use Cache;
use Carbon\Carbon;
use DB;
use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A volume is a collection of images. Volumes belong to one or many
 * projects.
 */
class Volume extends Model
{
    use HasJsonAttributes, HasFactory, HasMetadataFile;

    /**
     * Regular expression that matches the supported image file extensions.
     * This regex allows optional HTTP query parameters after the file names, too.
     * Example "image.jpg?raw=1".
     * This may be required for remote images with services like Dropbox.
     *
     * @var string
     */
    const IMAGE_FILE_REGEX = '/\.(jpe?g|png|tif?f|webp)(\?.+)?$/i';

    /**
     * Regular expression that matches the supported video file extensions.
     * This regex allows optional HTTP query parameters after the file names, too.
     * Example "video.mp4?raw=1".
     * This may be required for remote files with services like Dropbox.
     *
     * @var string
     */
    const VIDEO_FILE_REGEX = '/\.(mpe?g|mp4|webm|mov)(\?.+)?$/i';

    /**
     * Available annotation tools.
     *
     * @var array
     */
    const ANNOTATION_TOOLS = [
        'point',
        'rectangle',
        'circle',
        'ellipse',
        'linestring',
        'measure',
        'polygon',
        'polygonbrush',
        'polygonEraser',
        'polygonFill',
        'magicwand',
    ];

    /**
     * Media type for an image volume.
     *
     * @var int
     */
    const IMAGE_VOLUME = 1;

    /**
     * Media type for a video volume.
     *
     * @var int
     */
    const VIDEO_VOLUME = 2;

    /**
     * The metadata file attribute name.
     *
     * @var string
     */
    const FILE_ATTRIBUTE = 'metadata';

    /**
     * The export area attribute name.
     *
     * @var string
     */
    const EXPORT_AREA_ATTRIBUTE = 'export_area';

    /**
     * The enabled annotation tools attribute name.
     *
     * @var string
     */
    const ENABLED_ANNOTATION_TOOLS_ATTRIBUTE = 'enabled_annotation_tools';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'url',
        'media_type_id',
        'handle',
        'creator_id',
        'metadata_file_path',
        'metadata_parser',
    ];

    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var list<string>
     */
    protected $hidden = [
        'pivot',
        'attrs',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'attrs' => 'array',
        'media_type_id' => 'int',
    ];

    /**
     * Parses a comma separated list of filenames to an array.
     *
     * @param string $string
     *
     * @return array
     */
    public static function parseFilesQueryString(string $string)
    {
        // Remove whitespace as well as enclosing '' or "".
        return preg_split('/[\"\'\s]*,[\"\'\s]*/', trim($string, " \t\n\r\0\x0B'\""), 0, PREG_SPLIT_NO_EMPTY);
    }

    /**
     * Scope a query to all volumes that are accessible by a user.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param User $user
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeAccessibleBy($query, User $user)
    {
        if ($user->can('sudo')) {
            return $query;
        }

        return $query->whereIn('id', fn ($query) => $query->select('project_volume.volume_id')
            ->from('project_volume')
            ->join('project_user', 'project_user.project_id', '=', 'project_volume.project_id')
            ->where('project_user.user_id', $user->id)
            ->distinct());
    }

    /**
     * The user that created the volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this>
     */
    public function creator()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The media type of this volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<MediaType, $this>
     */
    public function mediaType()
    {
        return $this->belongsTo(MediaType::class);
    }

    /**
     * The images belonging to this volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Image, $this>
     */
    public function images()
    {
        return $this->hasMany(Image::class);
    }

    /**
     * The videos belonging to this volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Video, $this>
     */
    public function videos()
    {
        return $this->hasMany(Video::class);
    }

    /**
     * The images or videos belonging to this volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<covariant VolumeFile, $this>
     */
    public function files()
    {
        if ($this->isImageVolume()) {
            return $this->images();
        }

        return $this->videos();
    }

    /**
     * The images belonging to this volume ordered by filename (ascending).
     *
     * @deprecated Use `orderedFiles` instead.
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<covariant VolumeFile, $this>
     */
    public function orderedImages()
    {
        return $this->orderedFiles();
    }

    /**
     * The images belonging to this volume ordered by filename (ascending).
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<covariant VolumeFile, $this>
     */
    public function orderedFiles()
    {
        return $this->files()->orderBy('filename', 'asc');
    }

    /**
     * Return a query for all users associated to this volume through projects.
     *
     * @return  \Illuminate\Database\Eloquent\Builder
     */
    public function users()
    {
        return User::whereIn('id', function ($query) {
            $query->select('user_id')
                ->distinct()
                ->from('project_user')
                ->whereIn('project_id', function ($query) {
                    $query->select('project_id')
                        ->from('project_volume')
                        ->where('volume_id', $this->id);
                });
        });
    }

    /**
     * The project(s), this volume belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Project, $this>
     */
    public function projects()
    {
        return $this->belongsToMany(Project::class);
    }

    /**
     * The annotation sessions of this volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<AnnotationSession, $this>
     */
    public function annotationSessions()
    {
        return $this->hasMany(AnnotationSession::class)->with('users');
    }

    /**
     * The active annotation sessions of this volume (if any).
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<AnnotationSession, $this>
     */
    public function activeAnnotationSession()
    {
        $now = Carbon::now();

        return $this->hasOne(AnnotationSession::class)
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>', $now)
            ->limit(1);
    }

    /**
     * Returns the active annotation session of this volume for the given user.
     *
     * An annotation session may be active for a volume but it is only also active for
     * a user, if the user belongs to the set of restricted users of the annotation
     * session.
     *
     * @param User $user
     * @return AnnotationSession|null
     */
    public function getActiveAnnotationSession(User $user)
    {
        return $this->activeAnnotationSession()
            ->whereExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                    ->from('annotation_session_user')
                    ->where('annotation_session_user.user_id', $user->id)
                    ->whereRaw('annotation_session_user.annotation_session_id = annotation_sessions.id');
            })->first();
    }

    /**
     * Check if the given annotation session is in conflict with existing ones.
     *
     * A conflict exists if the active time period of two sessions overlaps.
     *
     * @param AnnotationSession $session The annotation session to check
     *
     * @return bool
     */
    public function hasConflictingAnnotationSession(AnnotationSession $session)
    {
        return $this->annotationSessions()
            ->when($session->id, fn ($query) => $query->where('id', '!=', $session->id))
            ->where(function ($query) use ($session) {
                $query->where(function ($query) use ($session) {
                    $query->where('starts_at', '<=', $session->starts_at)
                        ->where('ends_at', '>', $session->starts_at);
                });
                $query->orWhere(function ($query) use ($session) {
                    // ends_at is exclusive so it may equal starts_at of another session
                    $query->where('starts_at', '<', $session->ends_at)
                        ->where('ends_at', '>=', $session->ends_at);
                });
                $query->orWhere(function ($query) use ($session) {
                    $query->where('starts_at', '>=', $session->starts_at)
                        ->where('ends_at', '<=', $session->ends_at);
                });
            })
            ->exists();
    }

    /**
     * Check if the images of this volume come from a remote URL.
     *
     * @return bool
     */
    public function isRemote()
    {
        return strpos($this->url, 'http') === 0;
    }

    /**
     * An image that can be used as unique thumbnail for this volume.
     *
     * @return Image|null
     */
    public function getThumbnailAttribute()
    {
        $thumbnails = $this->thumbnails;

        return $thumbnails->get(intdiv($thumbnails->count() - 1, 2));
    }

    /**
     * URL to the thumbnail image of this volume.
     *
     * @return string|null
     */
    public function getThumbnailUrlAttribute()
    {
        return $this->thumbnail ? $this->thumbnail->thumbnailUrl : null;
    }

    /**
     * Several images or videos that can be used for the preview thumbnail of a volume.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getThumbnailsAttribute()
    {
        // We can cache this for 1 hour because it's unlikely to change as long as the
        // volume exists.
        return Cache::remember($this->getThumbnailsCacheKey(), 3600, function () {
            $number = 10;
            $total = $this->files()->count();
            $query = $this->orderedFiles();
            $step = intdiv($total, $number);

            return $this->orderedFiles()
                ->when($step > 1, function ($query) use ($step) {
                    $query->whereRaw("(id % {$step}) = 0");
                })
                ->limit($number)
                ->get();
        });
    }

    /**
     * URLs to the thumbnail images of this volume.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getThumbnailsUrlAttribute()
    {
        return $this->thumbnails->map(fn ($file) => $file->thumbnailUrl);
    }

    /**
     * Flush the cache that stores the volume thumbnail.
     */
    public function flushThumbnailCache()
    {
        Cache::forget($this->getThumbnailsCacheKey());
    }

    /**
     * Check if the volume has some images with GPS coordinates.
     *
     * @return bool
     */
    public function hasGeoInfo()
    {
        return Cache::remember($this->getGeoInfoCacheKey(), 3600, fn () => $this->images()->whereNotNull('lng')->whereNotNull('lat')->exists());
    }

    /**
     * Flush the cached information if this volume has images with GPS coordinates.
     */
    public function flushGeoInfoCache()
    {
        Cache::forget($this->getGeoInfoCacheKey());
        $this->projects->each(function ($p) {
            $p->flushGeoInfoCache();
        });
    }

    /**
     * Set the url attribute of this volume.
     */
    public function setUrlAttribute(?string $value)
    {
        // Do not trim the slashes defining the protocol/storage disk.
        if (is_string($value) && !str_ends_with($value, '://')) {
            $value = rtrim($value, '/');
        }

        return $this->attributes['url'] = $value;
    }

    /**
     * Set the creating_async attribute of this volume.
     *
     * @param bool $value
     */
    public function setCreatingAsyncAttribute($value)
    {
        $value = $value === false ? null : $value;

        return $this->setJsonAttr('creating_async', $value);
    }

    /**
     * Get the creating_async attribute of this volume.
     *
     * @return bool
     */
    public function getCreatingAsyncAttribute()
    {
        return (bool) $this->getJsonAttr('creating_async', false);
    }

    /**
     * Return the dynamic attribute for the export area.
     *
     * @return ?array
     */
    public function getExportAreaAttribute()
    {
        return $this->getJsonAttr('export_area');
    }

    /**
     * Set or update the dynamic attribute for the export area.
     */
    public function setExportAreaAttribute(?array $value)
    {
        if ($value !== null) {
            if (sizeof($value) !== 4) {
                throw new Exception('Malformed export area coordinates!');
            }

            foreach ($value as $coordinate) {
                if (!is_int($coordinate)) {
                    throw new Exception('Malformed export area coordinates!');
                }
            }
        }

        $this->setJsonAttr('export_area', $value);
    }

    /**
     * Check if the there are tiled images in this volume.
     *
     * @return bool
     */
    public function hasTiledImages()
    {
        // Cache this for a single request because it may be called lots of times.
        return Cache::store('array')->remember("volume-{$this->id}-has-tiled", 60, fn () => $this->images()->where('tiled', true)->exists());
    }

    /**
     * Specifies whether the volume is an image volume.
     *
     * @return boolean
     */
    public function isImageVolume()
    {
        return $this->media_type_id === MediaType::imageId();
    }

    /**
     * Specifies whether the volume is a video volume.
     *
     * @return boolean
     */
    public function isVideoVolume()
    {
        return $this->media_type_id === MediaType::videoId();
    }

    /**
     * {@inheritdoc}
     */
    public function getMetadataFileDisk(): string
    {
        return config('volumes.metadata_storage_disk');
    }

    /**
     * Get the cache key for volume thumbnails.
     *
     * @return string
     */
    protected function getThumbnailsCacheKey()
    {
        return "volume-thumbnails-{$this->id}";
    }

    /**
     * Get the cache key for volume geo info.
     *
     * @return string
     */
    protected function getGeoInfoCacheKey()
    {
        return "volume-{$this->id}-has-geo-info";
    }

    /**
     * Get the list of enabled annotation tools for this volume.
     * If no specific tools are enabled, all tools are enabled.
     *
     * @return array
     */
    public function enabledAnnotationTools()
    {
        $tools = $this->getJsonAttr(self::ENABLED_ANNOTATION_TOOLS_ATTRIBUTE);
        
        if (empty($tools)) {
            return self::ANNOTATION_TOOLS;
        }
        
        return $tools;
    }

    /**
     * Set the enabled annotation tools for this volume.
     *
     * @param array $tools
     */
    public function setEnabledAnnotationTools($tools)
    {
        $validTools = array_intersect($tools, self::ANNOTATION_TOOLS);
        $this->setJsonAttr(self::ENABLED_ANNOTATION_TOOLS_ATTRIBUTE, $validTools);
    }

    /**
     * Scope a query to all volumes where the file was already processed.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeProcessed($query)
    {
        return $query->whereNotNull('metadata_file_path');
    }
}
