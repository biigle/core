<?php

namespace Biigle\Rules;

class VideoMetadata extends ImageMetadata
{
    /**
     * {@inheritdoc}
     */
    public function passes($attribute, $value): bool
    {
        $passes = parent::passes($attribute, $value);

        if (!$passes) {
            return false;
        }

        $fileMetadata = $value->getFiles();

        foreach ($fileMetadata as $file) {
            foreach ($file->getFrames() as $frame) {
                if (!$this->fileMetadataPasses($frame)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return $this->message;
    }
}
