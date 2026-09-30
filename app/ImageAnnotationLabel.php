<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Attributes\Hidden;

/**
 * Pivot object for the connection between ImageAnnotation and Label.
 */
#[Hidden(['created_at', 'updated_at'])]
class ImageAnnotationLabel extends AnnotationLabel
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'int',
            'annotation_id' => 'int',
            'confidence' => 'float',
        ];
    }

    /**
     * The annotation, this annotation label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<ImageAnnotation, $this>
     */
    public function annotation()
    {
        return $this->belongsTo(ImageAnnotation::class, 'annotation_id');
    }
}
