<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Pivot object for the connection between VolumeFiles and Labels.
 *
 * @property int $id
 * @property int $user_id
 * @property int $label_id
 */
abstract class VolumeFileLabel extends Model
{
    use HasFactory;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_id' => 'int',
        'label_id' => 'int',
    ];

    /**
     * The file, this volume file label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<covariant VolumeFile, covariant VolumeFileLabel>
     */
    abstract public function file();

    /**
     * The label, this video label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Label, covariant VolumeFileLabel>
     */
    public function label()
    {
        return $this->belongsTo(Label::class);
    }

    /**
     * The user who created this video label.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, covariant VolumeFileLabel>
     */
    public function user()
    {
        return $this->belongsTo(User::class)
            ->select('id', 'firstname', 'lastname', 'role_id');
    }

    /**
     * Get the file ID attribute.
     *
     * @return int
     */
    abstract public function getFileIdAttribute();
}
