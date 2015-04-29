/**
 * Created by TIMYY on 2015/4/28.
 */
describe('Cuber 测试 ', function () {
    var startTime = 0;
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

    describe('#getURDLFB', function () {
        it('异步调用：RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBd should RU LF UB DR DL BL UL FU BD RF BR FD LDF LBD FUL RFD UFR RDB UBL RBU', function (done) {
            var WCA_SCRAMBLE_SHORT = "RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBd";
            cube.twistDuration = 0;
            cube.twist(WCA_SCRAMBLE_SHORT);
            this.timeout(3000);
            setTimeout(done, 3000);
            setTimeout(function () {
                var result = cube.getURDLFB();
                expect(result).to.eql("RU LF UB DR DL BL UL FU BD RF BR FD LDF LBD FUL RFD UFR RDB UBL RBU");
                done();
            }, 2000);
        });
        it('异步调用：错即是对', function (done) {
            var WCA_SCRAMBLE_SHORT = "RRBBLLUUBBDDLLUUBBdLLDBBDDLLdFFdruLLDBBULLbUfBd";
            cube.twistDuration = 0;
            cube.twist(WCA_SCRAMBLE_SHORT);
            this.timeout(5000);
            setTimeout(function () {
                var result = cube.getURDLFB();
                expect(result).to.eql("FL FR UB BL FD DR UR FU LU DB BR LD BRD BLU DRF FRU BDL LDF URB FUL");
                done();
            }, 2000);
        });

    });
});