# BIIGLE Videos Module

Create, edit and explore video annotations.

## Installation

```bash
composer config repositories.videos vcs https://github.com/biigle/videos
composer require biigle/videos
```

Take a look at the [`requirements.txt`](requirements.txt) for the Python dependencies of this module. Install the requirements with `pip install -r requirements.txt`.

1. Add `Biigle\Modules\Video\VideoServiceProvider::class` to the `providers` array in `config/app.php`.
2. Run `php artisan videos:publish` to refresh the public assets of this package. Do this for every update of the package.
3. Run `php artisan migrate` to create the new database tables.
