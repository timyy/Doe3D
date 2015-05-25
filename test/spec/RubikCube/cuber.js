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

});