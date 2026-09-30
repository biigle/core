<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[WithoutTimestamps]
class LabelTreeVersion extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'label_tree_id' => 'int',
        ];
    }

    /**
     * The "master" label tree of this version.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<LabelTree, $this>
     */
    public function labelTree()
    {
        return $this->belongsTo(LabelTree::class);
    }

    /**
     * Set the doi attribute of this version.
     */
    public function setDoiAttribute(?string $value)
    {
        if (is_string($value)) {
            $value = preg_replace('/^https?\:\/\/doi\.org\//', '', $value);
        }

        $this->attributes['doi'] = $value;
    }
}
