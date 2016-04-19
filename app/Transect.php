<?php

namespace Dias;

use Dias\Contracts\BelongsToProjectContract;
use Dias\Model\ModelWithAttributes;
use Dias\Image;
use Cache;
use Dias\Jobs\GenerateThumbnails;
use Illuminate\Foundation\Bus\DispatchesJobs;

/**
 * A transect is a collection of images. Transects belong to one or many
 * projects.
 */
class Transect extends ModelWithAttributes implements BelongsToProjectContract
{

    use DispatchesJobs;

    /**
     * Validation rules for creating a new transect.
     *
     * @var array
     */
    public static $createRules = [
        'name'          => 'required|max:512',
        'media_type_id' => 'required|exists:media_types,id',
        'url'           => 'required',
        'images'        => 'required',
    ];

    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'pivot',
    ];

    /**
     * The user that created the transect.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function creator()
    {
        return $this->belongsTo('Dias\User');
    }

    /**
     * The media type of this transect.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function mediaType()
    {
        return $this->belongsTo('Dias\MediaType');
    }

    /**
     * Sets the media type of this transect.
     *
     * @param Dias\MediaType $mediaType
     * @return void
     */
    public function setMediaType($mediaType)
    {
        $this->mediaType()->associate($mediaType);
    }

    /**
     * Sets the media type of this transect to the media type with the given ID.
     *
     * @param int $id media type ID
     * @return void
     */
    public function setMediaTypeId($id)
    {
        $type = MediaType::find($id);
        if ($type === null) {
            abort(400, 'The media type "'.$id.'" does not exist!');
        }
        $this->setMediaType($type);
    }

    /**
     * The images belonging to this transect.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function images()
    {
        return $this->hasMany('Dias\Image')->orderBy('id');
    }

    /**
     * Creates the image objects to be associated with this transect.
     *
     * @param array $filenames image filenames at the location of the transect URL
     * @return void
     */
    public function createImages($filenames)
    {
        foreach ($filenames as $filename) {
            $images[] = ['filename' => $filename, 'transect_id' => $this->id];
        }

        Image::insert($images);

        // it's important that this is done *after* all images were added
        // otherwise not all thumbnails will be generated
        $this->dispatch(new GenerateThumbnails($this));
    }

    /**
     * The project(s), this transect belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function projects()
    {
        return $this->belongsToMany('Dias\Project');
    }

    /**
     * {@inheritdoc}
     * @return array
     */
    public function projectIds()
    {
        /*
         * remember project IDs because e.g. this query would be performed for
         * each and every image request, which would result in dozens of
         * calls per *single* page.
         */
        return Cache::remember('transect-'.$this->id.'pids', 0.5, function () {
            return $this->projects()->pluck('id')->all();
        });
    }
}
