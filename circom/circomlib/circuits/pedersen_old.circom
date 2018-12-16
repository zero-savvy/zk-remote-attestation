
include "escalarmul.circom";

template Pedersen(n) {
    signal input in[n];
    signal output out[2];

    var nexps = ((n-1) \ 250) + 1;
    var nlastbits = n - (nexps-1)*250;

    component escalarMuls[nexps];

    var PBASE = [
        [10457101036533406547632367118273992217979173478358440826365724437999023779287,19824078218392094440610104313265183977899662750282163392862422243483260492317],
        [2671756056509184035029146175565761955751135805354291559563293617232983272177,2663205510731142763556352975002641716101654201788071096152948830924149045094],
        [5802099305472655231388284418920769829666717045250560929368476121199858275951,5980429700218124965372158798884772646841287887664001482443826541541529227896],
        [7107336197374528537877327281242680114152313102022415488494307685842428166594,2857869773864086953506483169737724679646433914307247183624878062391496185654],
        [20265828622013100949498132415626198973119240347465898028410217039057588424236,1160461593266035632937973507065134938065359936056410650153315956301179689506],
        [1487999857809287756929114517587739322941449154962237464737694709326309567994,14017256862867289575056460215526364897734808720610101650676790868051368668003],
        [14618644331049802168996997831720384953259095788558646464435263343433563860015,13115243279999696210147231297848654998887864576952244320558158620692603342236],
        [6814338563135591367010655964669793483652536871717891893032616415581401894627,13660303521961041205824633772157003587453809761793065294055279768121314853695],
        [3571615583211663069428808372184817973703476260057504149923239576077102575715,11981351099832644138306422070127357074117642951423551606012551622164230222506],
        [18597552580465440374022635246985743886550544261632147935254624835147509493269,6753322320275422086923032033899357299485124665258735666995435957890214041481]
    ];

    var i;
    var j;
    var nexpbits;
    for (i=0; i<nexps; i++) {
        nexpbits = (i == nexps-1) ? nlastbits : 250;
        escalarMuls[i] = EscalarMul(nexpbits, PBASE[i]);

        for (j=0; j<nexpbits; j++) {
            escalarMuls[i].in[j] <== in[250*i + j];
        }

        if (i==0) {
            escalarMuls[i].inp[0] <== 0;
            escalarMuls[i].inp[1] <== 1;
        } else {
            escalarMuls[i].inp[0] <== escalarMuls[i-1].out[0];
            escalarMuls[i].inp[1] <== escalarMuls[i-1].out[1];
        }
    }

    escalarMuls[nexps-1].out[0] ==> out[0];
    escalarMuls[nexps-1].out[1] ==> out[1];
}
