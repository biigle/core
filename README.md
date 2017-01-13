# BIIGLE Volumes Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "git@github.com:BiodataMiningGroup/biigle-volumes.git"
}
```

1. Run `php composer.phar require biigle/volumes`.
2. Add `'Biigle\Modules\Volumes\VolumesServiceProvider'` to the `providers` array in `config/app.php`.
3. Run `php artisan volumes:publish` to refresh the public assets of this package. Do this for every update of the package.
