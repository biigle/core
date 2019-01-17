<?php

namespace Biigle\Modules\Videos\Rules;

use Storage;
use Illuminate\Contracts\Validation\Rule;

class VideoUrl implements Rule
{
    /**
     * The validation message to display.
     *
     * @var string
     */
    protected $message;

    /**
     * Allowed video MIME types
     *
     * @var array
     */
    protected $allowedMimes;

    /**
     * Create a new instance.
     */
    public function __construct()
    {
        $this->message = 'The video URL is invalid.';
        $this->allowedMimes = [
            'video/mpeg',
            'video/mp4',
            'video/webm',
        ];
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        return $this->passesDiskUrl($value)
            && $this->passesMimeType($value);
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

    /**
     * Validate a storage disk video URL.
     *
     * @param string $value
     *
     * @return bool
     */
    protected function passesDiskUrl($value)
    {
        $url = explode('://', $value);

        if (count($url) !== 2) {
            $this->message = "Unable to identify storage disk. Please set the URL as '[disk]://[path]'.";

            return false;
        }

        list($disk, $path) = $url;

        if (!config("filesystems.disks.{$disk}")) {
            $this->message = "Storage disk '{$disk}' does not exist.";

            return false;
        }

        if (!Storage::disk($disk)->exists($path)) {
            $this->message = "Unable to access '{$path}'. Does it exist and you have access permissions?";

            return false;
        }

        return true;
    }

    protected function passesMimeType($value)
    {
        list($disk, $path) = explode('://', $value);
        $type = Storage::disk($disk)->mimeType($path);

        if (!in_array($type, $this->allowedMimes)) {
            $this->message = "Videos of type '{$type}' are not supported.";

            return false;
        }

        return true;
    }
}
