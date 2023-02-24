@extends('app')

@section('title', 'Clone volume')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('name', '{{$name}}');
        biigle.$declare('destinationProjects', '{!!$destinationProjects!!}');
        {{--biigle.$declare('files', {{$files}});--}}
    </script>
@endpush

@section('content')
    <div class="container">
        <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
            <form id="clone-volume-form" class="clearfix" role="form"
                  {{--                  method="POST" action="{{ url('api/v1/volumes/'.($volume->id).'/clone-to/'.$destinationId) }}"--}}
                  enctype="multipart/form-data"
                  v-on:submit="startLoading">
                <fieldset>
                    <legend>
                        1. Change volume name
                    </legend>
                    <div class="form-group">
                        <input type="text" class="form-control" name="name" id="name" v-model="name"
                               placeholder="My new volume name" ref="nameInput" required autofocus>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        2. Select destination
                    </legend>
                    <div>
                        <typeahead class="typeahead--block" :items="getProjects"
                                   placeholder="Select destination project" title="Select project to clone volume to"
                                   v-on:select="setProject" :clear-on-select="true"></typeahead>
                    </div>
                </fieldset>
            </form>
        </div>
    </div>
@endsection
