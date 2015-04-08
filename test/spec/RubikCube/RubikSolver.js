describe('RubikSolver', function () {
    it('#GetResult', function () {
        var rs = new RubikSolver();
        var InputText = "RU LF UB DR DL BL UL FU BD RF BR FD LDF LBD FUL RFD UFR RDB UBL RBU";
        var OutputText = "D1 B3 F1 U3 B1 L2 U3 B2 D3 L2 U1 R1 D1 F2 D1 L2 D2 B2 D3 L2 D1 B2 U2 L2 D2 B2 U2 L2 B2 R2 ";
        expect(rs.GetResult(InputText)).to.eql(OutputText);
    });

    describe('#Char2Num', function() {

        it('#0 ', function() {
            expect(Char2Num('0')).to.eql(-17);
        });
        it('#A returns 0', function() {
            expect(Char2Num('A')).to.eql(0);
        });
        it('#Z ', function() {
            expect(Char2Num('Z')).to.eql(25);
        });
        it('#a ', function() {
            expect(Char2Num('a')).to.eql(32);
        });
        it('#z ', function() {
            expect(Char2Num('z')).to.eql(57);
        });
    });

    describe('#cycle', function () {
        it('returns zero for same strings', function () {

            expect(doe.util.editDistance('foo', 'foo')).to.eql(0);
        });

        it('reports an insertion of 1', function () {
            expect(doe.util.editDistance('foo', 'fooa')).to.eql(1);
        });

        it('reports a replacement of 1', function () {
            expect(doe.util.editDistance('foob', 'fooa')).to.eql(1);
        });

        it('does not fail on empty input', function () {
            expect(doe.util.editDistance('', '')).to.eql(0);
        });
    });

    describe('#asyncMap', function () {
        it('handles correct replies', function () {
            doe.util.asyncMap([1, 2, 3],
                function (d, c) {
                    c(null, d * 2);
                },
                function (err, res) {
                    expect(err).to.eql([null, null, null]);
                    expect(res).to.eql([2, 4, 6]);
                });
        });
        it('handles errors', function () {
            doe.util.asyncMap([1, 2, 3],
                function (d, c) {
                    c('whoops ' + d, null);
                },
                function (err, res) {
                    expect(err).to.eql(['whoops 1', 'whoops 2', 'whoops 3']);
                    expect(res).to.eql([null, null, null]);
                });
        });
    });
});
