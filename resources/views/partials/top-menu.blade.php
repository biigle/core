<li id="top-menu" is="dropdown" ref="dropdown" tag="li">
    <a href="#" onclick="event.preventDefault()" class="dropdown-toggle" role="button" aria-haspopup="true" aria-expanded="false" title="Main menu"><i class="fa fa-bars"></i></a>
    <template slot="dropdown">
        <li class="dropdown-header">
            Signed in as <strong>{{ $user->firstname }} {{ $user->lastname }}</strong>
        </li>
        <li role="separator" class="divider"></li>
        <li>
            <a href="{{ route('home') }}" title="Dashboard">Dashboard</a>
        </li>
        <li>
            <a href="{{route('search', ['t' => 'projects'])}}" title="Projects">Projects</a>
        </li>
        <li>
            <a href="{{route('search', ['t' => 'label-trees'])}}" title="Label trees">Label trees</a>
        </li>
        @mixin('navbarMenuItem')
        @can('sudo')
            <li>
                <a href="{{ route('admin') }}" title="Admin area">Admin area</a>
            </li>
        @endcan
        <li role="separator" class="divider"></li>
        <li>
            <a href="{{ route('settings') }}" title="{{ trans('biigle.titles.settings') }}">{{ trans('biigle.titles.settings') }}</a>
        </li>
        <li>
            <a href="{{ route('manual') }}" title="Manual">Manual</a>
        </li>
        <li>
            <a href="{{ url('logout') }}" onclick="event.preventDefault();document.getElementById('logout-form').submit();" title="Log out">Log out</a>

            <form id="logout-form" action="{{ url('logout') }}" method="POST" style="display: none;">
                {{ csrf_field() }}
            </form>
        </li>
        @if (View::exists('imprint') || View::exists('privacy') || View::exists('terms'))
            <li role="separator" class="divider"></li>
            <li class="dropdown-footer">
                <ul>
                    @if (View::exists('imprint'))
                        <li><a href="{{route('imprint')}}" title="Imprint">Imprint</a></li>
                    @endif
                    @if (View::exists('privacy'))
                        <li><a href="{{route('privacy')}}" title="Privacy">Privacy</a></li>
                    @endif
                    @if (View::exists('terms'))
                        <li><a href="{{route('terms')}}" title="Terms">Terms</a></li>
                    @endif
                </ul>
            </li>
        @endif
    </template>
</li>
