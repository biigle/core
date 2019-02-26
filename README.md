# Biigle Largo Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "https://github.com/biigle/largo.git"
}
```

1. Run `php composer.phar require biigle/largo`.
2. Add `'Biigle\Modules\Largo\LargoServiceProvider'` to the `providers` array in `config/app.php`.
3. Run `php artisan largo:publish` to refresh the public assets of this package. Do this for every update of the package.
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
