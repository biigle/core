# BIIGLE Videos Module

Create, edit and explore video annotations.

## Installation

```bash
composer config repositories.videos vcs https://github.com/biigle/videos
composer require biigle/videos
```

Take a look at the [`requirements.txt`](requirements.txt) for the Python dependencies of this module. Install the requirements with `pip install -r requirements.txt`. In addition to that, `ffmpeg` needs to be installed.

1. Add `Biigle\Modules\Video\VideoServiceProvider::class` to the `providers` array in `config/app.php`.
2. Run `php artisan videos:publish` to refresh the public assets of this package. Do this for every update of the package.
3. Run `php artisan migrate` to create the new database tables.
4. Configure a storage disk for the video thumbnails and set the `VIDEOS_THUMBNAIL_STORAGE_DISK` variable to the name of this storage disk in the `.env` file. The content of the storage disk should be publicly accessible. Example for a local disk:
    ```php
    'video-thumbs' => [
        'driver' => 'local',
        'root' => storage_path('app/public/video-thumbs'),
        'url' => env('APP_URL').'/storage/video-thumbs',
        'visibility' => 'public',
    ],
    ```
    This requires the link `storage -> ../storage/app/public` in the `public` directory.
