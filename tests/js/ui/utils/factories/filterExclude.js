describe('The filterExclude factory', function () {
    beforeEach(module('biigle.ui.utils'));

    it('should exclude numbers that are present in the second array', inject(function (filterExclude) {
        var first = [1, 2, 3, 4, 5, 10];
        var second = [5, 2, 4, 3];
        filterExclude(first, second);
        expect(first).toEqual([1, 10]);
    }));

    it('should filter correctly if the second array is already sorted', inject(function (filterExclude) {
        var first = [1, 2, 3, 4, 5, 10];
        var second = [2, 3, 4, 5];
        filterExclude(first, second, true);
        expect(first).toEqual([1, 10]);
    }));

    it('shouldn\'t filter correctly if the second array is not sorted but the third argument is true', inject(function (filterExclude) {
        var first = [1, 2, 3, 4, 5, 10];
        var second = [5, 2, 4, 3];
        filterExclude(first, second, true);
        expect(first).not.toEqual([1, 10]);
    }));
});
