# DIAS

DISCOL Image Annotation Software

## Requirements

See [here](http://laravel.com/docs/5.1#installation) for the server requirements of Laravel 5.1.

Additionally:
- PHP JSON extension
- PHP PGSQL extension
- PHP Fileinfo extension
- PHP EXIF extension

- PHP GD Library (>=2.0)
- PostgreSQL

And for development/testing:

- PHP cURL extension
- PHP SQLite extension

- Node.js
- gulp-cli
- karma-cli
- PhantomJS

- SQLite
- Git

## Installation

0. Get [Composer](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-osx)
1. Run `composer create-project dias/core:dev-master --repository='{"type":"vcs","url":"porta.cebitec.uni-bielefeld.de:/vol/biodtmin/git/dias.git"}' dias`. For development you should not remove the VCS history when asked by Composer.
4. Populate the `.env` file with your database credentials.

Now you have two options:

1. Use the Vagrant box with `vagrant up`
2. Directly use your local machine:
    1. Set up the database tables with `php artisan migrate`.
    2. Run a local development server with `php artisan serve`. Alternatively you can use `php -S localhost:8000 -t public/` to mimic a production server.

## Developing

TODO

(`npm install`, Package development, `php artisan tinker`)

Update the documentation with `composer doc`.

## Testing

To run all tests, run `composer test`.

## Deployment

Deployment instructions are not final yet!

Generate minified sources with `gulp --production`.

Make sure `storage/` is writable for the webserver.

Walk through all the `app/config/` files and set the configs:
- `app.php`: url
- `mail.php`: credentials for the mail server
- `session.php`: encrypt, secure?

Don't forget to set the encryption key! You can generate one with `php artisan key:generate`. Make sure you don't generate a new key when you already have things encrypted with the old key!
Maybe set up the route cache? Cache the config?

**Put all sensitive and secret stuff to `.env.php`!** You'll see where the `env()` helper is used in the config files.

The application reqires a cron job for the scheduled commands and a supervised process for the daemon queue worker to run correctly.

### Scheduled Commands

The cron entry needs to look like this:

```
* * * * * php /path/to/artisan schedule:run 1>> /dev/null 2>&1
```

Read more in the [Laravel docs](http://laravel.com/docs/5.1/artisan#scheduling-artisan-commands).


### Deamon Queue Worker

The deamon queue worker is started with the following command:

```
php artisan queue:work --daemon --sleep=5 --tries=3
```

This command needs to be supervised (e.g. with [Supervisor](http://supervisord.org/)) so the queue worker will be restarted if the process should stop running.

Also the queue worker needs to be restarted on every update of the application using the following command:

```
php artisan queue:restart
```

This may be included in a possible future deploy script.

Read more in the [Laravel docs](http://laravel.com/docs/5.1/queues#daemon-queue-worker).
