@push('styles')
<link href="{{ asset('vendor/projects/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ asset('vendor/projects/scripts/main.js') }}"></script>
<script type="text/javascript">
    angular.module('dias.projects').constant('PROJECT_ID', {{$project->id}});
</script>
@endpush
