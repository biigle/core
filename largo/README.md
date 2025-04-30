# BIIGLE Largo Module

[![Test status](https://github.com/biigle/largo/workflows/Tests/badge.svg)](https://github.com/biigle/largo/actions?query=workflow%3ATests)

This is the BIIGLE module to review image annotations in a regular grid.

## Installation

This module is already included in [`biigle/biigle`](https://github.com/biigle/biigle).

1. Run `composer require biigle/largo`.
2. Install the Python dependencies with `pip install -r requirements.txt`.
2. Add `Biigle\Modules\Largo\LargoServiceProvider::class` to the `providers` array in `config/app.php`.
3. Run `php artisan vendor:publish --tag=public` to publish the public assets of this module.
4. Configure a storage disk for the Largo annotation patches and set the `LARGO_PATCH_STORAGE_DISK` variable to the name of this storage disk in the `.env` file. The content of the storage disk should be publicly accessible. Example for a local disk:
    ```php
    'largo' => [
        'driver' => 'local',
        'root' => storage_path('app/public/largo-patches'),
        'url' => env('APP_URL').'/storage/largo-patches',
        'visibility' => 'public',
    ],
    ```
    This requires the link `storage -> ../storage/app/public` in the `public` directory.

## Developing

Take a look at the [development guide](https://github.com/biigle/core/blob/master/DEVELOPING.md) of the core repository to get started with the development setup.

Want to develop a new module? Head over to the [biigle/module](https://github.com/biigle/module) template repository.

## Contributions and bug reports

Contributions to BIIGLE are always welcome. Check out the [contribution guide](https://github.com/biigle/core/blob/master/CONTRIBUTING.md) to get started.
