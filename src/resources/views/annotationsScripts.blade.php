<script type="text/javascript">
    angular.module('dias.annotations').constant('EXPORT_AREA', {!! json_encode(\Dias\Modules\Export\Transect::convert($transect)->exportArea) !!});
</script>
<script src="{{ cachebust_asset('vendor/export/scripts/annotations.js') }}"></script>
