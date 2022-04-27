# Developing BIIGLE

To develop BIIGLE on your local machine you can use Docker containers. This way you don't need to install any of the requirements like Python or special PHP extensions and keep your development environment clearly separated from your regular OS.

## Development setup

First, install the following tools:

- [Docker](https://docs.docker.com/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Composer](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-macos)

Make sure to add your user to the new `docker` group with `sudo usermod -aG docker $(whoami)`, then log out and back in. Otherwise you have to call all `docker` or `docker-compose` commands with `sudo`.

Now you can proceed with the development setup:

### 1. Download the project files

Set up the project in the `biigle` directory:

```
composer create-project biigle/core:dev-dev-modules \
    --repository='{"type":"vcs","url":"git@github.com:biigle/core.git"}' \
    --keep-vcs \
    --ignore-platform-reqs \
    --prefer-source biigle
```

Note the `--ignore-platform-reqs` flag to keep Composer from complaining about missing requirements. These requirements will be met by the Docker containers.

This will set up the project in the `dev-modules` branch of this repository. The `dev-modules` branch is configured with all BIIGLE modules which makes it easy to start module development.

### 2. Build and run the application

**Optional:** To speed up the build process, download the pre-built Docker images from GitHub:

```
docker pull ghcr.io/biigle/app:latest
docker pull ghcr.io/biigle/web:latest
docker pull ghcr.io/biigle/worker:latest
```

Now perform these steps:

1. Build the Docker images with `docker-compose build`. This may take a while.

2. Start the first containers: `docker-compose up -d app database`

3. Apply the database migrations: `docker-compose exec app php artisan migrate`

4. Start the whole application with `docker-compose up -d`. The BIIGLE application is now running at <http://localhost:8000>. You can stop the containers with `docker-compose stop` or destroy them with `docker-compose down`. To delete the development database as well, run `docker volume prune` after the containers were destroyed.

### 3. Initialize the application

Before you can start using or developing BIIGLE, you need to create the first user with:

```
docker-compose exec app php artisan user:new
```

Follow these steps to create a new project and volume with test images:

1. Create a new directory containing a few images in the `storage/images` directory. Example: `storage/images/test`.

2. Open BIIGLE at <http://localhost:8000> in the browser.

3. Create a new project and volume in BIIGLE with the volume URL `local://test` and the list of image filenames. The `local://` storage disk resolves to the `storage/images` directory, the `test` suffix is the name of the directory containing the images.

## Building JavaScript and assets

JavaScript and assets are built using NPM and Laravel Mix. Before you start, you have to configure NPM to authenticate to GitHub:

1. Create a new [personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) with the `read:packages` scope.

2. Create a new file `~/.npmrc` and insert the following content:
    ```
    //npm.pkg.github.com/:_authToken=TOKEN
    ```
    Replace `TOKEN` with the personal access token of step 1.

3. Now run `npm install` to install the dependencies (this requires NodeJS >=12.14).

Important commands for development are:

- `npm run watch`: Starts a continuous process to watch for file changes. Rebuilds the assets whenever a file is changed. This can be used during development.

- `npm run prod`: Builds and minifies the assets. This command should be run before each new commit that changes assets.

## Runing the tests

You can run the tests with `composer test`. The first time might fail since the testing database container needs to start up. To run only a subset of the tests, use `composer testf <pattern>` with `<pattern>` being a string that matches the test class or function that you want to run.

## Runing static analysis and CS fixes

Static analysis for PHP can be run with `composer lint` and for JavaScript with `npm run lint`. These checks must pass before a pull request is accepted. In addition to that, you can fix PHP coding style issues with `composer fix`.

## Developing a module

The BIIGLE modules are installed by Composer and located in the `vendor/biigle/` directory. As you have used the `dev-modules` branch, they should be there already. Also, the modules are installed as Git repositories, because of the `--prefer-source` flag of Composer. This allows you to modify and develop a module right in its `vendor/biigle/<name>/` directory, commit and push the changes, all while you see the changes instantly applied in the running development instance.

1. To develop an existing BIIGLE module, you have to [fork](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) it first. Do this on the GitHub repository page of the module. Example: fork `biigle/annotations` to `<username>/annotations` (replace `<username>` with your GitHub username).

2. Connect the installed module with your fork. Example: navigate to `vendor/biigle/annotations` and execute:
   ```bash
   git remote set-url origin git@github.com:<username>/annotations.git
   git remote set-url --push origin git@github.com:<username>/annotations.git
   ```

3. Run `git push` to check if everything worked.

4. Install JavaScript dependencies of the module:
   ```
   npm install
   ```

Now you can build the JavaScript dependencies with the `npm run dev` command. Use `npm run watch` to continuously monitor and build the files while you develop. Before you commit, run `npm run prod` to commit only the minified versions of the JavaScript files and `npm run lint` to check for errors.

Once you are finished with your implementation and want to propose it to be merged into the official BIIGLE module, create a [pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests).

Learn more on module development and how to create a new module in the [biigle/module](https://github.com/biigle/module) template repository.

## Publishing the Docker images

**This can be done only by collaborators of this repository.**

To publish a new version of the `biigle/app`, `biigle/web` and `biigle/worker` Docker images, create a new version as Git tag, first. This can be done on GitHub, too. Pull the new version tag with `git pull --tags`. If you do not set a version tag, only the `latest` Docker images will be built.

To build the Docker images, run `./build.sh`. The script asks you if you want to publish the new images to the GitHub container registry. Before you can do this, you have to [configure Docker](https://docs.github.com/en/free-pro-team@latest/packages/managing-container-images-with-github-container-registry/pushing-and-pulling-docker-images#authenticating-to-github-container-registry) to use the container registry and you obviously need package write permissions in this organization.
