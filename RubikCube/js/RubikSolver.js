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
    };

    RubikSolver.prototype.GetResultCFOPStep = function (sCube) {
        //先做底十字
        var sSteps = '';
        for (var i = 0; i < 4; i++) {
            sSteps += this.DownCross(sCube);
            sSteps += 'Y';
        }
        return sSteps;

    };

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


    /**
     * 底十字， downCross
     * @param sCube
     */
    this.isDownCross = function (sCube) {
        var vCube = sCube.split(" ");
        return ("DF" == vCube[4] && "DR" == vCube[5] && "DB" == vCube[6] && "DL" == vCube[7]);
    };
    /**
     *
     * @param sCube
     * @returns {*}
     * @constructor
     */
    this.DownCross = function (sCube) {
        var sSteps = '';
        if (!this.isDownCross(sCube)) {
            // 对底部的边, 或者叫底部十字（Down Cross)
            // 说白了就是，先找一个DOWN FRONT的面。魔方的边一共有12个，加上有可能反，所以一共有24种可能。
            // 底边是DF,在4位。
            // 查看中间一层有没有白色。
            //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
            var vCube = sCube.split(" "); //把字串魔方表达变为字符数组。
            // 顶层
            if ("DF" == vCube[0]) { //顶
                return "FF";
            }
            if ("FD" == vCube[0]) { //顶反的
                return "FDrd";
            }
            if ("DF" == vCube[1]) { //顶 UR
                return "UFF";
            }
            if ("FD" == vCube[1]) { //顶反的
                return "UFDrd";
            }
            if ("DF" == vCube[2]) { //顶 UB
                return "uuFF";
            }
            if ("FD" == vCube[2]) { //顶反的
                return "uuFDrd";
            }
            if ("DF" == vCube[3]) { //顶 UL
                return "uFF";
            }
            if ("FD" == vCube[3]) { //顶反的
                return "uFDrd";
            }
            //底层
            if ("DF" == vCube[4]) { //已经对好了 DF, 转一下。
                return "y";
            }
            if ("FD" == vCube[4]) { //反的
                return "FdLD";
            }
            if ("DF" == vCube[5]) { //底 DR
                return "RDrd";
            }
            if ("FD" == vCube[5]) { //反的
                return "RF";
            }
            if ("DF" == vCube[6]) { //底 DB
                return "BDDbdd";
            }
            if ("FD" == vCube[6]) { //反的
                return "BDRd";
            }
            if ("DF" == vCube[7]) { //底 DL
                return "LdlD";
            }
            if ("FD" == vCube[7]) { //反的
                return "lf";
            }
            //中层
            if ("DF" == vCube[8]) { //中层 FR
                return "Drd";
            }
            if ("FD" == vCube[8]) { //反的
                return "F";
            }
            if ("DF" == vCube[9]) { //中 FL
                return "dLD";
            }
            if ("FD" == vCube[9]) { //反的
                return "f";
            }
            if ("DF" == vCube[10]) { //中 BR
                return "DRd";
            }
            if ("FD" == vCube[10]) { //反的
                return "DDbdd";
            }
            if ("DF" == vCube[11]) { //中 BL
                return "dlD";
            }
            if ("FD" == vCube[11]) { //反的
                return "DDBdd";
            }
        }
        return sSteps;
    };
    this.isDownCorner = function (sCube) {
        var vCube = sCube.split(" ");
        return ('DRF' == vCube[16] && "DFL" == vCube[17] && "DLB" == vCube[18] && "DBR" == vCube[19]);
    };
    /**
     *
     * @param sCube
     * @returns {string}
     * @constructor
     */
    this.DownCorner = function (sCube) {
        // F2L，有41种情况
        var sSteps = '';

        //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
        //  0  1  2  3  4  5  6  7  8  9  10 11 12  13  14  15  16  17  18  19
        if (this.isDownCorner(sCube)) return sSteps;
        var vCube = sCube.split(" ");
        // 就做DRF,只做底右前那个角，其它角转一下就是了。

        if ('DRF' == vCube[16]) {
            //已经对好
            sSteps = 'y';
        } else {

            //24位置，开始找。也可以分个类，下面四个角，上面四个角
            if ('RFD' == vCube[13]) {
                sSteps = "fUF";
            }
            if ('RFD' == vCube[12]) {
                sSteps = "ufUF";
            }
            if ('RFD' == vCube[14]) {
                sSteps = "UfUF";
            }
            if ('RFD' == vCube[15]) {
                sSteps = "uufUF";
            }
            if ('FDR' == vCube[12]) {
                sSteps = "URur";
            }
            if ('FDR' == vCube[15]) {
                sSteps = "Rur";
            }
            if ('FDR' == vCube[13]) {
                sSteps = "uRur";
            }
            if ('FDR' == vCube[14]) {
                sSteps = "uuRur";
            }
            // 白朝上。挪下来
            if ('DRF' == vCube[12] || 'DFR' == vCube[12]) {
                sSteps = "Rur";
            }
            if ('DRF' == vCube[13] || 'DFR' == vCube[13]) {
                sSteps = "URur";
            }
            if ('DRF' == vCube[14] || 'DFR' == vCube[14]) {
                sSteps = "uuRur";
            }
            if ('DRF' == vCube[15] || 'DFR' == vCube[15]) {
                sSteps = "uRur";
            }
            // 白在下面。挪上去
            if ('DFR' == vCube[16] || 'RDF' == vCube[16] || 'RFD' == vCube[16] || 'FDR' == vCube[16]
                || 'FRD' == vCube[16]) {
                sSteps = "Rur";
            }
            if ('DRF' == vCube[17] || 'DFR' == vCube[17] || 'RDF' == vCube[17] || 'RFD' == vCube[17]
                || 'FDR' == vCube[17] || 'FRD' == vCube[17]) {
                sSteps = "Fuf";
            }
            if ('DRF' == vCube[18] || 'DFR' == vCube[18] || 'RDF' == vCube[18] || 'RFD' == vCube[18]
                || 'FDR' == vCube[18] || 'FRD' == vCube[18]) {
                sSteps = "Lul";
            }
            if ('DRF' == vCube[19] || 'DFR' == vCube[19] || 'RDF' == vCube[19] || 'RFD' == vCube[19]
                || 'FDR' == vCube[19] || 'FRD' == vCube[19]) {
                sSteps = "ruR";
            }
        }
        return sSteps;
    };
    this.isSecondLayer = function (sCube) {
        var vCube = sCube.split(" ");
        return ('FR' == vCube[8] && "FL" == vCube[9] && "BR" == vCube[10] && "BL" == vCube[11]);
    };
    /**
     *
     * @param sCube
     * @returns {string}
     * @constructor
     */
    this.SecondLayer = function (sCube) {
        // F2L，有41种情况
        // 解中间边，第二层边。就是那个“来去回回，送孩子回家".
        var sSteps = '';
        //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
        //  0  1  2  3  4  5  6  7  8  9  10 11 12  13  14  15  16  17  18  19
        if (this.isSecondLayer(sCube)) return sSteps;
        var vCube = sCube.split(" ");
        // 还是只做一个边，其它边转过来就是了。
        // 就做FR,前右这个边。
        if ('FR' == vCube[8]) {
            sSteps = 'y'; // 已经对好了，转一下。
        }
        else {
            // 开始找FR，现在FR有八个位置,16种情况。
            if ('RF' == vCube[0] || 'RF' == vCube[8]) {
                // 最标准的情况。或者反了，就把那个给弄上去。
                sSteps = "URurufUF";
            }
            if ('RF' == vCube[1]) {
                // RF转一下就变成了情况一。。
                sSteps = "U";
            }
            if ('RF' == vCube[2]) {
                // RF转一下就变成了情况一。。
                sSteps = "UU";
            }
            if ('RF' == vCube[3]) {
                // RF转一下就变成了情况一。。
                sSteps = "u";
            }
            // 开始找FR，现在FR有八个位置,16种情况。
            if ('FR' == vCube[0]) {
                // 最标准的情况。
                sSteps = "u";
            }
            if ('FR' == vCube[1]) {
                // RF转一下就变成了情况一。。
                sSteps = "YulULUFufy";
            }
            if ('FR' == vCube[2]) {
                // RF转一下就变成了情况一。。
                sSteps = "U";
            }
            if ('FR' == vCube[3]) {
                // RF转一下就变成了情况一。。
                sSteps = "UU";
            }
            // FR在第二层，弄上去。
            if ('FR' == vCube[9] || 'RF' == vCube[9]) {
                // FR在左前，转一下，弄上去
                sSteps = "yURurufUFY";
            }
            if ('FR' == vCube[10] || 'RF' == vCube[10]) {
                // FR在右后，转一下，弄上去
                sSteps = "YURurufUFYy";
            }
            if ('FR' == vCube[11] || 'RF' == vCube[11]) {
                // FR在左后，转一下，弄上去
                sSteps = "yyURurufUFYY";
            }
        }
        return sSteps;
    };
    this.nUpCrossCount = function (sCube) {
        var vCube = sCube.split(" ");
        var nSum = 0;
        for (var i = 0; i < 4; i++) {
            nSum += ('U' == vCube[i][0]);
        }
        return nSum;
    };
    this.isUpCross = function (sCube) {
        return (4 == this.nUpCrossCount(sCube));
    };
    /**
     *
     * @param sCube
     * @returns {string}
     * @constructor
     */
    this.UpCross = function (sCube) {
        //做顶十字。有个很好的算法，计上面的块数，== 4就是十字了，0就一个没有。2，3就是一字。
        // 用OLL ，可以一步成面，但是有57个公式。
        var sSteps = '';
        //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
        //  0  1  2  3  4  5  6  7  8  9  10 11 12  13  14  15  16  17  18  19
        if (this.isUpCross(sCube)) return sSteps;
        var vCube = sCube.split(" ");

        var nSum = this.nUpCrossCount(sCube);

        switch (nSum) {
            case 4:
                break;
            case 0:
                sSteps = 'FRUruf';
                break;
            case 3:
                sSteps = 'FRUruf';
                break;
            case 2:
                if ('U' == vCube[1][0] && 'U' == vCube[3][0]) {
                    sSteps = 'FRUruf';
                } else {
                    if ('U' == vCube[0][0] && 'U' == vCube[1][0])
                        sSteps = 'FRUruf';
                    else {
                        sSteps = 'y';
                    }
                }
                break;
            default:
                sSteps = 'FRUruf';
                break;
        }
        return sSteps;
    };
    this.nUpCornerCount = function (sCube) {
        var vCube = sCube.split(" ");
        var nSum = 0;
        for (var i = 12; i < 16; i++) {
            nSum += ('U' == vCube[i][0]);
        }
        return nSum;
    };
    this.isUpCorner = function (sCube) {
        return (4 == this.nUpCornerCount(sCube));
    };
    /**
     *
     * @param sCube
     * @returns {string}
     * @constructor
     */
    this.UpCorner = function (sCube) {
        // 顶面颜色统一(OLL)
        //做顶面，就是要做小鱼了。
        // 第三步、顶面颜色统一(OLL)
        // 共有57种情况
        // 十字后有7种

        var sSteps = '';
        //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
        //  0  1  2  3  4  5  6  7  8  9  10 11 12  13  14  15  16  17  18  19
        if (this.isUpCorner(sCube)) return sSteps;
        var vCube = sCube.split(" ");

        var nSum = this.nUpCornerCount(sCube);

        switch (nSum) { // n有四种情况，一共有7种情况，二个小鱼，二个十，二个由，一个半田
            case 4:
                break;
            case 0:
                // 十字
                if ('U' == vCube[12][1] && 'U' == vCube[13][2]
                    && 'U' == vCube[14][1] && 'U' == vCube[15][2]) { // UFR(F-U) URB(B-U) UBL(B-U) ULF(F-U)向上的十字
                    sSteps = 'RuuruRUruRur';
                }
                else {
                    if ('U' == vCube[12][1] && 'U' == vCube[13][2]
                        && 'U' == vCube[14][2] && 'U' == vCube[15][1]) { // UFR(F-U) URB(B-U) UBL(L-U) ULF(L-U)
                        // 向右的十字,火箭
                        sSteps = 'RuuRRurruRRuuR';
                    } else {
                        sSteps = 'y';
                    }
                }
                break;
            case 1:
                // 小鱼
                if ('U' == vCube[14][0] && 'U' == vCube[12][2]) // UBL UFR 上前右，小鱼1
                {
                    sSteps = 'ruRuruuR';
                } else if ('U' == vCube[15][0] && 'U' == vCube[13][1]) //ULF// URB 上前右，小鱼2
                {
                    sSteps = 'RUrURUUr';
                }
                else {
                    sSteps = 'y';
                }
                break;
            case  2:
                // 由 或者另一个型 ,共三种型。
                if ('U' == vCube[12][0] && 'U' == vCube[13][2]
                    && 'U' == vCube[14][1] && 'U' == vCube[15][0]) { // UFR(U-U) URB(B-U) UBL(B-U) ULF(-U)向上的由字
                    sSteps = 'RRdRuurDRuuR';
                } else {
                    if ('U' == vCube[12][0] && 'U' == vCube[13][0]
                        && 'U' == vCube[14][1] && 'U' == vCube[15][2]) { // UFR(U-U) URB(U-U) UBL(B-U) ULF(F-U)向左的由字
                        sSteps = 'RmUrurMFRf'; // 不用速了，用小鱼1,用速，把r翻译为Rm
                        // rUR'U'r'FR F'
                    }
                    else {
                        if ('U' == vCube[12][1] && 'U' == vCube[13][0]
                            && 'U' == vCube[14][2] && 'U' == vCube[15][0]) { // UFR(F-U) URB(U-U) UBL(L-U) ULF(U-U)半田
                            sSteps = 'fRmUrurMFR'; // 不用速了，用小鱼1用速，把r翻译为Rm
                            // F' rUR'U'r'FR
                        }
                        else {
                            sSteps = 'y';
                        }
                    }
                }
                break;
            default:
                break;
        }
        return sSteps;
    };
    this.nUpCornerSnap = function (sCube) {
        //UFR URB UBL ULF 顶面四角朝向
        // 12
        var vCube = sCube.split(" ");
        var nSum = 0;
        nSum += (vCube[12][2] == vCube[13][1]); // UF(R) == U(R)B
        nSum += (vCube[13][2] == vCube[14][1]); // UR(B) == U(B)L
        nSum += (vCube[14][2] == vCube[15][1]); // UB(L) == U(L)F
        nSum += (vCube[15][2] == vCube[12][1]); // UL(F) == U(F)R
        return nSum;
    };
    this.isUpCornerSnap = function (sCube) {
        return (4 == this.nUpCornerSnap(sCube));
    };
    /**
     *
     * @param sCube
     * @returns {string}
     * @constructor
     */
    this.UpCornerSnap = function (sCube) {
        // 顶面四角相同，颜色统一(PLL)
        //做顶面角。
        var sSteps = '';
        //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
        //  0  1  2  3  4  5  6  7  8  9  10 11 12  13  14  15  16  17  18  19
        if (this.isUpCornerSnap(sCube)) return sSteps;
        var vCube = sCube.split(" ");

        var nSum = this.nUpCornerSnap(sCube);

        switch (nSum) { // n有3种情况，4 就是OK了。0 就是做一下，1就是有一边相同，放右边，不在右边转一下。
            case 4:
                // 角全部相同
                // 如果边和面不区配就转一下。
                if ('F' != vCube[12][1]) { // U(F)R
                    sSteps = 'u';
                } // u
                break;
            case 0:
                // 没有相同的角，直接做一遍公式
                sSteps = 'xRRDDruRDDrUrX';
                break;
            case 1:
                // 小鱼
                if (vCube[12][2] == vCube[13][1]) // 右边相同, UF(R) == U(R)B
                {
                    sSteps = 'xRRDDruRDDrUrX';
                }
                else { //不同转一下，到右边相同为止。
                    sSteps = 'y';
                }
                break;
            default:
                break;
        }
        return sSteps;
    };
    this.nUpBorderSnap = function (sCube) {
        //UFR URB UBL ULF 顶面四边相同否
        // 12
        var vCube = sCube.split(" ");
        var nSum = 0;
        nSum += (vCube[0][1] == vCube[12][1]); // U（F） == U（F）R
        nSum += (vCube[1][1] == vCube[13][1]); // U(R) == U(R)B
        nSum += (vCube[2][1] == vCube[14][1]); // U(B) == U(B)L
        nSum += (vCube[3][1] == vCube[15][1]); // U(L) == U(L)F
        return nSum;
    };
    this.isUpBorderSnap = function (sCube) {
        return (4 == this.nUpBorderSnap(sCube));
    };
    /**
     *
     * @param sCube
     * @returns {string}
     * @constructor
     */
    this.UpBorderSnap = function (sCube) {
        // 顶面四角相同，颜色统一(PLL)
        //做顶面角。
        var sSteps = '';
        //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
        //  0  1  2  3  4  5  6  7  8  9  10 11 12  13  14  15  16  17  18  19
        var vCube = sCube.split(" ");

        var nSum = this.nUpBorderSnap(sCube);

        switch (nSum) { // n有3种情况，4 就是OK了。0 就是做一下，1就是有一边相同，看顺时还是逆时，逆时小鱼1,然后小鱼2。
            case 4:
                // 角全部相同
                // 如果边和面不区配就转一下。
                if ('F' != vCube[0][1]) { // U(F)
                    sSteps = 'u';
                } // u
                break;
            case 0:
                // 没有相同的角，直接做一遍公式 PLL01
                sSteps = 'lUlululULULL';
                break;
            case 1:
                // 有一边一致
                if (vCube[2][1] == vCube[14][1]) // 后边相同，就可以用公式了，, U(B) == U(B)L
                {
                    if (vCube[0][1] == vCube[15][1])    //需要顺时针 需要将U(F) = U(L)F
                        sSteps = 'lUlululULULL';  //PLL 01
                    else
                        sSteps = 'RuRURURururr'; //PLL02
                }
                else { //不同转一下，到后边相同为止。
                    sSteps = 'y';
                }
                break;
            default:
                break;
        }
        return sSteps;
    };
    /**
     *
     * @param sCube
     * @returns {string}
     * @constructor
     */
    this.CFOPF2L = function (sCube) {
        // F2L：（First two Layers) 意思是同时对好前两层
        //共有41种情况。
        var sSteps = '';
        //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
        //  0  1  2  3  4  5  6  7  8  9  10 11 12  13  14  15  16  17  18  19
        var vCube = sCube.split(" ");


        if ('D' == vCube[16][0] && 'R' == vCube[16][1] && 'F' == vCube[16][2]) // DRF 到位, 第一层已经对好,三种情况。
        {
            if ('F' == vCube[1][0] && 'R' == vCube[1][1])  // (U)R == F U（R) = R
            //case 1, 来去回回
            {
                sSteps = 'ufUFURur';    // U'F'UFURU'R'
            }
            if ('R' == vCube[0][0] && 'F' == vCube[0][1])  // (U)F == R U（F) = F
            //case 2, 左边 来去回回
            {
                sSteps = 'URurufUF';    // URU'R'U'F'UF
            }
            if ('R' == vCube[8][0] && 'F' == vCube[8][1])  // (F)R == R F（R) = F
            //case 3 第二层，换益
            {
                sSteps = 'URurufUF';    // (RU2R'U)2F'U'F
            }
        }

        return sSteps;
    };
    /**
     *
     * @param sCube
     * @returns {string}
     * @constructor
     */
    this.CFOPOLL = function (sCube) {
        // OLL：(orientation of last layer).调整好最后一层的朝向
        // 一步将顶十字和顶小鱼完成，就是做完F2L的两层后，一步打顶面对成全色。
        // 共有57种情况。
        var sSteps = '';
        //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
        //  0  1  2  3  4  5  6  7  8  9  10 11 12  13  14  15  16  17  18  19
        var vCube = sCube.split(" ");


        if ('D' == vCube[16][0] && 'R' == vCube[16][1] && 'F' == vCube[16][2]) // DRF 到位, 第一层已经对好,三种情况。
        {
            if ('F' == vCube[1][0] && 'R' == vCube[1][1])  // (U)R == F U（R) = R
            //case 1, 来去回回
            {
                sSteps = 'ufUFURur';    // U'F'UFURU'R'
            }
            if ('R' == vCube[0][0] && 'F' == vCube[0][1])  // (U)F == R U（F) = F
            //case 2, 左边 来去回回
            {
                sSteps = 'URurufUF';    // URU'R'U'F'UF
            }
            if ('R' == vCube[8][0] && 'F' == vCube[8][1])  // (F)R == R F（R) = F
            //case 3 第二层，换益
            {
                sSteps = 'URurufUF';    // (RU2R'U)2F'U'F
            }
        }

        return sSteps;
    };
    /**
     *
     * @param sCube
     * @returns {string}
     * @constructor
     */
    this.CFOPPLL = function (sCube) {
        // PLL (permutation of last layer,调整好最后一层的顺序)
        // 顶面全色后，一步将顶面的顺序调好，变成六面。即将四角移动，四边移动换为一步。
        // 共21种。
        var sSteps = '';
        //  UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR 是解好的。
        //  0  1  2  3  4  5  6  7  8  9  10 11 12  13  14  15  16  17  18  19
        var vCube = sCube.split(" ");

        var nSum = this.nUpBorderSnap(sCube);

        switch (nSum) { // n有3种情况，4 就是OK了。0 就是做一下，1就是有一边相同，看顺时还是逆时，逆时小鱼1,然后小鱼2。
            case 4:
                // 边全部相同
                // 如果边和面不区配就转一下。
                if ('F' != vCube[0][1]) { // U(F)
                    sSteps = 'u';
                } // u
                break;
            case 0:
                // 没有相同的边，有两种情况，对面换或相邻换
                if (vCube[0][1] == vCube[2][1]) // 前面和后边相同，对面换， U(F) == U(B)
                {
                    sSteps = 'MMuMMuuMMuMM';  // PLL04 M2U'M2U'2M2U' M2
                }
                else {
                    sSteps = 'UMuMMuMMuMUUMM'; // PLL03 U MU'M2U'M2U'MU2M2
                }
                break;
            case 1:
                // 有一边一致
                if (vCube[2][1] == vCube[14][1]) // 后边相同，就可以用公式了，, U(B) == U(B)L
                {
                    if (vCube[0][1] == vCube[15][1])    //需要顺时针 需要将U(F) = U(L)F
                        sSteps = 'lUlululULULL';  //PLL 01
                    else
                        sSteps = 'RuRURURururr'; //PLL02
                }
                else { //不同转一下，到后边相同为止。
                    sSteps = 'y';
                }
                break;
            default:
                break;
        }
        return sSteps;
    };
}
