<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Model;

class LabelTreeVersion extends Model
{
    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'label_tree_id' => 'int',
    ];

    /**
     * The "master" label tree of this version.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function labelTree()
    {
        return $this->belongsTo(LabelTree::class);
    }
}
