# BIIGLE Videos Module

Create, edit and explore video annotations.

## Installation

```bash
composer config repositories.videos vcs https://github.com/biigle/videos
composer require biigle/videos
```

1. Add `Biigle\Modules\Video\VideoServiceProvider::class` to the `providers` array in `config/app.php`.
2. Run `php artisan videos:publish` to refresh the public assets of this package. Do this for every update of the package.
3. Run `php artisan migrate` to create the new database tables.
