<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabelTreeVersion extends Model
{
    use HasFactory;

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

    /**
     * Set the doi attribute of this version.
     *
     * @param string $value
     */
    public function setDoiAttribute($value)
    {
        if (is_string($value)) {
            $value = preg_replace('/^https?\:\/\/doi\.org\//', '', $value);
        }

        $this->attributes['doi'] = $value;
    }
}
