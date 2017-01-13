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
