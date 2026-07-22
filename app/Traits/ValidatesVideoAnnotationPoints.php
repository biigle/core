<?php

namespace Biigle\Traits;

use Biigle\Services\VideoAnnotationValidation;
use Biigle\Shape;
use Exception;

trait ValidatesVideoAnnotationPoints
{
    /**
     * Validate the points and frames of this video annotation.
     *
     * @param array $points Not used
     * @throws Exception If the points or frames are invalid.
     */
    public function validatePoints(array $points = []): void
    {
        if ($this->shape_id === Shape::wholeFrameId()) {
            if (count($this->points) !== 0) {
                throw new Exception('Whole frame annotations cannot have point coordinates.');
            }

            return;
        }

        // Use a local variable because the attribute may be resolved by a magic getter.
        $points = $this->points;

        // The structure is checked first because checkGaps() expects an array of arrays.
        // This method is also called with points that were not validated by a form
        // request.
        $message = VideoAnnotationValidation::checkPoints($points)
            ?? VideoAnnotationValidation::checkGaps($points, $this->frames);

        if (!is_null($message)) {
            throw new Exception($message);
        }

        foreach ($points as $point) {
            // Gaps have no coordinates that could be validated.
            if (!empty($point)) {
                parent::validatePoints($point);
            }
        }
    }
}
