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
     * Shorten a large number to a readable size, e.g. 154222 => 154k
     *
     * @param  number  $n
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
