<div class="row">
    <div class="col-sm-12 col-md-10 col-md-offset-1">
        <?php $routeName = Route::currentRouteName(); ?>
        <ul class="nav nav-tabs notification__tabs">
            <li role="presentation" @if ($routeName === 'notifications') class="active" @endif>
                <a href="{{route('notifications')}}"><span class="fa fa-bell" aria-hidden="true"></span> Notifications</a>
            </li>
            <li role="presentation" @if (Str::startsWith($routeName, 'system-messages')) class="active" @endif>
                <a href="{{route('system-messages')}}" title="Show system messages"><span class="fa fa-bullhorn" aria-hidden="true"></span> System messages</a>
            </li>
            @mixin('notificationTabs')
        </ul>
    </div>
</div>
