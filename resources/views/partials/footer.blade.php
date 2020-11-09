<footer class="footer @if(isset($positionAbsolute) && $positionAbsolute) footer--absolute @endif">
    @if(isset($container) && $container)
        <div class="container">
            <div class="row">
                <div class="col-xs-12">
    @endif
        <ul class="footer-menu">
            <li>
                <a href="{{ route('manual') }}" title="Manual">Manual</a>
            </li>
            @if (View::exists('imprint'))
                <li><a href="{{route('imprint')}}" title="Imprint">Imprint</a></li>
            @endif
            @if (View::exists('privacy'))
                <li><a href="{{route('privacy')}}" title="Privacy">Privacy</a></li>
            @endif
            @if (View::exists('terms'))
                <li><a href="{{route('terms')}}" title="Terms">Terms</a></li>
            @endif
            @if (isset($links) && is_array($links))
                @foreach($links as $link => $url)
                    <li><a href="{{$url}}">{{$link}}</a></li>
                @endforeach
            @endif
        </ul>
    @if(isset($container) && $container)
                </div>
            </div>
        </div>
    @endif

</footer>
