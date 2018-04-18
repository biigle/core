<script type="text/javascript">
    biigle.$declare('annotations.exportArea', {!! json_encode(\Biigle\Modules\Reports\Volume::convert($volume)->exportArea) !!});
</script>
<script src="{{ cachebust_asset('vendor/reports/scripts/annotations.js') }}"></script>
