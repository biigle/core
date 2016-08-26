# DIAS

BIIGLE DISCOL Image Annotation Software


## Requirements

See [here](https://laravel.com/docs/5.3#installation) for the server requirements of Laravel 5.3.

Additionally:

- PHP JSON extension
- PHP PGSQL extension
- PHP Fileinfo extension
- PHP EXIF extension
- PHP PCNTL extension
- PHP GD Library (>=2.0)
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

The recommended setup for production is a clone of the dias/core repository. This way you can update the application with a simple `git pull`.

DIAS uses [Composer](https://getcomposer.org) for package management. If you use the `composer.phar` archive, substitute all following `composer` commands with `php composer.phar`.

First, set up the project in the current directory:

```
composer create-project dias/core --repository='{"type":"vcs","url":"git@github.com:BiodataMiningGroup/dias-core.git"}' --keep-vcs .
```

This will clone the dias/core repository and install all required packages. Now you have to configure the application environment in the `.env` file. The `.env` file contains all sensitive information like the database credentials or the application encryption key. The file is not tracked by Git and should never be publicly accessible.

We recommend to use PostgreSQL as a DBMS but MySQL or SQLite should work fine as well.

To check if everything was set up correctly you can run `php vendor/bin/phpunit` (but don't do this once the application is in production).

Next, run `php artisan migrate` to set up the database tables.

Now, you have to make sure that the web server user has write permissions in the `storage` directory and any of its subdirectories.

Finally, you have to configure a supervised process for the queue worker daemon. The worker runs in parallel to the web server and is used for longer running tasks that should not be handled during a single request. The recommended setup for a supervised process is to use [Supervisor](http://supervisord.org/) but you can use any equivalent service as well. A supervisor configuration might look like this:

```
[program:dias-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/dias/application/artisan queue:work --sleep=5 --tries=3
autostart=true
autorestart=true
user=webserver-user
numprocs=1
redirect_stderr=true
stdout_logfile=/path/to/dias/application/storage/logs/worker.log
```

Substitute `/path/to/dias/application` with the absolute path to the dias application directory and `webserver-user` with the name of the webserver user. If usage and load of your DIAS instance increases, you may increase `numprocs` to run multiple worker processes.

Read more about workers in the [Laravel docs](https://laravel.com/docs/5.3/queues#supervisor-configuration).

Congratulations, your personal DIAS instance is ready to run. You may use the `php artisan user:new` command to create the first user. Now you probably want to continue by installing some DIAS modules.


### For Development

To develop DIAS on your local machine you may use a Vagrant virtual machine. This way you don't need to install any of the requirements listed above (except of PHP and Git) and keep your development environment clearly separated from your regular OS. First, install [Vagrant](https://www.vagrantup.com/) and a VM provider like [VirtualBox](https://www.virtualbox.org/).

Set up the project in the current directory:

```
composer create-project dias/core --repository='{"type":"vcs","url":"git@github.com:BiodataMiningGroup/dias-core.git"}' --keep-vcs --ignore-platform-reqs .
```

Note the `--ignore-platform-reqs` flag to keep Composer from complaining about missing requirements. These requirements will be met by the virtual machine.

Now you can run `vagrant up` to create and boot your virtual machine for development. The DIAS application is now running at `http://localhost:8000`. Access the virtual machine with `vagrant ssh`. Stop the virtual machine with `vagrant halt`. Delete the virtual machine with `vagrant destroy`.

You will find the application directory in `/home/vagrant/dias` in the virtual machine. Any changes you make there in the virtual machine will be reflected on your host machine and vice versa.

For DIAS module development you should install the modules with the `--prefer-source` flag to keep Composer from deleting the VCS files (eg `.git`). Example:

```
composer require --prefer-source dias/projects
```

## Updating

To update the application, first set it to maintenance mode:

```
php artisan down
```

Now users can't access the application and the worker processes will pause.

Before doing anything with the database (e.g. applying new migrations), we recommend you to make a backup. For PostgreSQL it might look like this:

```
pg_dump -h localhost -U dias_user -d dias_db > dias_db.dump
```

Substitute `localhost` with the machine your DBMS is running on, `dias_user` with the database user and `dias_db` with the name of the DIAS database.

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
composer install
```

To update your installed DIAS modules, run:

```
composer update dias/*
```

Now you have to restart your worker processes so the changes will be applied to them as well. This depends on the service you are using. For Supervisor it looks like this:

```
supervisorctl restart dias-worker
```

Finally you can exit the maintenance mode of the application with:

```
php artisan up
```

## Module Development

coming soon
