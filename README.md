# Dias Transects Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "porta.cebitec.uni-bielefeld.de:/vol/biodtmin/git/dias-transects.git"
}
```

1. Run `php composer.phar require dias/transects:dev-master`.
2. Add `'Dias\Modules\Transects\TransectsServiceProvider'` to the `providers` array in `config/app.php`.
3. Run `php artisan transects:publish` to refresh the public assets of this package. Do this for every update of the package.
