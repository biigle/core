<div class="row">
    <div class="col-sm-12 col-md-10 col-md-offset-1">
        <?php $routeName = Route::currentRouteName(); ?>
        <ul class="nav nav-tabs notification__tabs">
            <li role="presentation" @if ($routeName === 'notifications') class="active" @endif>
                <a href="{{route('notifications')}}"><span class="glyphicon glyphicon-bell" aria-hidden="true"></span> Notifications</a>
            </li>
            <li role="presentation" @if (starts_with($routeName, 'system-messages')) class="active" @endif>
                <a href="{{route('system-messages')}}" title="Show system messages"><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> System messages</a>
            </li>
            @mixin('notificationTabs')
        </ul>
    </div>
</div>
