# BIIGLE Videos Module

[![Test status](https://github.com/biigle/videos/workflows/Tests/badge.svg)](https://github.com/biigle/videos/actions?query=workflow%3ATests)

This is the BIIGLE module to create, edit and explore video annotations.

## Installation

1. Run `composer require biigle/videos`.
2. Add `Biigle\Modules\Videos\VideosServiceProvider::class` to the `providers` array in `config/app.php`.
3. Run `php artisan vendor:publish --tag=public` to publish the public assets of this module.
4. Run `docker-compose exec app php artisan migrate` to create the new database tables.
5. Run `pip install -r requirements.txt` to install the Python requirements.
6. Install `ffmpeg`.
7. Configure a storage disk for the video thumbnails and set the `VIDEOS_THUMBNAIL_STORAGE_DISK` variable to the name of this storage disk in the `.env` file. The content of the storage disk should be publicly accessible. Example for a local disk:
    ```php
    'video-thumbs' => [
        'driver' => 'local',
        'root' => storage_path('app/public/video-thumbs'),
        'url' => env('APP_URL').'/storage/video-thumbs',
        'visibility' => 'public',
    ],
    ```
    This requires the link `storage -> ../storage/app/public` in the `public` directory.

## References

Reference publications that you should cite if you use video object tracking for one of your studies.

- **BIIGLE 2.0**
    [Langenkämper, D., Zurowietz, M., Schoening, T., & Nattkemper, T. W. (2017). Biigle 2.0-browsing and annotating large marine image collections.](https://doi.org/10.3389/fmars.2017.00083)
    Frontiers in Marine Science, 4, 83. doi: `10.3389/fmars.2017.00083`

- **Video Object Tracking**
    [Lukezic, A., Vojir, T., ˇCehovin Zajc, L., Matas, J., & Kristan, M. (2017). Discriminative correlation filter with channel and spatial reliability.](https://doi.org/10.1109/CVPR.2017.515)
    In Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (pp. 6309-6318). doi: `10.1109/CVPR.2017.515`

## Developing

Take a look at the [development guide](https://github.com/biigle/core/blob/master/DEVELOPING.md) of the core repository to get started with the development setup.

Want to develop a new module? Head over to the [biigle/module](https://github.com/biigle/module) template repository.

## Contributions and bug reports

Contributions to BIIGLE are always welcome. Check out the [contribution guide](https://github.com/biigle/core/blob/master/CONTRIBUTING.md) to get started.
