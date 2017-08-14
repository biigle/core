# BIIGLE

BioImage Indexing, Graphical Labeling and Exploration

## Requirements

See [here](https://laravel.com/docs/5.4#installation) for the server requirements of Laravel 5.4.

Additionally:

- PHP JSON extension
- PHP PGSQL extension
- PHP Fileinfo extension
- PHP EXIF extension
- PHP vips extension
- PostgreSQL
- Git

And for development/testing:

- PHP cURL extension
- PHP SQLite extension
- Node.js
- gulp-cli
- karma-cli
- PhantomJS
- SQLite


## Installation

### For Production

The recommended setup for production is a clone of the biigle/core repository. This way you can update the application with a simple `git pull`.

BIIGLE uses [Composer](https://getcomposer.org) for package management. If you use the `composer.phar` archive, substitute all following `composer` commands with `php composer.phar`.

First, set up the project in the current directory:

```
composer create-project biigle/core --repository='{"type":"vcs","url":"git@github.com:BiodataMiningGroup/biigle-core.git"}' --keep-vcs .
```

This will clone the biigle/core repository and install all required packages. Now you have to configure the application environment in the `.env` file. The `.env` file contains all sensitive information like the database credentials or the application encryption key. The file is not tracked by Git and should never be publicly accessible.

We recommend to use PostgreSQL as a DBMS but MySQL or SQLite should work fine as well.

To check if everything was set up correctly you can run `php vendor/bin/phpunit` (but don't do this once the application is in production).

Next, run `php artisan migrate` to set up the database tables.

The document / web root of the web server must point to the `public` directory. Never make anything outside of the `public` directory accessible through the web!
Make sure that the web server user has write permissions in the `storage` directory and any of its subdirectories as well as the `bootstrap/cache` directory.

Now set up a cronjob (`crontab -e`) for the task scheduler:

```
* * * * * php /path/to/biigle/application/artisan schedule:run >> /dev/null 2>&1
```

Finally, you have to configure a supervised process for the queue worker daemon. The worker runs in parallel to the web server and is used for longer running tasks that should not be handled during a single request. The recommended setup for a supervised process is to use [Supervisor](http://supervisord.org/) but you can use any equivalent service as well. A supervisor configuration might look like this:

```
[program:biigle-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/biigle/application/artisan queue:work --sleep=5 --tries=3 --timeout=0
autostart=true
autorestart=true
user=webserver-user
numprocs=1
redirect_stderr=true
stdout_logfile=/path/to/biigle/application/storage/logs/worker.log
```

Substitute `/path/to/biigle/application` with the absolute path to the biigle application directory and `webserver-user` with the name of the webserver user. If usage and load of your BIIGLE instance increases, you may increase `numprocs` to run multiple worker processes.

Read more about workers in the [Laravel docs](https://laravel.com/docs/5.4/queues#supervisor-configuration).

Congratulations, your personal BIIGLE instance is ready to run. You may use the `php artisan user:new` command to create the first user. Now you probably want to continue by installing some BIIGLE modules.


### For Development

To develop BIIGLE on your local machine you may use a Vagrant virtual machine. This way you don't need to install any of the requirements listed above (except of PHP and Git) and keep your development environment clearly separated from your regular OS. First, install [Vagrant](https://www.vagrantup.com/) and a VM provider like [VirtualBox](https://www.virtualbox.org/).

Set up the project in the current directory:

```
composer create-project biigle/core --repository='{"type":"vcs","url":"git@github.com:BiodataMiningGroup/biigle-core.git"}' --keep-vcs --ignore-platform-reqs .
```

Note the `--ignore-platform-reqs` flag to keep Composer from complaining about missing requirements. These requirements will be met by the virtual machine.

Now you can run `vagrant up` to create and boot your virtual machine for development. The BIIGLE application is now running at `http://localhost:8000`. Access the virtual machine with `vagrant ssh`. Stop the virtual machine with `vagrant halt`. Delete the virtual machine with `vagrant destroy`.

You will find the application directory in `/home/vagrant/biigle` in the virtual machine. Any changes you make there in the virtual machine will be reflected on your host machine and vice versa.

For BIIGLE module development you should install the modules with the `--prefer-source` flag to keep Composer from deleting the VCS files (eg `.git`). Example:

```
composer require --prefer-source biigle/projects
```

## Updating

To update the application, first set it to maintenance mode:

```
php artisan down
```

Now users can't access the application and the worker processes will pause.

Before doing anything with the database (e.g. applying new migrations), we recommend you to make a backup. For PostgreSQL it might look like this:

```
pg_dump -h localhost -U biigle_user -d biigle_db > biigle_db.dump
```

Substitute `localhost` with the machine your DBMS is running on, `biigle_user` with the database user and `biigle_db` with the name of the BIIGLE database.

Now you can update the core application, say to v1.0.1, with:

```
git pull v1.0.1
```

Check out the upgrade notes on GitHub as to whether you have to do anything else (e.g. run migrations or update dependencies).

Running new migrations:

```
php artisan migrate
```

Updating dependencies:

```
composer update
```

To update your installed BIIGLE modules, run:

```
composer update biigle/*
```
Check the instructions of the individual modules if an update required additional actions like publishing updated assets.

Now you have to restart your worker processes so the changes will be applied to them as well. This depends on the service you are using. For Supervisor it looks like this:

```
supervisorctl restart biigle-worker
```

Finally you can exit the maintenance mode of the application with:

```
php artisan up
```

## Module Development

coming soon
