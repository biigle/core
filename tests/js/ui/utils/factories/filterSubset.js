describe('The filterSubset factory', function () {
    beforeEach(module('dias.ui.utils'));

    it('should filter out numbers that are not present in the second array', inject(function (filterSubset) {
        var first = [1, 2, 3, 4, 5, 10];
        var second = [5, 2, 4, 3];
        filterSubset(first, second);
        expect(first).toEqual([2, 3, 4, 5]);
    }));

    it('should filter correctly if the second array is already sorted', inject(function (filterSubset) {
        var first = [1, 2, 3, 4, 5, 10];
        var second = [2, 3, 4, 5];
        filterSubset(first, second, true);
        expect(first).toEqual([2, 3, 4, 5]);
    }));

    it('shouldn\'t filter correctly if the second array is not sorted but the third argument is true', inject(function (filterSubset) {
        var first = [1, 2, 3, 4, 5, 10];
        var second = [5, 2, 4, 3];
        filterSubset(first, second, true);
        expect(first).not.toEqual([2, 3, 4, 5]);
    }));
});
