/**
 * Created by TIMYY on 2015/4/28.
 */
describe('Cuber 测试 ', function () {
    beforeEach(function () {
        var isMobile = false;
        var scopedCheckQueue;
        var ua = navigator.userAgent,
            isIe = ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1;
        var useLockedControls = true,
            controls = useLockedControls ? ERNO.Locked : ERNO.Freeform;
        var cube = window.cube = new ERNO.Cube({
            hideInvisibleFaces: isMobile,
            controls: controls,
            renderer: isIe ? ERNO.renderers.IeCSS3D : null
        });
    });
    describe('#getURDLFB', function () {
        it('getURDLFB 异步调用：RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBd should RU LF UB DR DL BL UL FU BD RF BR FD LDF LBD FUL RFD UFR RDB UBL RBU', function (done) {
            var WCA_SCRAMBLE_SHORT = "RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBd";
            cube.twistDuration = 0;
            cube.twist(WCA_SCRAMBLE_SHORT);
            this.timeout(3000);
            //           setTimeout(done, 3000);
            setTimeout(function () {
                var result = cube.getURDLFB();
                expect(result).to.eql("RU LF UB DR DL BL UL FU BD RF BR FD LDF LBD FUL RFD UFR RDB UBL RBU");
                done();
            }, 1000);
        });
        it('getURDLFB 异步调用：错即是对,第二次调要复原，并测一下异步等待。', function (done) {
            var WCA_SCRAMBLE_SHORT = "RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBdd";
            cube.twist(WCA_SCRAMBLE_SHORT);
            this.timeout(3000);
            //           setTimeout(done, 3000);
            setTimeout(function () {
                var result = cube.getURDLFB();
                expect(result).to.eql("RU LF UB DR BL UL FU DL BD RF BR FD LDF LBD FUL RFD RBU UFR RDB UBL");
                done();
            }, 2000);
        });

    });
    describe('#ERNO.SolverM.testDCross', function () {
        it('默认', function () {
            var result = ERNO.SolverM.prototype.testDCross(cube);
            expect(result).to.eql({'DL': 'DL', 'DF': 'DF', 'DR': 'DR', 'DB': 'DB'});
        });
        it('默认,否', function () {
            var result = ERNO.SolverM.prototype.testDCross(cube);
            expect(result).to.not.eql({'DL': 'DD', 'DF': 'DF', 'DR': 'DR', 'DB': 'DB'});
        });
        it('testDCross  RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBd', function (done) {
            var WCA_SCRAMBLE_SHORT = "RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBd";
            cube.twist(WCA_SCRAMBLE_SHORT);
            this.timeout(3000);
            //setTimeout(done, 10000);

            setTimeout(function () {
                var result = ERNO.SolverM.prototype.testDCross(cube);
                console.log(result);
                expect(result).to.eql({'DL': 'FU', 'DF': 'DL', 'DR': 'BL', 'DB': 'UL'});
                done();
            }, 1000);
        });
    });
    describe('#ERNO.SolverM.isDCross', function () {
        it('默认', function () {
            var result = ERNO.SolverM.prototype.isDCross(cube);
            expect(result).to.eql(true);
        });
        it('DCross  RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBd', function (done) {
            var WCA_SCRAMBLE_SHORT = "RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBd";
            cube.twist(WCA_SCRAMBLE_SHORT);
            this.timeout(3000);
            //setTimeout(done, 10000);

            setTimeout(function () {
                var result = ERNO.SolverM.prototype.isDCross(cube);
                expect(result).to.eql(false);
                done();
            }, 1000);
        });
    });
});