# BIIGLE Sync Module

[![Test status](https://github.com/biigle/sync/workflows/Tests/badge.svg)](https://github.com/biigle/sync/actions?query=workflow%3ATests)

This is the BIIGLE module to transfer data between application instances.

## Installation

This module is already included in [`biigle/biigle`](https://github.com/biigle/biigle).

1. Run `composer require biigle/sync`.
2. Add `Biigle\Modules\Sync\SyncServiceProvider::class` to the `providers` array in `config/app.php`.
3. Run `php artisan vendor:publish --tag=public` to publish the public assets of this module.
4. Configure a storage disk for the uploaded import files and set the `SYNC_IMPORT_STORAGE_DISK` variable to the name of this storage disk in the `.env` file. Example for a local disk:
    ```php
    'imports' => [
        'driver' => 'local',
        'root' => storage_path('imports'),
    ],
    ```
5. Add a daily scheduled command to prune old uploaded import files to `app/Console/Kernel.php`:
   ```php
   $schedule->command('sync:prune')->daily();
   ```

## Developing

Take a look at the [development guide](https://github.com/biigle/core/blob/master/DEVELOPING.md) of the core repository to get started with the development setup.

Want to develop a new module? Head over to the [biigle/module](https://github.com/biigle/module) template repository.

## Contributions and bug reports

Contributions to BIIGLE are always welcome. Check out the [contribution guide](https://github.com/biigle/core/blob/master/CONTRIBUTING.md) to get started.
