<script type="text/javascript">
    angular.module('biigle.annotations').constant('EXPORT_AREA', {!! json_encode(\Biigle\Modules\Export\Volume::convert($volume)->exportArea) !!});
</script>
<script src="{{ cachebust_asset('vendor/export/scripts/annotations.js') }}"></script>
