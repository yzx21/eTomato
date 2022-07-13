describe('Meta test of my test suite succeed', () => {
    it('My Test Case for a meta unit test succeed', () => {
        expect(true).toEqual(true);
    });
});


describe('Meta test of my test suite failed', () => {
    it('My Test Case for a meta unit test succeed', () => {
        expect(true).not.toBe(false);

    });
});