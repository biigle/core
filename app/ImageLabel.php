<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Model;

/**
 * Pivot object for the connection between Images and Labels.
 */
class ImageLabel extends Model
{
    /**
     * The image, this image label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function image()
    {
        return $this->belongsTo(Image::class);
    }

    /**
     * The label, this image label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function label()
    {
        return $this->belongsTo(Label::class);
    }

    /**
     * The project volume of this image label.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function projectVolume()
    {
        return $this->belongsTo(ProjectVolume::class);
    }

    /**
     * The user who created this image label.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class)
            ->select('id', 'firstname', 'lastname', 'role_id');
    }
}
