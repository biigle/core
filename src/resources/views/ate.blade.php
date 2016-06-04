<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <title>@yield('title')</title>
    <link href="{{ asset('assets/styles/main.css') }}" rel="stylesheet">
    @stack('styles')
    <style>
      .atecontainer{margin:20px 20px 20px 20px}
      .scissors {display:none}
      .mainImg:hover + .scissors {display:block;}
      .button {
        background-color: rgb(93,93,93);
        border:None
      }
    </style>
    <script src="https://code.jquery.com/jquery-2.2.3.min.js" integrity="sha256-a23g1Nt4dtEYOj7bR+vTu7+T8VP13humZFBJNIYoEJo=" crossorigin="anonymous"></script>
    <script>
    alldata = {!! $data !!};
    deletedAnnotations = [];

    function changeLabel(){
            var hash = location.hash.replace( /^#/, '' );
            if (hash in alldata){
                data = alldata[hash];
                addData();
                $("#lbldropdown").text("Label: "+hash);
            }
    }

    $(document).ready(function() {
        for (var i in alldata){
            $('#ddown').append('<li><a href="#'+i+'">'+i+'</a></li>');
        }
        changeLabel();
        $(window).on('hashchange', changeLabel);
    });
    i = 0;
    set = 0;
    myAnim=0;
    function startstopCycle(){
        if (myAnim == 0){
            myAnim = setInterval(function(){$("#flick").attr('src', data[set][i%data[set].length].img);i++;}, 333);
            $('#startstop > img').attr("src","https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_pause_circle_outline_black_48px.svg");
        }else{
            clearInterval(myAnim);
            myAnim=0;
            $('#startstop > img').attr("src","https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_play_circle_outline_black_48px.svg");
        }
    }
    function cutImage(element){
        $(element).css("opacity",0.5);
        $(element).next().css("display","block");
        deletedAnnotations.push({"id":$(element).attr("annotation_id"),"label":$("#lbldropdown").text()});
    }
    function addData(){
        $('#main').empty();
        for(var j=0;j<data[set].length;j++){
            $('#main').append('<div class="atecontainer" style="position: relative;left:0:top:0;margin:5px 5px 5px 5px;float: left;"><img class="mainImg" width="128" annotation_id="'+data[set][j].id+'" src="'+data[set][j].img+'" style="position:relative;top:0;left:0;" onclick="cutImage(this)"></img><img class="scissors" src=\"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_content_cut_white_48px.svg\" style=\"position:absolute;top:40px;left:40px;\"></img></div>');
        }
    }
    function changeView(updown){
        set+=updown;
        if (set<0){
            set=0;
        }else if(set==data.length){
            set=data.length-1;
        }else{
            addData();
        }
    }
    </script>
</head>
<body>
@if(auth()->check())
    @include('partials.navbar')
@endif
    @include('partials.messages')
    @yield('content')
    <div class="dropdown">
        <button class="btn btn-default dropdown-toggle" type="button" id="lbldropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
            Select Label
            <span class="caret"></span>
        </button>
        <ul id="ddown" class="dropdown-menu" aria-labelledby="lbldropdown">
  
        </ul>
    </div>
    <div class="atecontainer" id="flicker" style="float:left; height:100%">
            <img class="atecontainer" id="flick" src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_videocam_black_24px.svg" width=256 height=256></img>
    <div class="atecontainer" id="navigation">
        <button class="button" onclick="changeView(-1);"><img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_skip_previous_black_48px.svg"></img></button>
        <button class="button" id="startstop" onclick="startstopCycle()"><img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_play_circle_outline_black_48px.svg"></img></button>
        <button class="button" onclick="changeView(+1);"><img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_skip_next_black_48px.svg"></img></button>
    </div>
        <div class="atecontainer" id="samples">
            <img id="sample1" src="ate/imgs/1/1.png" width="128"></img>
            <img id="sample1" src="ate/imgs/1/2.png" width="128"></img>
            <img id="sample1" src="ate/imgs/1/4.png" width="128"></img>
        </div>
    </div>
    <div class="atecontainer" id="main">

    </div>
    <script type="text/javascript">
        window.$diasBaseUrl = '{{ url('/') }}';
    </script>
    <script src="{{ asset('assets/scripts/angular.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/angular-resource.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/angular-animate.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/ui-bootstrap-tpls.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/main.js') }}"></script>
    @stack('scripts')
</body>
</html>
