<?php

if (!function_exists('cachebust_asset')) {
    /**
     * Generate an asset path with a cachbusting query string for the application.
     *
     * @param  string  $path
     * @param  bool    $secure
     * @return string
     */
    function cachebust_asset($path, $secure = null)
    {
        $publicPath = public_path($path);
        if (file_exists($publicPath)) {
            $path .= '?'.filemtime($publicPath);
        }

        return asset($path, $secure);
    }
}

if (!function_exists('readable_number')) {
    /**
     * Shorten a large number to a readable size, e.g. 154222 => 154k.
     *
     * @param  int|float  $n
     * @return string
     */
    function readable_number($n)
    {
        $divisor = 1.0;
        $suffix = '';

        foreach (['', 'k', 'M', 'G', 'T'] as $s) {
            $nextDivisor = $divisor * 1000.0;
            if ($n < $nextDivisor) {
                $suffix = $s;
                break;
            }

            $divisor = $nextDivisor;
        }

        return round($n / $divisor).$suffix;
    }
}

if (!function_exists('fragment_uuid_path')) {
    /**
     * Fragment a UUID beginning with "abcdef..."" to "ab/cd/abcdef...".
     *
     * @param  string $uuid
     * @return string
     */
    function fragment_uuid_path($uuid)
    {
        return "{$uuid[0]}{$uuid[1]}/{$uuid[2]}{$uuid[3]}/{$uuid}";
    }
}

if (!function_exists('thumbnail_url')) {
    /**
     * Assemble the public URL to an image thumbnail.
     *
     * @param  string $uuid
     * @param string $disk
     * @param string $format
     * @return string
     */
    function thumbnail_url($uuid = null, $disk = null, $format = null)
    {
        if (is_null($format)) {
            $format = config('thumbnails.format');
        }

        if (is_null($disk)) {
            $disk = config('thumbnails.storage_disk');
        }

        if (is_null($uuid)) {
            return Storage::disk($disk)->url('');
        } elseif (strpos($uuid, ':') !== 0) {
            // If the uuid starts with a : it is a template string and should not be
            // fragmented.
            $uuid = fragment_uuid_path($uuid);
        }

        return Storage::disk($disk)->url("{$uuid}.{$format}");
    }
}
