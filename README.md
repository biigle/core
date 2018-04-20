# Biigle Largo Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "https://github.com/BiodataMiningGroup/biigle-largo.git"
}
```

1. Run `php composer.phar require biigle/largo`.
2. Run `php artisan vendor:publish --tag=public` to refresh the public assets of this package. Do this for every update of the package.
3. Create a directory `storage/largo_patches` which is read-/writable for the application. To change the path, run `php artisan largo:config` and edit `patch_storage` in `config/largo.php`.
