# BIIGLE Synchronization Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "git@github.com:BiodataMiningGroup/biigle-sync.git"
}
```

1. Run `php composer.phar require biigle/sync`.
2. Run `php artisan vendor:publish --tag=public` to refresh the public assets of this package. Do this for every update of the package.
3. Add a daily scheduled command to prune old uploaded import files to `app/Console/Kernel.php`:
   ```php
   $schedule->command('sync:prune')->daily();
   ```
