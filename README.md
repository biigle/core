# Dias Ate Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "https://github.com/BiodataMiningGroup/dias-ate.git"
}
```

1. Run `php composer.phar require dias/ate`.
2. Add `'Dias\Modules\Ate\AteServiceProvider'` to the `providers` array in `config/app.php`.
3. Run `php artisan ate:publish` to refresh the public assets of this package. Do this for every update of the package.
4. Create a directory `storage/ate_patches` which is read-/writable for the application. To change the path, run `php artisan ate:config` and edit `patch_storage` in `config/ate.php`.
