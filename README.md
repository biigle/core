# DIAS

DISCOL Image Annotation Software

## Requirements

- PHP 5.4+
- PHP command line interface (`php5-cli`)
- PHP mcrypt extension (`php5-mcrypt`)
- PHP JSON extension (`php5-json`)
- PHP PGSQL extension (`php5-pgsql`)
- PHP Fileinfo extension
- PHP EXIF extension

- PHP GD Library (>=2.0) (`php5-gd`)
- PostgreSQL
- (Git)

And for development/testing:

- PHP cURL extension (`php5-curl`)
- PHP SQLite extension (`php5-sqlite`)

- Node.js
- gulp-cli
- karma-cli
- PhantomJS

- SQLite

## Installation

1. Clone this repository.
2. Run `composer install` ([get composer](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-osx)).
4. Copy `.env.example` to `.env` and populate it with your database credentials. Then run `php artisan key:generate` to generate an encryption key.
5. Set up the database tables with `php artisan migrate`.
6. Run a local development server with `php artisan serve`. Alternatively you can use `php -S localhost:8000 -t public/` to mimic a production server.

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

Set up the task scheduler by creating a cron job that calls `php artisan schedule:run` in the application root every minute.
