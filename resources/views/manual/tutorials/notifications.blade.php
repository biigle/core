@extends('manual.base')

@section('manual-title') Notifications @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            View and manage BIIGLE notifications in the notification center.
        </p>
        <p>
            Notifications are an alternative to sending emails to inform you of an event like the completion of a longer running task that you have submitted in BIIGLE. All your notifications are collected in your notification center. You can visit the notification center with a click on the <span class="fa fa-bell" aria-hidden="true"></span> symbol in the navbar at the top. If you have (new) unread notifications the symbol is highlighted with a flashing blue dot.
        </p>
        <p>
            The default view of the notification center shows all unread notifications. Each notification consists of a title, a short message and an optional action link like this:
        </p>
        <div id="sample-notification" class="panel panel-default">
            <div class="panel-heading">
                <span class="pull-right">
                    <span>1 minute ago</span>
                    <button class="btn btn-default btn-xs" title="Mark as read"><i class="fa fa-check"></i></button>
                </span>
                <h3 class="panel-title">Notification title</h3>
            </div>
            <div class="panel-body">
                Notification message
                <p class="notification__action">
                    <a>Action link</a>
                </p>
            </div>
        </div>
        <p>
            A click on the action link usually transfers you directly to the cause of the notification (like a new downloadable file). You can mark unread notifications as read by clicking on the <button class="btn btn-default btn-xs" title="Mark as read"><i class="fa fa-check"></i></button> button or clicking on the action link. This will make the message immediately disappear from the list of unread notifications. To view older notifications that were already marked as read, click the "All notifications" link in the navigation on the left of the notification center.
        </p>
    </div>
@endsection
