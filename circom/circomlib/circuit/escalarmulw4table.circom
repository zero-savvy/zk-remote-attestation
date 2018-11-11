function pointAdd(x1,y1,x2,y2) {
    var a = 168700;
    var d = 168696;

    var res[2];
    res[0] = (x1*y2 + y1*x2) / (1 + d*x1*x2*y1*y2);
    res[1] = (y1*y2 - a*x1*x2) / (1 - d*x1*x2*y1*y2);
    return res;
}

template EscalarMulW4Table(base, k) {
    signal output out[16][2];

    var i;
    var p[2];

    var dbl = base;

    for (i=0; i<k*4; i++) {
        dbl = pointAdd(dbl[0], dbl[1], dbl[0], dbl[1]);
    }

    out[0][0] <== 0;
    out[0][1] <== 1;
    for (i=1; i<16; i++) {
        p = pointAdd(out[i-1][0], out[i-1][1], dbl[0], dbl[1]);
        out[i][0] <== p[0];
        out[i][1] <== p[1];
    }
}
