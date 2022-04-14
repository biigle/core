# Contributing

There are several ways for you to contribute to the development of BIIGLE. You can submit a bug report, discuss a new feature or participate in the development of features on our [roadmap](https://github.com/orgs/biigle/projects/4).

## Submit a bug report

To submit a bug report, open an issue in the relevant repository. As BIIGLE is fragmented over several modules, it may not always be straight forward to choose the right repository. If in doubt, create the bug report in the [core repository](https://github.com/biigle/core/issues/new) and the maintainers will move it to the correct module.

A good bug reports should contain as much relevant information about the bug as possible (including helpful screenshots etc.). You should also include steps how to reproduce the bug.

## Discuss a feature

We have a list of features which should be discussed or which are scheduled for development in the [roadmap project board](https://github.com/orgs/biigle/projects/4). If you want to propose a new feature, look at the project board first to see if it hasn't already been proposed. If it hasn't proposed yet, open an issue in the relevant repository or in the [core repository](https://github.com/biigle/core/issues/new) if you are unsure which repository to use.

A feature proposal should include a detailed description of the new feature. Please be aware that the BIIGLE maintainers have limited resources and will concentrate their effort on the features which were already agreed upon. If you really want a feature implemented, consider to develop it yourself.

## Develop a feature

Take a look at [`DEVELOPING.md`](DEVELOPING.md) to get started with the BIIGLE development setup.

The [roadmap project board](https://github.com/orgs/biigle/projects/4) contains a list of features that should be implemented, ordered by their priority (high, medium, low). If you want to participate in the development of a feature, pick one from one of these three categories. First, you should check if anyone else is already working on the feature. If nobody seems to be working on it, add a comment to the issue and tell others that you will work on the feature.

Before you can start developing, you have to [fork](https://help.github.com/en/articles/fork-a-repo) the relevant repository. The fork will be yours and you can implement the new feature there. Once it is ready, create a [pull request](https://help.github.com/en/articles/about-pull-requests) to the original repository. The BIIGLE maintainers will review your pull request and merge it if all is well with your code.

The default development setup of BIIGLE uses the `dev-modules` branch of the core repository. This branch should be used for module development only. If you want to propose changes to the core code, use the `master` branch, instead.

BIIGLE uses readable and meaningful commit messages. Please follow [this guide](https://chris.beams.io/posts/git-commit/) for your commits to BIIGLE.

BIIGLE also defines a PHP coding style in [`.php_cs`](.php_cs). Use the [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) to apply the coding style to your source code.

All changes or new features that affect the API or backend PHP code should be thoroughly tested.
