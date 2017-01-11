<script type="text/javascript">
    angular.module('biigle.annotations').constant('EXPORT_AREA', {!! json_encode(\Biigle\Modules\Export\Transect::convert($transect)->exportArea) !!});
</script>
<script src="{{ cachebust_asset('vendor/export/scripts/annotations.js') }}"></script>
