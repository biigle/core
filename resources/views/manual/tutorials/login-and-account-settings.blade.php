@extends('manual.base')

@section('manual-title') Account settings @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn how to manage your user account.
        </p>
        <p>
            There are several ways that allow you to customize BIIGLE to your personal preferences. Some of these settings are valid only for the duration of a browser session. These settings are reset when you use another browser or when you clear your browser cache. Other settings are remembered permanently. This tutorial is about these permanent settings.
        </p>
        <p>
            Permanent user settings are set in the <a href="/settings">settings menu</a>. You can reach the menu with a click on "Settings" in the main menu <i class="fa fa-bars"></i>. There are four categories of settings:
        </p>
        <h3><a href="/settings/profile">Profile</a></h3>
        <p>
            This is personal information like your name. The name is used throughout the application to identify you (e.g. as creator of an annotation or as a member of a project).
        </p>

        <h3><a href="/settings/account">Account</a></h3>
        <p>
            The account settings are everything that has security implications and is potentially dangerous to change. Your password and email address change your login information. Also, the email address can be used for BIIGLE notifications that may contain sensitive information or links. So take care when you change these fields.
        </p>
        <p>
            It goes without saying that deleting your user account is potentially dangerous as well. You can only delete your account if you are not the only admin in one or more projects or label trees, respectively. This ensures that the project or label tree can still be managed when your user doesn't exist any more. The projects, volumes, label trees or annotations that you may have created will not be deleted. However, deleting your account cannot be undone and the association to projects, volumes, label trees or annotations cannot be recovered.
        </p>

        <h3><a href="/settings/notifications">Notifications</a></h3>
        <p>
            Here you can configure how you wish to receive BIIGLE notifications. There are two ways to receive notifications: <strong>Email</strong> will send you an email for each new notification. <strong>Web</strong> will send the notification to your BIIGLE <a href="/notifications">notification center</a>.
        </p>

        <h3><a href="/settings/tokens">Tokens</a></h3>
        <p>
            BIIGLE allows you interact directly with its RESTful API. This can be useful for automated scripts that manage tasks which are cumbersome or impossible to accomplish through the graphical user interface. Each request of such a script is authenticated with an API token instead of your regular password.
        </p>
        <p>
            The tokens settings menu allows you to generate a new API token and to delete existing ones. You should generate a new token for each new automated script that you want to use. This way you have fine grained control over which of your scripts are still allowed to communicate with BIIGLE.
        </p>
        <p>
            Read more on the BIIGLE's RESTful API and on how to use API tokens for authentication in the <a href="/doc/api/index.html">API documentation</a>.
        </p>
    </div>
@endsection
