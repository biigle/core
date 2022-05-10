@extends('projects.show.base')

@push('scripts')
<script type="text/javascript">
    // biigle.$declare('projects.myData', 'some data');
</script>
@endpush

@section('project-content')
<div id="projects-show-statistics" class="project-statistics">
    {{-- use div ID to mount Vue instance --}}
    {{-- add content here --}}
</div>
@endsection
