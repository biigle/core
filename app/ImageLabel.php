<?php

namespace Dias;

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
        return $this->belongsTo('Dias\Image');
    }

    /**
     * The label, this image label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function label()
    {
        return $this->belongsTo('Dias\Label');
    }

    /**
     * The user who created this image label.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo('Dias\User')
            ->select('id', 'firstname', 'lastname', 'role_id');
    }
}
