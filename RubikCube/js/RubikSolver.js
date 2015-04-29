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

/**
 * RubikSolver
 * 解魔方程序。
 * @constructor
 */
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

    var isDebug = false;
    var infoDebug = document.getElementById('infoDebug');
    var DebugCount = 0;
    var DebugCountMax = 1000;
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

        this.debug("%c<br/>开始RubikSolver.GetResult<br/>", "color: #c00");

        for (var k = 0; k < 20; k++) {
            val[k] = (k < 12 ? 2 : 3);
            this.debug(k.toString() + "-" + val[k] + "|");  //TODO: debug
        }

        this.debug("<br/>开始 filltable:<br/>");
        //for (var j=0; j < 8; j++) {
        //    this.filltable(j);
        //}
        for (var j = 0; j < 8; j++) {
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

    RubikSolver.prototype.GetResultGoogle = function (sInput) {
        var result = "";
        var resultGoogle = "";
        var action = "";
        var actionTime = "";
        var deal;

        result = this.GetResult(sInput);
        deal = result.split(' ');
        //for(var i=0; i<deal.length -1;i++){
        //    action=deal[i][0];
        //    actionTime = deal[i][1].charCodeAt(0)-48;
        //    for(var j=0; j<actionTime;j++)
        //        resultGoogle += action;
        //}
        deal.forEach(function (d) {
            action = d[0];
            actionTime = parseInt(d[1]); //从字符转为数字
            switch (actionTime) {
                case 3: //正转三次就是反转
                    resultGoogle += action.toLowerCase();
                    break;
                default:
                    for (var i = 0; i < actionTime; i++)
                        resultGoogle += action;
                    break;
            }

        });
        return resultGoogle;
    }

    this.debug = function (s, color) {
        if (isDebug) {
            DebugCount++;
            if (DebugCount < DebugCountMax) { // debug 信息太多会显示不了，这种方式效率比较低
                if (undefined == color) {
                    console.log(s)
                } else {
                    console.log(s, color);
                }
                //infoDebug.innerHTML += s;
                //infoDebug.style.display = 'block';
                //infoDebug.style.pointerEvents = 'auto';
            }
        } else {
            //infoDebug.style.display = 'none';
            //infoDebug.style.pointerEvents = 'none';
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
     * @param a a is char
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
     * @param i is char
     * @param a
     */
    this.twist = function (i, a) {
        this.debug("<br/>twist i=" + i + " a=" + a);
        // i -= CHAROFFSET;
//        var index = i.charCodeAt(0) - CHAROFFSET;    //todo 花了两个星期才找到的bug, 原来的程序有病
        var index = this.Char2Num(i);
        this.ori[index] = (this.ori[index] + a + 1) % val[index];
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
        this.debug("<br/>Getpos t=" + t);
        switch (t) {
            case 1:
                for (; ++i < 12;) {
                    n += ((this.ori[i]) << i);  //todo
                    this.debug(" ori[" + i + "]=" + this.ori[i] + " n=" + n + " ");
                }
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
        this.debug("<br/>Setpos --t=" + t.toString() + " n=" + n + " == ");
        this.reset();
        switch (t) {
            // case 0 does nothing so leaves cube solved

            case 1://edgeflip
                for (; i < 12; i++) {
                    this.ori[i] = n & 1;
                    n = n >> 1;
                    // String.fromCharCode(n & 1);
                    this.debug("ori[" + i + "]:" + this.ori[i] + "|");
                }
                break;
            case 2://cornertwist
                for (i = 12; i < 20; i++) {
                    this.ori[i] = n % 3;
                    n = n / 3;
                    // String.fromCharCode(n % 3);
                    this.debug("ori[" + i + "]:" + this.ori[i] + "|");
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
        this.debug("End Setpos<br/>")
    }

    /**
     *
     * @param m
     */
    this.domove = function (m) {
        this.debug("<br/>Domove m=" + m);
        this.debug("<br/>init pos= ");
        for (var j = 0; j < this.pos.length; j++) {
            this.debug(this.pos[j] + " ");
        }
        this.debug("<br/>init ori= ");
        for (var j = 0; j < this.ori.length; j++) {
            this.debug(this.ori[j] + " ");
        }

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
        this.debug("<br/> ori= ");
        for (var j = 0; j < this.ori.length; j++) {
            this.debug(this.ori[j] + " ");
        }
        //flip edges if FB
        if (m < 2)
            for (i = 4; i-- > 0;) this.twist(perm[i + offset], 0);

        this.debug("<br/> pos= ");
        for (var j = 0; j < this.pos.length; j++) {
            this.debug(this.pos[j] + " ");
        }
        this.debug("<br/> ori= ");
        for (var j = 0; j < this.ori.length; j++) {
            this.debug(this.ori[j] + " ");
        }
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

        this.debug("<br/>Begin fill table: " + ti + ":" + tablesize[ti] + " " + tb.length + "<br/>");
        for (var i = 0; i < tb.length; i++) tb[i] = 0; // ('\0');
        this.reset();
        tb[this.getposition(ti)] = 1;
        this.debug("Getpos:" + tb[this.getposition(ti)] + "|" + this.getposition(ti) + "<br/>");

        // while there are positions of depth l
        while (n > 0) {
            n = 0;
            // find each position of depth l
            for (var i = 0; i < tl; i++) {
                if (tb[i] == l) {
                    this.debug("i=" + i + "/" + l + "<br/>")
                    //construct that cube position
                    this.setposition(ti, i);
                    // try each face any amount
                    for (var f = 0; f < 6; f++) {
                        for (var q = 1; q < 4; q++) {
                            this.domove(f);
                            // get resulting position
                            var r = this.getposition(ti);
                            this.debug(" R= " + r);
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
        this.debug("<br/> " + tb.length + "<br/>");
        for (var i = 0; i < tb.length && i < 100; i++) {
            this.debug(tb[i]);
        }
        this.debug("<br/>End fill table<br/>");
        return tb;
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

    //其中s是把6*3*3的数组，用逗号按顺序连接成的字符串
    /**
     *
     * @param s
     * @constructor
     */
    this.SolveReadColors = function (s) {
        var ArrColors = s.Split(',');
        var sInput = "";
        var ReadQ = "URDLFB";
        var
            PosQ = new string[6];
        for (var i = 0; i < 6; i++) {
            PosQ[Convert.ToInt32(ArrColors[4 + i * 9]) - 1] = ReadQ[i].ToString();
        }
        sInput += PosQ[Convert.ToInt32(ArrColors[7]) - 1] + PosQ[Convert.ToInt32(ArrColors[37]) - 1] + " ";  //UF
        sInput += PosQ[Convert.ToInt32(ArrColors[5]) - 1] + PosQ[Convert.ToInt32(ArrColors[12]) - 1] + " ";  //UR
        sInput += PosQ[Convert.ToInt32(ArrColors[1]) - 1] + PosQ[Convert.ToInt32(ArrColors[52]) - 1] + " ";  //UB
        sInput += PosQ[Convert.ToInt32(ArrColors[3]) - 1] + PosQ[Convert.ToInt32(ArrColors[32]) - 1] + " ";  //UL
        sInput += PosQ[Convert.ToInt32(ArrColors[25]) - 1] + PosQ[Convert.ToInt32(ArrColors[43]) - 1] + " ";  //DF
        sInput += PosQ[Convert.ToInt32(ArrColors[21]) - 1] + PosQ[Convert.ToInt32(ArrColors[14]) - 1] + " ";  //DR
        sInput += PosQ[Convert.ToInt32(ArrColors[19]) - 1] + PosQ[Convert.ToInt32(ArrColors[46]) - 1] + " ";  //DB
        sInput += PosQ[Convert.ToInt32(ArrColors[23]) - 1] + PosQ[Convert.ToInt32(ArrColors[30]) - 1] + " ";  //DL
        sInput += PosQ[Convert.ToInt32(ArrColors[41]) - 1] + PosQ[Convert.ToInt32(ArrColors[16]) - 1] + " ";  //FR
        sInput += PosQ[Convert.ToInt32(ArrColors[39]) - 1] + PosQ[Convert.ToInt32(ArrColors[34]) - 1] + " ";  //FL
        sInput += PosQ[Convert.ToInt32(ArrColors[50]) - 1] + PosQ[Convert.ToInt32(ArrColors[10]) - 1] + " ";  //BR
        sInput += PosQ[Convert.ToInt32(ArrColors[48]) - 1] + PosQ[Convert.ToInt32(ArrColors[28]) - 1] + " ";  //BL

        sInput += PosQ[Convert.ToInt32(ArrColors[8]) - 1] + PosQ[Convert.ToInt32(ArrColors[38]) - 1] + PosQ[Convert.ToInt32(ArrColors[15]) - 1] + " ";  //UFR
        sInput += PosQ[Convert.ToInt32(ArrColors[2]) - 1] + PosQ[Convert.ToInt32(ArrColors[9]) - 1] + PosQ[Convert.ToInt32(ArrColors[53]) - 1] + " ";  //URB
        sInput += PosQ[Convert.ToInt32(ArrColors[0]) - 1] + PosQ[Convert.ToInt32(ArrColors[51]) - 1] + PosQ[Convert.ToInt32(ArrColors[29]) - 1] + " ";  //UBL
        sInput += PosQ[Convert.ToInt32(ArrColors[6]) - 1] + PosQ[Convert.ToInt32(ArrColors[35]) - 1] + PosQ[Convert.ToInt32(ArrColors[36]) - 1] + " ";  //ULF

        sInput += PosQ[Convert.ToInt32(ArrColors[24]) - 1] + PosQ[Convert.ToInt32(ArrColors[17]) - 1] + PosQ[Convert.ToInt32(ArrColors[44]) - 1] + " ";  //DRF
        sInput += PosQ[Convert.ToInt32(ArrColors[26]) - 1] + PosQ[Convert.ToInt32(ArrColors[42]) - 1] + PosQ[Convert.ToInt32(ArrColors[33]) - 1] + " ";  //DFL
        sInput += PosQ[Convert.ToInt32(ArrColors[20]) - 1] + PosQ[Convert.ToInt32(ArrColors[27]) - 1] + PosQ[Convert.ToInt32(ArrColors[45]) - 1] + " ";  //DLB
        sInput += PosQ[Convert.ToInt32(ArrColors[18]) - 1] + PosQ[Convert.ToInt32(ArrColors[47]) - 1] + PosQ[Convert.ToInt32(ArrColors[11]) - 1];  //DBR

        ResultSteps = RubikSolve.GetResult(sInput);
    }

}