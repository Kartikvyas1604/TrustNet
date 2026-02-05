// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 6319631085699771356371732158037637918853041098260465807534526656798575975739;
    uint256 constant alphay  = 1953296531243881447533009303250926656221260411896709950824082752235420238158;
    uint256 constant betax1  = 20352583026828182470189869257052788700089228223010851268855080516802578650045;
    uint256 constant betax2  = 3774334117583986382912307856497546188471654733676811111153424233045700233216;
    uint256 constant betay1  = 18483339009499521592920883729803503704553833822577808183020666819006613214630;
    uint256 constant betay2  = 9069003011877637172782002471969326632017297515235251247501583503764040920051;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 8830003166000206502557248059305287849400149036987884700423056075510083344771;
    uint256 constant deltax2 = 13661265444729366786816335330041672760295526301261553490844046598148425056874;
    uint256 constant deltay1 = 152588346330271590876808363258021035345428931224554777111794456592713477647;
    uint256 constant deltay2 = 20244755874465197051200052425939293064264866366985414460187769711164387160674;

    
    uint256 constant IC0x = 3740419958112716119267678300042630523286931522027599633019500948698870963038;
    uint256 constant IC0y = 14047884518206190304812826549686093504625761113537539592598127417245604924692;
    
    uint256 constant IC1x = 10240367408676437324018560925645668722869640471534520827590726327366378523666;
    uint256 constant IC1y = 14305900726451683487211979408563542313814812354847301476716635710778746589195;
    
    uint256 constant IC2x = 16375661274318278759481941824990846509331570968114778482742990458834208469569;
    uint256 constant IC2y = 16457264656327102117783764756131657090298599703356955084499272519005311362082;
    
    uint256 constant IC3x = 12316540262721619060846178847571598106508363161013124012945421599583847581158;
    uint256 constant IC3y = 1803953373563229633621122851855572015849633402722632785934308786260976966576;
    
    uint256 constant IC4x = 16967195916412287762108674303195306585980494621067647138578863828481811313049;
    uint256 constant IC4y = 15660539497933831134079947707518331653743153553075508789455916528951136643229;
    
    uint256 constant IC5x = 12042435742322791847683682996959149080348739303217507504668023918673183777150;
    uint256 constant IC5y = 5783374265772209241334351684288217741101870386234637269913507296207754156459;
    
    uint256 constant IC6x = 9909222652967064898086213072142788332974610994477412760737809770640248811522;
    uint256 constant IC6y = 8225475592593127608215938617033482960260614734800430747463396786929398977569;
    
    uint256 constant IC7x = 17085269379502960559293590547218775427342784364747946438392307099926521253532;
    uint256 constant IC7y = 13098576489825973344807153221928933879273729601868732954749458201485061802758;
    
    uint256 constant IC8x = 13737214528771190488642058232916260491122787896080994913725830431100221323993;
    uint256 constant IC8y = 16967273518582414553636820086497645183519185101268702508056628438822573551391;
    
    uint256 constant IC9x = 20394898258809482208444773435108171913657638395166076735132125396586498783843;
    uint256 constant IC9y = 20787350549223874977086863186831989058848805414346901357429633328599863505358;
    
    uint256 constant IC10x = 19827658850209725406910505914602435605542501809351866468938061861520162069225;
    uint256 constant IC10y = 12284051301795729564042549193972719892950639793018658039881840845609644010546;
    
    uint256 constant IC11x = 2038023407890781545479176239708880081932101938893725206111031295840858356703;
    uint256 constant IC11y = 7587939488835359297858384254347811426944803536267072662780641253112697135113;
    
    uint256 constant IC12x = 6314805834439802580630483199688588611432476984630390789562096467879826229948;
    uint256 constant IC12y = 567732715485765861713762271231558094046296936348853638453554538610557168856;
    
    uint256 constant IC13x = 13857376604395252554531715893844025743658424679144152818829716985099558017206;
    uint256 constant IC13y = 6487312326887641303607431184383213406377686322033374889264901584267708644563;
    
    uint256 constant IC14x = 10628722903469952814591408790150577438304759293034611327523934151187468719996;
    uint256 constant IC14y = 3630280804993022005931452534467970521918252732771257166569595066496597814747;
    
    uint256 constant IC15x = 16617218559009403266674625982150394290749525128122886534755943570117609016249;
    uint256 constant IC15y = 15391296317508814997492072546185933819216424627308895130365685008879735315575;
    
    uint256 constant IC16x = 21227227472347320888244690227652834295918755865274063044568757432245810961943;
    uint256 constant IC16y = 7573489464921469845823147878288332588460882074029451931225513134230445303494;
    
    uint256 constant IC17x = 2814999448418748131664931568530445255860441023932228350717585502603302016833;
    uint256 constant IC17y = 18320229249746059036562637694892468950165732988763131179995163984578275128985;
    
    uint256 constant IC18x = 1175032402085900536570374291481131023335895988282214988641014660119085427470;
    uint256 constant IC18y = 8869890220407969049020537858704716802651652346487425310398491894401271670340;
    
    uint256 constant IC19x = 18247522037258993423578705626767475716271057605140412542202789324881807712423;
    uint256 constant IC19y = 5254276440570062919750740357939128505903050395601134235963604068676968781513;
    
    uint256 constant IC20x = 1988119222037987990980837294217867966546981277799964499111757397542955663292;
    uint256 constant IC20y = 4676418991754333813691500223619728355398644432258344201442504309408084074038;
    
    uint256 constant IC21x = 16675721607020907308194131960129527212453459078788676244494407168537250790078;
    uint256 constant IC21y = 8358464548479608966580503898269051096174933971858683096224085057796434957687;
    
    uint256 constant IC22x = 7031193511408040132542552027098220371138218680008273624595047927094103451152;
    uint256 constant IC22y = 13619936089953146451542016179741689750245402469008814675329733413832542008142;
    
    uint256 constant IC23x = 8656289197094034467929959650902312940929466527417746093510063331862974751575;
    uint256 constant IC23y = 9748077653092361422075129836190142857042778335108078373483185368704248143360;
    
    uint256 constant IC24x = 9416367497536943718885754888472956844565465970097267709063066235752306325698;
    uint256 constant IC24y = 19723314235808745260246052435303534309417857159165488716328051613317736232238;
    
    uint256 constant IC25x = 10528229832112051116432034150573769650654105469063767733741840371856266712056;
    uint256 constant IC25y = 1779764324301912756868540662026502636918539541258604986905409460515824464032;
    
    uint256 constant IC26x = 9962215154203281650417730320798366086709922592934211546909903899533478335265;
    uint256 constant IC26y = 21419219689008183415492254786314586584891808444796360740348784710226773092192;
    
    uint256 constant IC27x = 3953569486623444590946893697954104805189782792343081846626387212667706601703;
    uint256 constant IC27y = 21793310708150495832072907149594984369450840194340350272637067000003101346125;
    
    uint256 constant IC28x = 13336013206237460596511340978523440968867346142366316797871814514416243485599;
    uint256 constant IC28y = 1913497339344283854172812690817134304499365811668618376004059830338791549284;
    
    uint256 constant IC29x = 3609287223245793430976122072786740618100651825935336692673441330973210284747;
    uint256 constant IC29y = 10082839454205164510631512783505946738400549480768751113249623897897594426232;
    
    uint256 constant IC30x = 14248647175211657208898481066462518049386817947716924784053728580697500598317;
    uint256 constant IC30y = 1029930173336073240146506844768843940311212473984777306572909261021186174639;
    
    uint256 constant IC31x = 8548282941335991399130614300139033200465425473299960778513257840196921859007;
    uint256 constant IC31y = 9656624809821484982429687231246047833217028739980321775956064899415900594171;
    
    uint256 constant IC32x = 14812149912274958224458756555970544809598632618249531592554569024282891638022;
    uint256 constant IC32y = 17259362429233780684042216146314966154827288267407581438922888067074380596751;
    
    uint256 constant IC33x = 551344345327115471266414811054332122595423459428570299429993729336801520753;
    uint256 constant IC33y = 20283689629309047815913607939227005510836489892544693765080192177013333158635;
    
    uint256 constant IC34x = 7097775443338474200644643179024964083982891219163918251359013097248420864279;
    uint256 constant IC34y = 6508615829464838138799217633786639864106280216556395517590095638757406348667;
    
    uint256 constant IC35x = 15615080006944272594353450990565185154245405449169968188138002220264398982201;
    uint256 constant IC35y = 14388050108675773415068865908800646759298800263168567368526374868261586792179;
    
    uint256 constant IC36x = 4490370966856323596704067707516916233663359338149148781635748738482782729510;
    uint256 constant IC36y = 2031936023670215103509229850353324412890059148933843651283700193014753930741;
    
    uint256 constant IC37x = 12758759927047537987338642302262880078435599022212339363812766354754538046454;
    uint256 constant IC37y = 11896982529763464115451871152392596194702245236430338728798666357767406111019;
    
    uint256 constant IC38x = 5368658642127313289325694961523240344393285699101197902487281456392729811940;
    uint256 constant IC38y = 15768483705719727744972474398803616268586867152840662537466239359966937192304;
    
    uint256 constant IC39x = 15294695397348798066924938646473953982767296021307784720915852019610692451779;
    uint256 constant IC39y = 12122130868204626297593661709846492740588778819965288835165069726764295416816;
    
    uint256 constant IC40x = 5442244468684392894152831692783942875183913943317394323516663770813288875622;
    uint256 constant IC40y = 7068691691317115522921998507057412376896807239736280400286384364403062294903;
    
    uint256 constant IC41x = 20509921302754207461775044570349041744100963903120401182413450650405801442763;
    uint256 constant IC41y = 5238733660093809686288565477942229349219401709840342854733849739030549623477;
    
    uint256 constant IC42x = 15607906094288845711066688336183312096841293363569058092867705119757142270901;
    uint256 constant IC42y = 2355172252693890305940264491182961672249296808659080720927374804147692206377;
    
    uint256 constant IC43x = 18483273799610966750890406614863015946265022631957161642951297437629318440749;
    uint256 constant IC43y = 17880689655002010993798902404669519774163551398288258601101831423311777371300;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[43] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                
                g1_mulAccC(_pVk, IC43x, IC43y, calldataload(add(pubSignals, 1344)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            
            checkField(calldataload(add(_pubSignals, 1344)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
