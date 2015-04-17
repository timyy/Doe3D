/* Auth: Timyy
 * Website: http://www.doe.com
 * Date: 2010/1/5
 * Description: Solve a rubik's cube by input status
 * Please remain this when you copy it
 *
 * TIMYY modify in 2015/4/1
 * from C# to javascript
 *
 * @author Timyy
 * @version %I%, %G%
 * @see github.com/timyy
 */
/**
 *
 * @type {string}
 */

function Car() {
    var wheel = 1;//私有变量
    this.wheel = 5;//公有变量
    this.getPrivateVal = function () {
        return wheel;
    };
    this.getVal = function () {
        return this.wheel;
    }
}

function RubikSolver() {
    var faces = "RLFBUD";
    var order = "AECGBFDHIJKLMSNTROQP".split("");
    var bithash = "TdXhQaRbEFIJUZfijeYV".split("");
    var perm = "AIBJTMROCLDKSNQPEKFIMSPRGJHLNTOQAGCEMTNSBFDHORPQ".split("");
    this.pos = new Uint32Array(20);
    this.ori = new Uint32Array(20);
    var val = new Uint32Array(20);     // 原来是char
    var tables = new Array(8);  //TODO: 二维数组，得看一下需要怎么处理。
    var move = new Uint32Array(20);
    var moveamount = new Uint32Array(20);
    var phase = 0;
    var tablesize = [1, 4096, 6561, 4096, 256, 1536, 13824, 576];
    var CHAROFFSET = 65;

    var isDebug = true;

    /**
     *
     * @param sInput
     * @returns {string}
     * @constructor
     */
    RubikSolver.prototype.GetResult = function (sInput) {
        phase = 0;
        var argv = sInput.split(' ');
        var sOutput = "";

        if (argv.length != 20) {
            return "error";
        }

        var f, i = 0, pc, mor;

        this.debug("<br/>开始 val: -------------<br/>")

        for (var k=0 ; k < 20; k++) {
            val[k] = (k < 12 ? 2 : 3);
            this.debug(k.toString() + "-" + val[k] + "|");  //TODO: debug
        }

        this.debug("<br/>开始 filltable:<br/>");
        //for (var j=0; j < 8; j++) {
        //    this.filltable(j);
        //}
        for (var j=1; j < 3; j++) {
            this.filltable(j);
        }
        this.debug("<br/>开始处理 -------------<br/>");
        for (; i < 20; i++) {
            this.debug("i=" + i);
            f = pc = k = mor = 0;
            for (; f < val[i]; f++)                // c#和javascript 关于字符处理我也是醉了
            {
                j = faces.indexOf(argv[i][f]);
                this.debug("  face " + j);
                if (j > k) {
                    k = j;
                    mor = f;
                }
                pc += 1 << j;
            }
            for (f = 0; f < 20; f++) {
                // this.debug("pc=" + pc +"/" + (bithash[f].charCodeAt(0) - 64))
                if (pc == bithash[f].charCodeAt(0) - 64) {
                    this.debug(" || hit pc=" + pc);
                    break;
                }
            }
            this.debug(" --- ");
            this.pos[order[i].charCodeAt(0) - CHAROFFSET] = (f);
            // this.debug(" pos[" + order[i] + ":" + (order[i].charCodeAt(0) - CHAROFFSET) + "] = ");
            // this.debug(f + "|")
            this.ori[order[i].charCodeAt(0) - CHAROFFSET] = (mor % val[i]);
            // this.debug("ori[" + (order[i].charCodeAt(0) - CHAROFFSET).toString() + "]=" + (mor % val[i]) + "<br/>")
        }

        this.debug("<br/>开始解<br/>");
        for (; phase < 8; phase += 2) {
            for (j = 0; !this.searchphase(j, 0, 9); j++) ;
            for (i = 0; i < j; i++) {
                sOutput += "FBRLUD"[move[i]] + "" + moveamount[i];
                sOutput += " ";
                this.debug(sOutput);
            }
        }

        return sOutput;
    }


    this.debug = function (s) {
        if (isDebug) {
            document.write(s)
        } else {
            // console.write(s)
        }
    }

    /**
     *
     * @param c
     * @returns {number}
     * @constructor
     */
    this.Char2Num = function (c) {
        // this.debug("Char2Num " + c + ":" + (c.charCodeAt(0) - CHAROFFSET).toString() + "|");
        return c.charCodeAt(0) - CHAROFFSET;   // (int)c - CHAROFFSET;
    }

    /**
     *
     * @param p
     * @param a
     * @param offset
     */
    this.cycle = function (p, a, offset) {
        var temp = p[this.Char2Num(a[0 + offset])];
        p[this.Char2Num(a[0 + offset])] = p[this.Char2Num(a[1 + offset])];
        p[this.Char2Num(a[1 + offset])] = temp;
        temp = p[this.Char2Num(a[0 + offset])];
        p[this.Char2Num(a[0 + offset])] = p[this.Char2Num(a[2 + offset])];
        p[this.Char2Num(a[2 + offset])] = temp;
        temp = p[this.Char2Num(a[0 + offset])];
        p[this.Char2Num(a[0 + offset])] = p[this.Char2Num(a[3 + offset])];
        p[this.Char2Num(a[3 + offset])] = temp;
    }

    /**
     *
     * @param i
     * @param a
     */
    this.twist = function (i, a) {
        // i -= CHAROFFSET;
        var index = i - CHAROFFSET;
        this.ori[index] = (this.ori[index]  + a + 1) % val[index];
            //String.fromCharCode(((this.ori[index]).charCodeAt(0) + a + 1) % val[index].charCodeAt(0));
    }

    this.reset = function () {
        // this.debug("rest<br/>");
        for (var i = 0; i < 20; i++) {
            this.pos [i] = i; // String.fromCharCode(i);
            // this.debug("pos[" + i + "]=" + this.pos [i].toString());
            this.ori[i] = 0; // String.fromCharCode(0);
            // this.debug("ori[" + i + "]=" + this.ori[i].toString());
        }
    }

    /**
     *
     * @param p
     * @param offset
     * @returns {number}
     */
    this.permtonum = function (p, offset) {
        var n = 0;
        for (var a = 0; a < 4; a++) {
            n *= 4 - a;
            for (var b = a; ++b < 4;)
                if (p[b + offset] < p[a + offset]) n++;
        }
        return n;
    }

    /**
     *
     * @param p
     * @param n
     * @param o
     */
    this.numtoperm = function (p, n, o) {
        //p += o;
        p[3 + o] = (o);
        for (var a = 3; a-- > 0;) {
            p[a + o] = (n % (4 - a) + o);
            n /= 4 - a;
            for (var b = a; ++b < 4;) {
                if (p[b + o] >= p[a + o]) {
                    // p[b + o]++;
                    p[b + o] = (p[b + o]) + 1; //todo 这里又是个古怪的地方，Conver,ToChar 对应的String.fromCharCode
                }
            }
        }
    }

    /**
     *
     * @param t
     * @returns {number}
     */
    this.getposition = function (t) {
        var i = -1, n = 0;
        switch (t) {
            case 1:
                for (; ++i < 12;)
                    n = n+ (this.ori[i]) << i;  //todo
                break;
            case 2:
                for (i = 20; --i > 11;)
                    n = n * 3 + this.ori[i];
                break;
            case 3:
                for (; ++i < 12;) n += (((this.pos [i]) & 8) > 0) ? (1 << i) : 0;
                break;
            case 4:
                for (; ++i < 8;) n += (((this.pos [i]) & 4) > 0) ? (1 << i) : 0;
                break;
            case 5:
                var corn = new Uint32Array(8);
                var corn2 = new Uint32Array(4);
                var j, k, l;
                k = j = 0;
                for (; ++i < 8;)
                    if (((l = this.pos [i + 12] - 12) & 4) > 0) {
                        corn[l] = k++;
                        n += 1 << i;
                    }
                    else corn[j++] = l;
                for (i = 0; i < 4; i++) corn2[i] = corn[4 + corn[i]];
                for (; --i > 0;) corn2[i] ^= corn2[0];

                n = n * 6 + corn2[1] * 2 - 2;
                if (corn2[3] < corn2[2]) n++;
                break;
            case 6:
                n = this.permtonum(this.pos, 0) * 576 + this.permtonum(this.pos, 4) * 24 + this.permtonum(this.pos, 12);
                break;
            case 7:
                n = this.permtonum(this.pos, 8) * 24 + this.permtonum(this.pos, 16);
                break;

        }
//        this.debug("<br/>Getposition:" +t +":"+ n+ "<br/>")
        return n;
    }

    /**
     *
     * @param t
     * @param n
     */
    this.setposition = function (t, n) {
        var i = 0, j = 12, k = 0;
        var corn = "QRSTQRTSQSRTQTRSQSTRQTSR".split("");
        // this.debug("<br/>Begin setposition -- " + t.toString() + " -- " + n + " == ");
        this.reset();

        switch (t) {
            // case 0 does nothing so leaves cube solved

            case 1://edgeflip
                for (; i < 12; i++) {
                    this.ori[i] = n & 1 ;
                    n = n >>1;
                     // String.fromCharCode(n & 1);
                    // this.debug("ori[" + i + "]:" + this.ori[i] + "|");
                }
                break;
            case 2://cornertwist
                for (i = 12; i < 20; i++) {
                    this.ori[i] = n % 3 ;
                    n = n/3;
                    // String.fromCharCode(n % 3);
                    // this.debug(i + ":" + this.ori[i] + "|");
                }
                break;
            case 3://middle edge choice
                for (; i < 12; i++, n >>= 1) this.pos [i] = (8 * n & 8);
                break;
            case 4://ud slice choice
                for (; i < 8; i++, n >>= 1) this.pos [i] = (4 * n & 4);
                break;
            case 5://tetrad choice,parity,twist
                var offset = n % 6 * 4;
                n /= 6;
                for (; i < 8; i++, n >>= 1)
                    this.pos [i + 12] = (((n & 1) > 0) ? corn[offset + k++].charCodeAt(0) - CHAROFFSET : j++);
                break;
            case 6://slice permutations
                this.numtoperm(this.pos, n % 24, 12);
                n /= 24;
                this.numtoperm(this.pos, n % 24, 4);
                n /= 24;
                this.numtoperm(this.pos, n, 0);
                break;
            case 7://corner permutations
                this.numtoperm(this.pos, n / 24, 8);
                this.numtoperm(this.pos, n % 24, 16);
                break;
        }
    }

    /**
     *
     * @param m
     */
    this.domove = function (m) {
        //char* p = perm + 8 * m;
        var offset = 8 * m;
        var i = 8;
        //cycle the edges
        this.cycle(this.pos, perm, offset);
        this.cycle(this.ori, perm, offset);
        //cycle the corners
        this.cycle(this.pos, perm, offset + 4);
        this.cycle(this.ori, perm, offset + 4);
        //twist corners if RLFB
        if (m < 4)
            for (; --i > 3;) this.twist(perm[i + offset], i & 1);
        //flip edges if FB
        if (m < 2)
            for (i = 4; i-- > 0;) this.twist(perm[i + offset], 0);
    }

    /**
     * filetable() 构造解方案表*
     * @param ti
     */
    this.filltable = function (ti) {
        var n = 1;
        var l = 1;
        var tl = tablesize[ti];

        var tb = new Uint32Array(tl);
        tables[ti] = tb;

        this.debug("<br/>Begin fill table: " + ti + ":" + tablesize[ti]+ " "+ tb.length +"<br/>");
        for (var i = 0; i < tb.length; i++) tb[i] = 0; // ('\0');
        this.reset();
        tb[this.getposition(ti)] = 1;
        this.debug("Getpos:" + tb[this.getposition(ti)] + "|" + this.getposition(ti) + "!");

        // while there are positions of depth l
        while (n > 0) {
            n = 0;
            // find each position of depth l
            for (var i = 0; i < tl; i++) {
                // this.debug("i=" + i + "/" + tl + "<br/>")
                if (tb[i] == l) {
                    //construct that cube position
                    this.setposition(ti, i);
                    // try each face any amount
                    for (var f = 0; f < 6; f++) {
                        for (var q = 1; q < 4; q++) {
                            this.domove(f);
                            // get resulting position
                            var r = this.getposition(ti);
                            this.debug("R=" +r) ;
                            // if move as allowed in that phase, and position is a new one
                            if ((q == 2 || f >= (ti & 6)) && tb[r] == 0) {   // '\0') {
                                // mark that position as depth l+1
                                tb[r] = (l + 1);
                                this.debug("r=" + r + " l=" + l);
                                n++;
                            }
                        }
                        this.domove(f);
                    }
                }
            }
            l++;
        }
        this.debug("<br/> " +tb.length +"<br/>");
        for(var i =0; i< tb.length && i <100 ; i++) {
           this.debug(tb[i]);
        }
        this.debug("<br/>End fill table<br/>");

    }

    /**
     * searchphase 解魔方。
     * @param movesleft
     * @param movesdone
     * @param lastmove
     * @returns {boolean}
     */
    this.searchphase = function (movesleft, movesdone, lastmove) {
        // this.debug("<br/>searchphase: " + movesleft + "|" + movesdone + "|" + lastmove + "<br/>");
        // this.debug("phase=" + phase + "  " + "getposition(phase)=" + this.getposition(phase) + "|");

        if ((tables[phase][this.getposition(phase)]) - 1 > movesleft ||
            (tables[phase + 1][this.getposition(phase + 1)]) - 1 > movesleft) return false;

        if (movesleft == 0) return true;

        for (var i = 6; i-- > 0;) {
            if ((i - lastmove != 0) && ((i - lastmove + 1) != 0 || ((i | 1) != 0))) {
                move[movesdone] = i;
                for (var j = 0; ++j < 4;) {
                    this.domove(i);
                    moveamount[movesdone] = j;
                    if ((j == 2 || i >= phase) &&
                        this.searchphase(movesleft - 1, movesdone + 1, i)) return true;
                }
                this.domove(i);
            }
        }
        return false;
    }

}