describe('Car 测试变量 ', function () {
    var car1 = new Car();
    describe('#wheel', function () {
        it('#Car public wheel is 5', function () {
            expect(car1.wheel).to.eql(5);
        });
        it('#Car Private wheel is 1', function () {
            expect(car1.getPrivateVal()).to.eql(1);
        });
        it('#Car public function wheel is 5', function () {
            expect(car1.getVal()).to.eql(5);
        });
    });
});
describe('RubikSolver', function () {
    var rs = new RubikSolver();
    it('#GetResult 1', function () {
        var InputText = "RU LF UB DR DL BL UL FU BD RF BR FD LDF LBD FUL RFD UFR RDB UBL RBU";
        var OutputText = "D1 B3 F1 U3 B1 L2 U3 B2 D3 L2 U1 R1 D1 F2 D1 L2 D2 B2 D3 L2 D1 B2 U2 L2 D2 B2 U2 L2 B2 R2 ";
        expect(rs.GetResult(InputText)).to.eql(OutputText);
    });
    it('#GetResult 2, 已经解好的。', function () {
        var InputText = "UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR";
        var OutputText = "";
        expect(rs.GetResult(InputText)).to.eql(OutputText);
    });

    describe('#Char2Num', function () {
        it('#0 ', function () {
            // expect(rs.GetResult("RU LF UB DR DL BL UL FU BD RF BR FD LDF LBD FUL RFD UFR RDB UBL RBU")).to.eql("D1 R3");
            expect(rs.Char2Num('0')).to.eql(-17);
        });
        it('#A returns 0', function () {
            expect(rs.Char2Num('A')).to.eql(0);
        });
        it('#Z returns 25', function () {
            expect(rs.Char2Num('Z')).to.eql(25);
        });
        it('#a ', function () {
            expect(rs.Char2Num('a')).to.eql(32);
        });
        it('#z ', function () {
            expect(rs.Char2Num('z')).to.eql(57);
        });
    });

    describe('#cycle', function () {
        var perm = "AIBJTMROCLDKSNQPEKFIMSPRGJHLNTOQAGCEMTNSBFDHORPQ".split("");
        var pos = [20];
        rs.clear = function () {
            for (var i = 0; i < 20; i++) {
                pos [i] = i;
            }
        };
        beforeEach(function () {
            return rs.clear();
            ;
        });
        describe('#cycle 1', function () {
            it('pos 1 should 8', function () {
                rs.cycle(pos, perm, 1);
                expect(pos[1]).to.eql(8);
                expect(pos[8]).to.eql(19);

            });
        });
        describe('#cycle 2', function () {
            it('pos 1 should 12', function () {
                rs.cycle(pos, perm, 2);
                expect(pos[1]).to.eql(12);
                expect(pos[9]).to.eql(1);
                expect(pos[12]).to.eql(19);
                expect(pos[19]).to.eql(9);
            });
        });
    });

    describe('#twist', function () {

        it('twist m=0', function () {
            var m = 0;
            var perm = "AIBJTMROCLDKSNQPEKFIMSPRGJHLNTOQAGCEMTNSBFDHORPQ".split("");
            var offset = 8 * m;
            var i = 8;

            rs.reset();
            //twist corners if RLFB
            if (m < 4)
                for (; --i > 3;) rs.twist(perm[i + offset], i & 1);
            //0 0 0 0 0 0 0 0 0 0 0 0 2 0 2 0 0 1 0 1
            expect(rs.ori).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 1, 0, 1]);
            //flip edges if FB
            if (m < 2)
                for (i = 4; i-- > 0;) rs.twist(perm[i + offset], 0);
            // ori= 1 1 0 0 0 0 0 0 1 1 0 0 2 0 2 0 0 1 0 1
            expect(rs.ori).to.eql([1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 2, 0, 2, 0, 0, 1, 0, 1]);
        });
    });
    describe('#reset', function () {

        it('Reset pos i', function () {
            // expect(pos[0].charCodeAt(0)).to.eql(0);
            rs.reset();
            for (var i = 0; i < 20; i++)
                expect(rs.pos[i]).to.eql(i);
        });
        it('Reset ori 0', function () {
            rs.reset();
            expect(rs.ori[0]).to.eql(0);
        });
        it('Reset ori 1', function () {
            rs.reset();
            expect(rs.ori[1]).to.eql(0);
        });
        it('Reset ori 19', function () {
            rs.reset();
            expect(rs.ori[19]).to.eql(0);
        });
    });
    describe('#permtonum', function () {
        it('permtonum 0 return 10', function () {
            expect(rs.permtonum(rs.pos, 0)).to.eql(10);
        });
        it('permtonum 4 return 17', function () {
            expect(rs.permtonum(rs.pos, 4)).to.eql(17);
        });
        it('permtonum 12 return 4', function () {
            expect(rs.permtonum(rs.pos, 12)).to.eql(4);
        });
        it('permtonum 8 return 5', function () {
            expect(rs.permtonum(rs.pos, 8)).to.eql(9);
        });
        it('permtonum 16 return 9', function () {
            expect(rs.permtonum(rs.pos, 16)).to.eql(6);
        });
    });
    describe('#numtoperm', function () {
        var pos = [20];
        rs.clear = function () {
            for (var i = 0; i < 20; i++) {
                pos [i] = i;
            }
        };
        beforeEach(function () {
            return rs.clear();
            ;
        });
        it('numtoperm ', function () {
            var n = 10;
            rs.numtoperm(pos, n % 24, 12);
            expect(pos[0]).to.eql(0);
            expect(pos[1]).to.eql(1);
        });
    });
    describe('#getposition', function () {
        it('returns zero for same strings', function () {

        });
    });
    describe('#setposition', function () {
        it('returns zero for same strings', function () {

        });
    });
    describe('#domove', function () {
        it('domove 0', function () {
            rs.reset();
            rs.domove(0);
            expect(rs.pos).to.eql([9, 8, 2, 3, 4, 5, 6, 7, 0, 1, 10, 11, 19, 13, 17, 15, 16, 12, 18, 14]);
            expect(rs.ori).to.eql([1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 2, 0, 2, 0, 0, 1, 0, 1]);
        });
        it('domove 1', function () {
            rs.reset();
            rs.domove(1);
            expect(rs.pos).to.eql([0, 1, 10, 11, 4, 5, 6, 7, 8, 9, 3, 2, 12, 18, 14, 16, 13, 17, 15, 19]);
            expect(rs.ori).to.eql([0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 2, 0, 2, 1, 0, 1, 0]);
        });
    });
    describe('#filltable', function () {
        // [1, 4096, 6561, 4096, 256, 1536, 13824, 576];
        it('fill table 0', function () {
            rs.reset();
            var tb;
            tb = rs.filltable(0);
            expect(tb.length).to.eql(1);
            expect(tb).to.eql([1]);
        });
        it('fill table 1', function () {
            rs.reset();
            var tb;
            var result = {
                '0': 1, '1': 0, '2': 0, '3': 5, '4': 0, '5': 6, '6': 5, '7': 0, '8': 0, '9': 5, '10': 6
            }
            tb = rs.filltable(1);
            expect(tb.length).to.eql(4096);
            for (var i = 0; i < 10; i++)  expect(tb[i]).to.eql(result[i]);
        });
        it('fill table 2, size should be 6561', function () {
            rs.reset();
            var tb;
            var result = [];
            tb = rs.filltable(2);
            expect(tb.length).to.eql(6561);
            for (var i = 0; i < 10; i++)  expect(tb[i]).to.eql(result[i]);
        });
        it('fill table 3, size should be 4096', function () {
            rs.reset();
            var tb;
            var result = [];
            tb = rs.filltable(3);
            expect(tb.length).to.eql(4096);
            for (var i = 0; i < 10; i++)  expect(tb[i]).to.eql(result[i]);
        });
    });
    describe('#searchphase', function () {
        it('returns zero for same strings', function () {

        });
    });

    //  describe('#asyncMap', function () {
    //      it('handles correct replies', function () {
    //          doe.util.asyncMap([1, 2, 3],
    //              function (d, c) {
    //                  c(null, d * 2);
    //              },
    //              function (err, res) {
    //                  expect(err).to.eql([null, null, null]);
    //                  expect(res).to.eql([2, 4, 6]);
    //              });
    //      });
    //      it('handles errors', function () {
    //          doe.util.asyncMap([1, 2, 3],
    //              function (d, c) {
    //                  c('whoops ' + d, null);
    //              },
    //              function (err, res) {
    //                  expect(err).to.eql(['whoops 1', 'whoops 2', 'whoops 3']);
    //                  expect(res).to.eql([null, null, null]);
    //              });
    //      });
    //  });
});
