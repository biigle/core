<?php

namespace Biigle;

use Biigle\Traits\HasJsonAttributes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FederatedSearchModel extends Model
{
    use HasJsonAttributes, HasFactory;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'attrs' => 'array',
    ];

    /**
     * Scope a query to all models that represent label trees.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeLabelTrees($query)
    {
        return $query->where('type', LabelTree::class);
    }

    /**
     * Scope a query to all models that represent projects.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeProjects($query)
    {
        return $query->where('type', Project::class);
    }

    /**
     * Scope a query to all models that represent volumes.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeVolumes($query)
    {
        return $query->where('type', Volume::class);
    }

    /**
     * The instance, this model belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Feder
     * , FederatedSearchModel>
     */
    public function instance()
    {
        return $this->belongsTo(FederatedSearchInstance::class, 'federated_search_instance_id');
    }

    /**
     * The users who can access this model.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<User>
     */
    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    /**
     * Set the model thumbnail url attribute.
     *
     * @param string $value
     */
    public function setThumbnailUrlAttribute(string $value)
    {
        return $this->setJsonAttr('thumbnailUrl', $value);
    }

    /**
     * Get the model thumbnail url attribute.
     *
     * @return array
     */
    public function getThumbnailUrlAttribute()
    {
        return $this->getJsonAttr('thumbnailUrl');
    }

    /**
     * Set the model thumbnail urls attribute.
     *
     * @param array $value
     */
    public function setThumbnailUrlsAttribute(array $value)
    {
        return $this->setJsonAttr('thumbnailUrls', $value);
    }

    /**
     * Get the model thumbnail url attribute.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getThumbnailUrlsAttribute()
    {
        return collect($this->getJsonAttr('thumbnailUrls', []));
    }
}
