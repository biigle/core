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

        $columns = array_shift($value);

        $filenames = [];
        foreach ($value as $index => $row) {
            $combined = array_combine($columns, $row);
            $combined = array_filter($combined);
            $filename = $combined['filename'];
            if (array_key_exists($filename, $filenames)) {
                // If this exists, it was already checked if it is a valid date by the
                // parent method.
                if (!array_key_exists('taken_at', $combined)) {
                    // +1 since index starts at 0.
                    // +1 since column description row was removed above.
                    $line = $index + 2;

                    $this->message = "File {$filename} has multiple entries but no 'taken_at' at line {$line}.";

                    return false;
                }
            } else {
                $filenames[$filename] = true;
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
