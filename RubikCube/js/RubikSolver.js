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

var faces = "RLFBUD";
var order = "AECGBFDHIJKLMSNTROQP".split("");
var bithash = "TdXhQaRbEFIJUZfijeYV".split("");
var perm = "AIBJTMROCLDKSNQPEKFIMSPRGJHLNTOQAGCEMTNSBFDHORPQ".split("");
var pos = new Array(20);
var ori = new Array(20);
var val = new Array(20);     // 原来是char
var tables = new Array(8);  //TODO: 二维数组，得看一下需要怎么处理。
var move = new Uint32Array(20);
var moveamount = new Uint32Array(20);
var phase = 0;
var tablesize = [1, 4096, 6561, 4096, 256, 1536, 13824, 576];
var CHAROFFSET = 65;

var isDebug = true;
function debug(s) {
    if (isDebug) {
       // console.write(s)
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
function Char2Num(c) {
    // debug("Char2Num " + c + ":" + (c.charCodeAt(0) - CHAROFFSET).toString() + "|");
    return c.charCodeAt(0) - CHAROFFSET;   // (int)c - CHAROFFSET;
}

/**
 *
 * @param p
 * @param a
 * @param offset
 */
function cycle(p, a, offset) {
    var temp = p[Char2Num(a[0 + offset])];
    p[Char2Num(a[0 + offset])] = p[Char2Num(a[1 + offset])];
    p[Char2Num(a[1 + offset])] = temp;
    temp = p[Char2Num(a[0 + offset])];
    p[Char2Num(a[0 + offset])] = p[Char2Num(a[2 + offset])];
    p[Char2Num(a[2 + offset])] = temp;
    temp = p[Char2Num(a[0 + offset])];
    p[Char2Num(a[0 + offset])] = p[Char2Num(a[3 + offset])];
    p[Char2Num(a[3 + offset])] = temp;
}

/**
 *
 * @param i
 * @param a
 */

function twist(i, a) {
    // i -= CHAROFFSET;
    var index = i.charCodeAt(0) - CHAROFFSET;
    ori[index] = String.fromCharCode(((ori[index]).charCodeAt(0) + a + 1) % val[index].charCodeAt(0));
}

function reset() {
    for (var i = 0; i < 20; pos[i] = String.fromCharCode(i), ori[i++] = String.fromCharCode('\0')) ;
}
/**
 *
 * @param p
 * @param offset
 * @returns {number}
 */
function permtonum(p, offset) {
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
function numtoperm(p, n, o) {
    //p += o;
    p[3 + o] = String.fromCharCode(o);
    for (var a = 3; a-- > 0;) {
        p[a + o] = String.fromCharCode(n % (4 - a) + o);
        n /= 4 - a;
        for (var b = a; ++b < 4;) {
            if (p[b + o] >= p[a + o]) {
                // p[b + o]++;
                p[b + o] = String.fromCharCode((p[b + o]).charCodeAt(0) + 1); //todo 这里又是个古怪的地方，Conver,ToChar 对应的String.fromCharCode
            }
        }
    }
}
/**
 *
 * @param t
 * @returns {number}
 */
function getposition(t) {
    var i = -1, n = 0;
    switch (t) {
        case 1:
            for (; ++i < 12;) n += (ori[i]).charCodeAt(0) << i;  //todo
            break;
        case 2:
            for (i = 20; --i > 11;) n = n * 3 + ori[i].charCodeAt(0);
            break;
        case 3:
            for (; ++i < 12;) n += (((pos[i].charCodeAt(0)) & 8) > 0) ? (1 << i) : 0;
            break;
        case 4:
            for (; ++i < 8;) n += (((pos[i].charCodeAt(0)) & 4) > 0) ? (1 << i) : 0;
            break;
        case 5:
            var corn = new Uint32Array(8);
            var corn2 = new Uint32Array(4);
            var j, k, l;
            k = j = 0;
            for (; ++i < 8;)
                if (((l = pos[i + 12] - 12) & 4) > 0) {
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
            n = permtonum(pos, 0) * 576 + permtonum(pos, 4) * 24 + permtonum(pos, 12);
            break;
        case 7:
            n = permtonum(pos, 8) * 24 + permtonum(pos, 16);
            break;

    }
    return n;
}

/**
 *
 * @param t
 * @param n
 */
function setposition(t, n) {
    var i = 0, j = 12, k = 0;
    var corn = "QRSTQRTSQSRTQTRSQSTRQTSR".split("");
    debug("<br/>Begin setposition -- " + t.toString() + " -- " + n + " == ");
    reset();

    switch (t) {
        // case 0 does nothing so leaves cube solved

        case 1://edgeflip
            for (; i < 12; i++, n >>= 1) {
                ori[i] = String.fromCharCode(n & 1);
                debug("ori[" +i + "]:" + ori[i] + "|");
            }
            break;
        case 2://cornertwist
            for (i = 12; i < 20; i++, n /= 3) {
                ori[i] = String.fromCharCode(n % 3);
                debug(i + ":" + ori[i] + "|");
            }
            break;
        case 3://middle edge choice
            for (; i < 12; i++, n >>= 1) pos[i] = String.fromCharCode(8 * n & 8);
            break;
        case 4://ud slice choice
            for (; i < 8; i++, n >>= 1) pos[i] = String.fromCharCode(4 * n & 4);
            break;
        case 5://tetrad choice,parity,twist
            var offset = n % 6 * 4;
            n /= 6;
            for (; i < 8; i++, n >>= 1)
                pos[i + 12] = String.fromCharCode(((n & 1) > 0) ? corn[offset + k++].charCodeAt(0) - CHAROFFSET : j++);
            break;
        case 6://slice permutations
            numtoperm(pos, n % 24, 12);
            n /= 24;
            numtoperm(pos, n % 24, 4);
            n /= 24;
            numtoperm(pos, n, 0);
            break;
        case 7://corner permutations
            numtoperm(pos, n / 24, 8);
            numtoperm(pos, n % 24, 16);
            break;
    }
}
/**
 *
 * @param m
 */
function domove(m) {
    //char* p = perm + 8 * m;
    var offset = 8 * m;
    var i = 8;
    //cycle the edges
    cycle(pos, perm, offset);
    cycle(ori, perm, offset);
    //cycle the corners
    cycle(pos, perm, offset + 4);
    cycle(ori, perm, offset + 4);
    //twist corners if RLFB
    if (m < 4)
        for (; --i > 3;) twist(perm[i + offset], i & 1);
    //flip edges if FB
    if (m < 2)
        for (i = 4; i-- > 0;) twist(perm[i + offset], 0);
}

/**
 * filetable() 构造解方案表*
 * @param ti
 */
function filltable(ti)
{
    debug("<br/>Begin fill table: " + ti + " -- ");
    var n = 1;
    var l = 1;
    var tl = tablesize[ti];

    debug(tl);
    var tb = new Array(tl);
    tables[ti] = tb;

    for (var i = 0; i < tb.Length; i++) tb[i] = String.fromCharCode(0); // ('\0');

    reset();
    tb[getposition(ti)] = String.fromCharCode(1);

    debug("!" + tb[getposition(ti)] + "|" + getposition(ti) + "!");

    // while there are positions of depth l
    while (n > 0) {
        n = 0;
        // find each position of depth l
        for (var i = 0; i < tl; i++) {
            // debug("i=" + i + "/" + tl + "<br/>")
            if (tb[i] == l) {
                //construct that cube position
                setposition(ti, i);
                // try each face any amount
                for (var f = 0; f < 6; f++) {
                    for (var q = 1; q < 4; q++) {
                        domove(f);
                        // get resulting position
                        var r = getposition(ti);
                        // if move as allowed in that phase, and position is a new one
                        if ((q == 2 || f >= (ti & 6)) && tb[r] == '\0') {
                            // mark that position as depth l+1
                            tb[r] = String.fromCharCode(l + 1);
                            debug(tb[r] + " ");
                            n++;
                        }
                    }
                    domove(f);
                }
            }
        }
        l++;
    }
    debug("End fill table<br/> ");

}

/**
 * searchphase 解魔方。
 * @param movesleft
 * @param movesdone
 * @param lastmove
 * @returns {boolean}
 */
function searchphase(movesleft, movesdone, lastmove) {
    debug("<br/>searchphase: " +movesleft + "|" + movesdone + "|" +lastmove + "<br/>" )

    debug("phase=" + phase + "  " + "getposition(phase)=" + getposition(phase) + "|");

    if ((tables[phase][getposition(phase)]) - 1 > movesleft ||
        (tables[phase + 1][getposition(phase + 1)]) - 1 > movesleft) return false;

    if (movesleft == 0) return true;

    for (var i = 6; i-- > 0;) {
        if ((i - lastmove != 0) && ((i - lastmove + 1) != 0 || ((i | 1) != 0))) {
            move[movesdone] = i;
            for (var j = 0; ++j < 4;) {
                domove(i);
                moveamount[movesdone] = j;
                if ((j == 2 || i >= phase) &&
                    searchphase(movesleft - 1, movesdone + 1, i)) return true;
            }
            domove(i);
        }
    }
    return false;
}

/**
 *
 * @constructor
 */
function RubikSolver() {
    RubikSolver.prototype.GetResult = function (sInput) {
        phase = 0;

        var argv = sInput.split(' ');
        var sOutput = "";

        if (argv.length != 20) {
            return "error";
        }

        var f, i = 0, j = 0, k = 0, pc, mor;

        debug("<br/>开始 val: -------------<br/>")

        for (; k < 20; k++) {
            val[k] = String.fromCharCode(k < 12 ? 2 : 3);
            debug(k.toString() + "-" + val[k] + "|");  //TODO: debug
        }

        debug("<br/>开始 filltable: -------------<br/>")
        for (; j < 8; j++) {
            filltable(j);
        }
        debug("<br/>开始处理 -------------<br/>");
        for (; i < 20; i++) {
            debug("i=" + i);
            f = pc = k = mor = 0;
            for (; f < val[i].charCodeAt(0); f++)                // c#和javascript 关于字符处理我也是醉了
            {
                j = faces.indexOf(argv[i][f]);
                debug("  face " + j);
                if (j > k) {
                    k = j;
                    mor = f;
                }
                pc += 1 << j;
            }
            for (f = 0; f < 20; f++) {
                // debug("pc=" + pc +"/" + (bithash[f].charCodeAt(0) - 64))
                if (pc == bithash[f].charCodeAt(0) - 64) {
                    debug(" || hit pc=" + pc)
                    break;
                }
            }
            debug(" --- ");
            pos[order[i].charCodeAt(0) - CHAROFFSET] = String.fromCharCode(f);
            debug(" pos[" + order[i] + ":" + (order[i].charCodeAt(0) - CHAROFFSET) + "] = ");
            debug(f + "|")
            ori[order[i].charCodeAt(0) - CHAROFFSET] = String.fromCharCode(mor % val[i].charCodeAt(0));
            debug("ori[" + (order[i].charCodeAt(0) - CHAROFFSET).toString() + "]=" + (mor % val[i].charCodeAt(0)).toString() + "<br/>")
        }

        debug("<br/>开始解<br/>");
        for (; phase < 8; phase += 2) {

            for (j = 0; !searchphase(j, 0, 9); j++) ;
            for (i = 0; i < j; i++) {
                sOutput += "FBRLUD"[move[i]] + "" + moveamount[i].ToString();
                sOutput += " ";
                debug(sOutput);
            }
        }

        return sOutput;
    }
}
