# BIIGLE Videos Module

This is the BIIGLE module to create, edit and explore video annotations.

## Installation

1. Run `composer config repositories.videos vcs git@github.com:biigle/videos.git`
2. Run `composer require biigle/videos`.
3. Add `Biigle\Modules\Videos\VideosServiceProvider::class` to the `providers` array in `config/app.php`.
4. Run `php artisan vendor:publish --tag=public` to publish the public assets of this module.
5. Run `docker-compose exec app php artisan migrate` to create the new database tables.
6. Run `pip install -r requirements.txt` to install the Python requirements.
7. Install `ffmpeg`.
8. Configure a storage disk for the video thumbnails and set the `VIDEOS_THUMBNAIL_STORAGE_DISK` variable to the name of this storage disk in the `.env` file. The content of the storage disk should be publicly accessible. Example for a local disk:
    ```php
    'video-thumbs' => [
        'driver' => 'local',
        'root' => storage_path('app/public/video-thumbs'),
        'url' => env('APP_URL').'/storage/video-thumbs',
        'visibility' => 'public',
    ],
    ```
    This requires the link `storage -> ../storage/app/public` in the `public` directory.

## Developing

Take a look at the [development guide](https://github.com/biigle/core/blob/master/DEVELOPING.md) of the core repository to get started with the development setup.

Want to develop a new module? Head over to the [biigle/module](https://github.com/biigle/module) template repository.

## Contributions and bug reports

Contributions to BIIGLE are always welcome. Check out the [contribution guide](https://github.com/biigle/core/blob/master/CONTRIBUTING.md) to get started.
