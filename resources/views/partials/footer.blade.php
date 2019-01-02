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
            @mixin('footerItem')
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
