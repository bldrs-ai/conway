import MinimalPerfectHash from '../../../dependencies/conway-ds/src/indexing/minimal_perfect_hash';
import EntityTypesIfc from './entity_types_ifc.bldrs';

let gMapEntityTypesIfc = new Int32Array( [134,-22,411,99,75,37,2,270,265,1,50,224,4,53,137,1,4,132,-559,27,25,9,84,57,5,-572,2,27,5,19,132,7,166,2,1684,26,457,4,5,1,4,35,1271,-699,138,64,167,1,-328,10,0,43,46,39,1,475,1,-264,3,150,316,5,205,1,1,4,0,3,10,-169,3,0,1,30,5,47,259,99,17,68,-140,167,47,15,209,2,150,309,274,4,23,903,3,370,8,192,116,17,210,43,70,1,26,2,22,77,1,1,29,24,2,138,-202,54,3,9,7,17,2,110,23,25,15,142,2,7,20,32,50,-715,164,175,5,57,64,1923,87,146,13,120,-143,281,304,36,8,172,430,229,126,850,5,2,1,95,-97,54,15,455,20,-249,360,-343,346,6,29,-7,19,1,70,-371,-351,12,14,27,13,1617,2,623,2,963,142,12,399,2,91,39,-112,1,52,2,1,6] );

let prefixSumAddressEntityTypesIfc = new Uint32Array( [0,15,34,65,92,117,132,155,179,200,208,232,257,282,306,330,351,366,384,403,417,439,454,483,500,524,535,555,587,610,637,665,699,727,750,775,788,811,843,864,890,904,933,960,993,1024,1038,1059,1078,1105,1116,1138,1174,1195,1229,1254,1273,1295,1319,1340,1363,1376,1405,1416,1430,1463,1483,1496,1519,1547,1573,1587,1598,1633,1652,1686,1704,1718,1731,1739,1769,1799,1815,1841,1853,1865,1881,1901,1942,1967,1990,2002,2010,2022,2044,2073,2080,2110,2143,2168,2202,2217,2241,2272,2290,2310,2324,2344,2352,2380,2397,2412,2431,2462,2483,2495,2518,2551,2580,2599,2616,2646,2670,2687,2703,2725,2745,2772,2791,2808,2835,2863,2882,2902,2916,2940,2958,2978,2998,3011,3031,3054,3064,3094,3104,3125,3140,3167,3184,3204,3220,3236,3266,3282,3304,3315,3329,3353,3365,3390,3420,3449,3466,3480,3497,3511,3538,3584,3599,3617,3646,3661,3693,3710,3732,3756,3773,3788,3807,3823,3848,3872,3879,3904,3922,3945,3961,3987,4006,4043,4053,4075,4107,4128,4167,4188,4217,4240,4271,4302,4316,4338,4373,4393,4410,4425,4436,4449,4476,4483,4504,4521,4543,4561,4581,4598,4620,4639,4661,4682,4689,4715,4742,4761,4772,4799,4812,4839,4860,4877,4895,4904,4936,4969,4987,5003,5027,5047,5070,5093,5113,5135,5169,5187,5194,5211,5240,5247,5292,5322,5342,5364,5386,5419,5445,5475,5483,5509,5524,5552,5580,5598,5617,5634,5655,5680,5707,5731,5749,5772,5791,5815,5822,5844,5870,5878,5906,5923,5947,5967,5983,5994,6015,6034,6062,6084,6115,6129,6145,6169,6194,6215,6232,6258,6281,6300,6315,6338,6355,6380,6394,6408,6437,6462,6491,6509,6528,6554,6586,6606,6621,6652,6669,6677,6699,6729,6757,6782,6806,6836,6847,6858,6870,6884,6895,6913,6936,6953,6979,6989,7009,7021,7036,7051,7063,7085,7096,7107,7129,7140,7160,7173,7190,7205,7220,7227,7244,7255,7284,7300,7317,7333,7351,7360,7381,7405,7430,7437,7470,7491,7509,7539,7552,7560,7584,7610,7640,7658,7667,7681,7716,7731,7766,7779,7807,7829,7853,7866,7897,7917,7925,7942,7968,7988,8009,8023,8044,8065,8093,8119,8144,8153,8179,8192,8215,8245,8260,8284,8297,8304,8318,8327,8352,8383,8397,8416,8442,8454,8483,8502,8509,8528,8545,8572,8579,8587,8616,8640,8663,8687,8709,8721,8746,8772,8796,8821,8849,8861,8878,8898,8908,8930,8950,8977,8995,9020,9039,9062,9077,9104,9113,9134,9141,9170,9192,9218,9236,9249,9270,9296,9313,9329,9344,9357,9370,9389,9401,9433,9444,9463,9485,9508,9537,9549,9568,9597,9609,9639,9656,9681,9696,9721,9735,9759,9778,9790,9820,9836,9860,9884,9905,9919,9934,9941,9962,9989,10004,10037,10050,10070,10098,10105,10123,10133,10152,10166,10185,10209,10221,10240,10261,10285,10309,10348,10359,10385,10413,10433,10454,10478,10496,10516,10529,10538,10567,10595,10613,10635,10663,10681,10702,10717,10736,10748,10760,10788,10805,10833,10840,10857,10882,10899,10922,10949,10964,10988,11010,11031,11065,11097,11117,11124,11161,11176,11192,11207,11240,11270,11279,11296,11322,11344,11373,11398,11416,11430,11459,11469,11486,11504,11531,11558,11571,11585,11603,11617,11647,11668,11688,11702,11730,11740,11768,11795,11811,11846,11864,11886,11922,11942,11965,11974,11990,12003,12029,12065,12093,12105,12130,12166,12190,12202,12232,12264,12284,12306,12334,12352,12373,12391,12408,12424,12437,12457,12470,12494,12527,12546,12554,12571,12591,12610,12638,12659,12686,12706,12735,12756,12765,12778,12795,12819,12829,12849,12868,12901,12909,12938,12948,12961,12977,13002,13030,13051,13077,13103,13114,13133,13152,13175,13185,13202,13226,13246,13273,13297,13311,13357,13393,13432,13444,13464,13482,13493,13510,13538,13547,13558,13581,13603,13622,13633,13656,13667,13700,13721,13739,13765,13796,13815,13832,13859,13883,13890,13913,13929,13946,13956,13970,13990,14004,14018,14040,14049,14066,14086,14096,14119,14132,14146,14161,14191,14213,14221,14246,14266,14295,14306,14313,14332,14344,14360,14396,14409,14425,14433,14461,14471,14501,14520,14535,14570,14592,14612,14632,14651,14686,14706,14734,14754,14786,14812,14833,14848,14858,14886,14904,14919,14936,14948,14972,14990,15016,15031,15050,15067,15081,15098,15105,15130,15137,15166,15188,15203,15227,15244,15269,15282,15293,15307,15336,15358,15367,15379,15411,15456,15485,15498,15516,15545,15577,15606,15621,15637,15646,15682,15698,15719,15741,15764,15779] );

let slotMapEntityTypesIfc = new Int32Array( [623,470,605,41,767,200,165,604,666,100,72,577,471,629,301,636,59,374,54,709,367,188,716,476,672,573,309,184,536,113,728,273,295,275,575,34,45,555,286,649,647,563,17,558,30,761,201,461,40,371,685,392,141,136,259,452,552,360,256,622,574,520,42,206,150,196,229,378,441,130,657,427,571,576,760,160,456,687,81,590,485,542,662,723,494,359,388,713,718,185,193,51,180,111,32,750,387,9,398,642,730,669,47,719,748,509,522,52,212,312,475,289,556,294,118,768,440,738,16,1,746,77,25,696,272,689,386,314,207,625,410,747,215,142,248,405,307,349,377,35,243,169,488,450,667,652,227,668,322,529,434,545,242,65,191,143,700,170,595,177,384,474,60,500,124,395,140,115,239,489,537,237,82,407,325,591,38,0,11,684,737,290,588,731,333,166,692,262,757,10,460,21,198,444,168,756,729,741,44,107,535,432,539,68,753,430,453,764,343,688,482,532,538,74,12,208,340,66,302,735,619,655,147,373,553,414,540,401,752,129,526,300,252,238,763,267,225,600,710,582,413,637,15,108,397,18,221,714,603,83,698,284,550,90,557,135,268,437,299,483,424,464,315,354,356,91,408,288,192,650,544,448,702,153,632,385,524,216,232,473,296,149,682,675,653,438,203,223,541,515,28,148,505,92,664,61,350,342,676,230,37,705,596,749,569,376,258,411,583,195,236,646,4,708,187,519,508,228,572,94,121,244,344,5,525,249,134,251,3,507,368,490,663,291,506,157,64,462,403,274,580,55,711,317,402,739,161,250,231,70,189,122,98,564,393,699,105,621,234,369,31,117,145,549,546,336,63,400,119,612,480,715,219,766,534,276,114,78,197,106,382,127,341,487,566,13,112,610,635,717,93,670,680,733,29,396,740,530,447,95,308,674,186,586,20,49,167,514,156,270,126,87,241,62,323,736,162,321,468,202,762,628,617,345,151,439,593,481,245,293,587,584,455,372,421,36,627,527,33,109,707,102,53,654,338,560,578,503,304,226,73,8,581,22,683,406,337,218,606,517,27,419,158,132,673,346,493,425,183,412,498,679,634,554,426,759,365,547,247,362,394,446,96,417,631,681,504,513,327,339,104,26,658,594,491,306,559,39,435,754,423,597,182,123,469,601,511,496,433,116,313,640,467,671,84,512,255,213,442,598,734,568,19,492,614,579,499,297,724,146,358,501,458,292,75,277,518,565,618,743,454,431,133,751,265,585,320,449,328,691,630,639,562,561,261,351,85,164,318,755,415,769,86,643,67,152,697,380,279,176,451,43,758,222,361,331,159,510,303,609,179,660,71,521,693,602,686,355,138,436,56,466,352,720,266,611,287,420,310,209,2,257,264,48,298,391,484,69,88,154,665,661,205,305,533,486,173,199,103,332,319,110,324,57,502,495,334,23,224,383,721,24,214,570,174,89,463,282,50,353,722,418,744,704,727,645,139,137,703,278,379,443,316,347,543,144,79,548,381,416,375,567,633,211,335,131,128,285,311,125,271,76,99,745,528,260,690,551,357,399,263,706,644,497,638,701,366,363,348,457,253,190,592,656,531,624,651,409,58,678,677,445,429,641,695,616,101,364,246,459,615,329,240,389,269,620,235,694,726,607,599,14,478,97,46,732,390,120,7,516,330,172,80,210,326,233,608,465,175,589,712,742,472,648,477,422,178,194,155,254,163,217,479,171,613,523,428,370,280,283,281,659,765,6,181,404,725,626,220,204] );

let encodedDataEntityTypesIfc = (new TextEncoder()).encode( "IFCSWEPTSURFACEIFCPHYSICALQUANTITYIFCSTRUCTURALCURVEMEMBERVARYINGIFCAPPLIEDVALUERELATIONSHIPIFCWARPINGCONSTANTMEASUREIFCPROJECTORDERIFCFLOWMOVINGDEVICETYPEIFCSTRUCTURALCURVEMEMBERIFCDAYLIGHTSAVINGHOURIFCPLATEIFCBOOLEANCLIPPINGRESULTIFCRELOVERRIDESPROPERTIESIFCPHYSICALSIMPLEQUANTITYIFCSURFACESTYLERENDERINGIFCELECTRICGENERATORTYPEIFCTEXTSTYLETEXTMODELIFCBSPLINECURVEIFCGASTERMINALTYPEIFCISHAPEPROFILEDEFIFCMASSMEASUREIFCSWITCHINGDEVICETYPEIFCCREWRESOURCEIFCMOISTUREDIFFUSIVITYMEASUREIFCQUANTITYVOLUMEIFCELECTRICCHARGEMEASUREIFCRELNESTSIFCELECTRICALELEMENTIFCCONSTRUCTIONEQUIPMENTRESOURCEIFCRELASSIGNSTORESOURCEIFCBUILDINGELEMENTPROXYTYPEIFCPOSITIVEPLANEANGLEMEASUREIFCDOCUMENTINFORMATIONRELATIONSHIPIFCFEATUREELEMENTSUBTRACTIONIFCDOORLININGPROPERTIESIFCRELDEFINESBYPROPERTIESIFCSTYLEDITEMIFCAPPROVALRELATIONSHIPIFCRELCONNECTSSTRUCTURALACTIVITYIFCPREDEFINEDTEXTFONTIFCVIRTUALGRIDINTERSECTIONIFCVERTEXPOINTIFCRELINTERACTIONREQUIREMENTSIFCAIRTOAIRHEATRECOVERYTYPEIFCRELCONTAINEDINSPATIALSTRUCTUREIFCANNOTATIONFILLAREAOCCURRENCEIFCTIMEMEASUREIFCPROJECTORDERRECORDIFCTSHAPEPROFILEDEFIFCENVIRONMENTALIMPACTVALUEIFCPUMPTYPEIFCHEATINGVALUEMEASUREIFCGEOMETRICREPRESENTATIONSUBCONTEXTIFCCHAMFEREDGEFEATUREIFCCARTESIANTRANSFORMATIONOPERATORIFCENERGYCONVERSIONDEVICEIFCOBJECTDEFINITIONIFCRELCONNECTSELEMENTSIFCFILLAREASTYLEHATCHINGIFCFLOWINSTRUMENTTYPEIFCSTYLEDREPRESENTATIONIFCRELDEFINESIFCROUNDEDRECTANGLEPROFILEDEFIFCAPPROVALIFCWORKCONTROLIFCCLASSIFICATIONITEMRELATIONSHIPIFCEQUIPMENTSTANDARDIFCDAMPERTYPEIFCSANITARYTERMINALTYPEIFCTHERMALMATERIALPROPERTIESIFCCABLECARRIERSEGMENTTYPEIFCAREAMEASUREIFCPOLYLOOPIFCRELCONNECTSWITHREALIZINGELEMENTSIFCRELDEFINESBYTYPEIFCTHERMODYNAMICTEMPERATUREMEASUREIFCCOMPLEXPROPERTYIFCORDERACTIONIFCIDENTIFIERIFCCURVEIFCSLIPPAGECONNECTIONCONDITIONIFCPREDEFINEDPOINTMARKERSYMBOLIFCRELASSOCIATESIFCCONTEXTDEPENDENTMEASUREIFCPHMEASUREIFCPROCEDUREIFCFILLAREASTYLEIFCPROFILEPROPERTIESIFCMODULUSOFLINEARSUBGRADEREACTIONMEASUREIFCMOMENTOFINERTIAMEASUREIFCCONSTRUCTIONRESOURCEIFCNAMEDUNITIFCASSETIFCOBJECTIVEIFCBUILDINGELEMENTPARTIFCANNOTATIONSYMBOLOCCURRENCEIFCTEXTIFCSTRUCTURALPROFILEPROPERTIESIFCDISTRIBUTIONCONTROLELEMENTTYPEIFCSHELLBASEDSURFACEMODELIFCTIMESERIESREFERENCERELATIONSHIPIFCPOWERMEASUREIFCDOSEEQUIVALENTMEASUREIFCARBITRARYPROFILEDEFWITHVOIDSIFCMONETARYMEASUREIFCSPECULARROUGHNESSIFCPROPERTYSETIFCREGULARTIMESERIESIFCGROUPIFCCRANERAILASHAPEPROFILEDEFIFCFEATUREELEMENTIFCQUANTITYTIMEIFCDUCTSILENCERTYPEIFCRELCONNECTSSTRUCTURALELEMENTIFCROUNDEDEDGEFEATUREIFCPLATETYPEIFCWARPINGMOMENTMEASUREIFCPRODUCTSOFCOMBUSTIONPROPERTIESIFCROTATIONALSTIFFNESSMEASUREIFCFLOWTERMINALTYPEIFCCOMPOSITECURVEIFCSPECIFICHEATCAPACITYMEASUREIFCBOUNDARYNODECONDITIONIFCDIMENSIONCURVEIFCLENGTHMEASUREIFCDOCUMENTINFORMATIONIFCINDUCTANCEMEASUREIFCGENERALPROFILEPROPERTIESIFCTRANSPORTELEMENTIFCCONTROLLERTYPEIFCSURFACEOFLINEAREXTRUSIONIFCPOLYGONALBOUNDEDHALFSPACEIFCSPECULAREXPONENTIFCRIGHTCIRCULARCONEIFCEDGEFEATUREIFCVIBRATIONISOLATORTYPEIFCOBJECTPLACEMENTIFCELECTRICALCIRCUITIFCMANIFOLDSOLIDBREPIFCOUTLETTYPEIFCANNOTATIONSURFACEIFCDIMENSIONALEXPONENTSIFCELLIPSEIFCPRESENTATIONLAYERASSIGNMENTIFCPROCESSIFCDESCRIPTIVEMEASUREIFCWORKSCHEDULEIFCCURVESTYLEFONTANDSCALINGIFCDIMENSIONCOUNTIFCELEMENTARYSURFACEIFCRELDECOMPOSESIFCMATERIALLAYERIFCRELASSOCIATESCLASSIFICATIONIFCDIMENSIONPAIRIFCBUILDINGELEMENTTYPEIFCRESOURCEIFCCHILLERTYPEIFCLINEARVELOCITYMEASUREIFCOPENSHELLIFCSTRUCTURALLINEARACTIONIFCCONNECTIONPOINTECCENTRICITYIFCSYSTEMFURNITUREELEMENTTYPEIFCQUANTITYLENGTHIFCBEZIERCURVEIFCSIMPLEPROPERTYIFCELEMENTTYPEIFCONEDIRECTIONREPEATFACTORIFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORMIFCCOVERINGTYPEIFCRADIUSDIMENSIONIFCPRESENTATIONLAYERWITHSTYLEIFCRELATIONSHIPIFCDRAUGHTINGCALLOUTRELATIONSHIPIFCBOUNDEDSURFACEIFCSTRUCTURALLOADGROUPIFCEVAPORATIVECOOLERTYPEIFCSWEPTDISKSOLIDIFCAPPLIEDVALUEIFC2DCOMPOSITECURVEIFCPOSTALADDRESSIFCHEATFLUXDENSITYMEASUREIFCROTATIONALMASSMEASUREIFCEDGEIFCTOPOLOGYREPRESENTATIONIFCPRESENTABLETEXTIFCUNITARYEQUIPMENTTYPEIFCCONDENSERTYPEIFCIONCONCENTRATIONMEASUREIFCFLOWMOVINGDEVICEIFCTHERMALEXPANSIONCOEFFICIENTMEASUREIFCADDRESSIFCRECTANGLEPROFILEDEFIFCDIMENSIONCURVEDIRECTEDCALLOUTIFCPERFORMANCEHISTORYIFCMECHANICALCONCRETEMATERIALPROPERTIESIFCCONDITIONCRITERIONIFCTHERMALCONDUCTIVITYMEASUREIFCPOSITIVERATIOMEASUREIFCSECTIONALAREAINTEGRALMEASUREIFCAPPROVALPROPERTYRELATIONSHIPIFCSTAIRFLIGHTIFCRELASSIGNSTOPRODUCTIFCMATERIALDEFINITIONREPRESENTATIONIFCRELOCCUPIESSPACESIFCSURFACETEXTUREIFCTEXTFONTNAMEIFCMATERIALIFCTYPEOBJECTIFCVAPORPERMEABILITYMEASUREIFCFACEIFCILLUMINANCEMEASUREIFCPREDEFINEDITEMIFCRELASSIGNSTOCONTROLIFCRELASSIGNSTASKSIFCBOUNDARYCONDITIONIFCTELECOMADDRESSIFCCONVERSIONBASEDUNITIFCLIBRARYREFERENCEIFCRATIONALBEZIERCURVEIFCELECTRICHEATERTYPEIFCREALIFCSTRUCTURALPOINTREACTIONIFCAMOUNTOFSUBSTANCEMEASUREIFCCIRCLEPROFILEDEFIFCTANKTYPEIFCRELCONNECTSPORTTOELEMENTIFCTIMESERIESIFCRELASSIGNSTOPROJECTORDERIFCREPRESENTATIONITEMIFCTEXTDECORATIONIFCFLOWFITTINGTYPEIFCTENDONIFCELECTRICFLOWSTORAGEDEVICETYPEIFCDISTRIBUTIONCHAMBERELEMENTTYPEIFCLINEARDIMENSIONIFCTORQUEMEASUREIFCFLOWSTORAGEDEVICETYPEIFCPRESENTATIONSTYLEIFCSTRUCTURALCONNECTIONIFCMASSPERLENGTHMEASUREIFCREPRESENTATIONMAPIFCIRREGULARTIMESERIESIFCTEXTSTYLEWITHBOXCHARACTERISTICSIFCAIRTERMINALTYPEIFCWALLIFCSECTIONEDSPINEIFCENERGYCONVERSIONDEVICETYPEIFCLINEIFCMODULUSOFROTATIONALSUBGRADEREACTIONMEASUREIFCSTRUCTURALSURFACECONNECTIONIFCCURVEBOUNDEDPLANEIFCLINEARMOMENTMEASUREIFCPREDEFINEDCURVEFONTIFCRELASSOCIATESPROFILEPROPERTIESIFCSPATIALSTRUCTUREELEMENTIFCRELCONNECTSSTRUCTURALMEMBERIFCPOINTIFCFLOWTREATMENTDEVICETYPEIFCMATERIALLISTIFCELECTRICDISTRIBUTIONPOINTIFCPREDEFINEDDIMENSIONSYMBOLIFCLIGHTSOURCESPOTIFCZSHAPEPROFILEDEFIFCVIRTUALELEMENTIFCMECHANICALFASTENERIFCFEATUREELEMENTADDITIONIFCBUILDINGELEMENTCOMPONENTIFCSTRUCTURALRESULTGROUPIFCDUCTSEGMENTTYPEIFCCONTEXTDEPENDENTUNITIFCWALLSTANDARDCASEIFCRELASSOCIATESAPPROVALIFCTASKIFCLUMINOUSFLUXMEASUREIFCCLASSIFICATIONREFERENCEIFCTABLEIFCGENERALMATERIALPROPERTIESIFCREINFORCINGBARIFCRIGHTCIRCULARCYLINDERIFCDERIVEDPROFILEDEFIFCQUANTITYCOUNTIFCEDGELOOPIFCCLASSIFICATIONITEMIFCFREQUENCYMEASUREIFCELECTRICRESISTANCEMEASUREIFCABSORBEDDOSEMEASUREIFCMECHANICALMATERIALPROPERTIESIFCSERVICELIFEIFCOFFSETCURVE3DIFCRELSCHEDULESCOSTITEMSIFCWINDOWLININGPROPERTIESIFCANNOTATIONFILLAREAIFCCLASSIFICATIONIFCPROPERTYENUMERATEDVALUEIFCBUILDINGELEMENTPROXYIFCCURVATUREMEASUREIFCBOUNDEDCURVEIFCFACETEDBREPWITHVOIDSIFCSWEPTAREASOLIDIFCELECTRICVOLTAGEMEASUREIFCDATEANDTIMEIFCAPPLICATIONIFCMAGNETICFLUXDENSITYMEASUREIFCSTRUCTURALPLANARACTIONIFCTEMPERATUREGRADIENTMEASUREIFCRELVOIDSELEMENTIFCLIGHTFIXTURETYPEIFCDISTRIBUTIONELEMENTTYPEIFCHYGROSCOPICMATERIALPROPERTIESIFCREVOLVEDAREASOLIDIFCCOSTSCHEDULEIFCDIMENSIONCALLOUTRELATIONSHIPIFCUNITASSIGNMENTIFCACTORIFCMASSFLOWRATEMEASUREIFCCONSTRUCTIONPRODUCTRESOURCEIFCRECTANGLEHOLLOWPROFILEDEFIFCPROPERTYREFERENCEVALUEIFCCURVESTYLEFONTPATTERNIFCRELCONNECTSWITHECCENTRICITYIFCCOVERINGIFCSLABTYPEIFCDIRECTIONIFCFACESURFACEIFCOCCUPANTIFCREINFORCINGMESHIFCELEMENTCOMPONENTTYPEIFCCARTESIANPOINTIFCDISTRIBUTIONFLOWELEMENTIFCCONTROLIFCPROPERTYLISTVALUEIFCVALVETYPEIFCSURFACESTYLEIFCCOUNTMEASUREIFCEDGECURVEIFCPROPERTYENUMERATIONIFCCOILTYPEIFCBEAMTYPEIFCTRAPEZIUMPROFILEDEFIFCGRIDAXISIFCDOCUMENTREFERENCEIFCSHAPEMODELIFCAXIS1PLACEMENTIFCMINUTEINHOURIFCFASTENERTYPEIFCGRIDIFCSECONDINMINUTEIFCPROPERTYIFCDISTRIBUTIONCHAMBERELEMENTIFCDEFINEDSYMBOLIFCCSGPRIMITIVE3DIFCLABORRESOURCEIFCSTAIRFLIGHTTYPEIFCMEMBERIFCRELPROJECTSELEMENTIFCREPRESENTATIONCONTEXTIFCLINEARSTIFFNESSMEASUREIFCSLABIFCSTRUCTURALSURFACEMEMBERVARYINGIFCDERIVEDUNITELEMENTIFCJUNCTIONBOXTYPEIFCANNOTATIONSURFACEOCCURRENCEIFCMEMBERTYPEIFCCONICIFCRELASSOCIATESMATERIALIFCRELASSOCIATESCONSTRAINTIFCEXTERNALLYDEFINEDHATCHSTYLEIFCBUILDINGELEMENTIFCVECTORIFCRAILINGTYPEIFCSTRUCTURALLOADSINGLEDISPLACEMENTIFCPOINTONCURVEIFCMODULUSOFSUBGRADEREACTIONMEASUREIFCSOLIDMODELIFCVOLUMETRICFLOWRATEMEASUREIFCRELASSIGNSTOPROCESSIFCPROPERTYSETDEFINITIONIFCCOLUMNTYPEIFCBOUNDARYNODECONDITIONWARPINGIFCFURNITURESTANDARDIFCSTAIRIFCFUELPROPERTIESIFCPARAMETERIZEDPROFILEDEFIFCEXTRUDEDAREASOLIDIFCTEXTSTYLEFONTMODELIFCRELSEQUENCEIFCAIRTERMINALBOXTYPEIFCREINFORCINGELEMENTIFCSTRUCTURALLOADLINEARFORCEIFCTEXTSTYLEFORDEFINEDFONTIFCMOLECULARWEIGHTMEASUREIFCCOLUMNIFCDYNAMICVISCOSITYMEASUREIFCFONTWEIGHTIFCRADIOACTIVITYMEASUREIFCGEOMETRICREPRESENTATIONITEMIFCPLANAREXTENTIFCSECTIONMODULUSMEASUREIFCRELASSIGNSIFCMOVEIFCCURTAINWALLIFCSYSTEMIFCELECTRICCURRENTMEASUREIFCCONSTRUCTIONMATERIALRESOURCEIFCSHAPEASPECTIFCANGULARDIMENSIONIFCARBITRARYOPENPROFILEDEFIFCCONDITIONIFCSPACETHERMALLOADPROPERTIESIFCCONNECTEDFACESETIFCPORTIFCCSHAPEPROFILEDEFIFCBOXEDHALFSPACEIFCDIMENSIONCURVETERMINATORIFCBEAMIFCPLANEIFCROTATIONALFREQUENCYMEASUREIFCCOMPOSITECURVESEGMENTIFCTRANSPORTELEMENTTYPEIFCPERSONANDORGANIZATIONIFCSCHEDULETIMECONTROLIFCTIMESTAMPIFCSURFACESTYLEREFRACTIONIFCSTRUCTURALSURFACEMEMBERIFCFACEBASEDSURFACEMODELIFCCLASSIFICATIONNOTATIONIFCOPTICALMATERIALPROPERTIESIFCSPACETYPEIFCPOINTONSURFACEIFCDISCRETEACCESSORYIFCSUBEDGEIFCSHAPEREPRESENTATIONIFCSECTIONPROPERTIESIFCTWODIRECTIONREPEATFACTORIFCPIPESEGMENTTYPEIFCLIGHTSOURCEDIRECTIONALIFCTERMINATORSYMBOLIFCSURFACESTYLELIGHTINGIFCTENDONANCHORIFCANNOTATIONTEXTOCCURRENCEIFCWINDOWIFCMASSDENSITYMEASUREIFCRAMPIFCASYMMETRICISHAPEPROFILEDEFIFCACCELERATIONMEASUREIFCEXTERNALLYDEFINEDSYMBOLIFCRELCOVERSSPACESIFCRELAXATIONIFCPROPERTYDEFINITIONIFCELECTRICTIMECONTROLTYPEIFCCURVESTYLEFONTIFCBOOLEANRESULTIFCACTUATORTYPEIFCSTYLEMODELIFCANNOTATIONIFCGLOBALLYUNIQUEIDIFCINVENTORYIFCEXTERNALLYDEFINEDSURFACESTYLEIFCCSGSOLIDIFCSTRUCTURALMEMBERIFCPROPERTYSINGLEVALUEIFCANNOTATIONOCCURRENCEIFCLIGHTINTENSITYDISTRIBUTIONIFCCOLOURRGBIFCCABLESEGMENTTYPEIFCELECTRICCONDUCTANCEMEASUREIFCFACEBOUNDIFCPRESENTATIONSTYLEASSIGNMENTIFCLOCALPLACEMENTIFCCONSTRAINTRELATIONSHIPIFCIMAGETEXTUREIFCPRODUCTDEFINITIONSHAPEIFCFONTVARIANTIFCTEXTLITERALWITHEXTENTIFCRELCONNECTSPORTSIFCLOCALTIMEIFCTHERMALTRANSMITTANCEMEASUREIFCFLOWMETERTYPEIFCRELASSOCIATESDOCUMENTIFCDISCRETEACCESSORYTYPEIFCFILLAREASTYLETILESIFCLIGHTSOURCEIFCMONETARYUNITIFCDOORIFCLIBRARYINFORMATIONIFCSURFACESTYLEWITHTEXTURESIFCFORCEMEASUREIFCPROPERTYDEPENDENCYRELATIONSHIPIFCSOUNDVALUEIFCHEATEXCHANGERTYPEIFCEXTERNALLYDEFINEDTEXTFONTIFCROOFIFCPROJECTIONCURVEIFCBOOLEANIFCSTRUCTURALACTIONIFCSYMBOLSTYLEIFCENERGYPROPERTIESIFCRELCOVERSBLDGELEMENTSIFCCOSTVALUEIFCMATERIALLAYERSETIFCTEXTTRANSFORMATIONIFCLIGHTSOURCEPOSITIONALIFCSTRUCTURALPOINTACTIONIFCCONSTRAINTCLASSIFICATIONRELATIONSHIPIFCWALLTYPEIFCPHYSICALCOMPLEXQUANTITYIFCSTRUCTURALCURVECONNECTIONIFCSERVICELIFEFACTORIFCSTRUCTURALACTIVITYIFCPRODUCTREPRESENTATIONIFCCURTAINWALLTYPEIFCFURNISHINGELEMENTIFCTEXTUREMAPIFCPERSONIFCELECTRICCAPACITANCEMEASUREIFCRECTANGULARTRIMMEDSURFACEIFCSOUNDPROPERTIESIFCDISTRIBUTIONELEMENTIFCCRANERAILFSHAPEPROFILEDEFIFCWATERPROPERTIESIFCSTRUCTURALREACTIONIFCRATIOMEASUREIFCRELSPACEBOUNDARYIFCALARMTYPEIFCTEXTSTYLEIFCSTRUCTURALLOADSINGLEFORCEIFCREPRESENTATIONIFCRIBPLATEPROFILEPROPERTIESIFCLOOPIFCPARAMETERVALUEIFCCIRCLEHOLLOWPROFILEDEFIFCOPENINGELEMENTIFCPROPERTYBOUNDEDVALUEIFCORGANIZATIONRELATIONSHIPIFCORIENTEDEDGEIFCBOUNDARYEDGECONDITIONIFCDOORPANELPROPERTIESIFCPROPERTYTABLEVALUEIFCRELREFERENCEDINSPATIALSTRUCTUREIFCSTRUCTURALPLANARACTIONVARYINGIFCSOLIDANGLEMEASUREIFCROOTIFCMATERIALCLASSIFICATIONRELATIONSHIPIFCCALENDARDATEIFCTEXTALIGNMENTIFCFLOWTERMINALIFCSECTIONREINFORCEMENTPROPERTIESIFCSPATIALSTRUCTUREELEMENTTYPEIFCSIUNITIFCHUMIDIFIERTYPEIFCINTEGERCOUNTRATEMEASUREIFCSURFACESTYLESHADINGIFCTEXTURECOORDINATEGENERATORIFCRELFLOWCONTROLELEMENTSIFCRELFILLSELEMENTIFCFLOWFITTINGIFCFAILURECONNECTIONCONDITIONIFCSURFACEIFCCOMPRESSORTYPEIFCELEMENTQUANTITYIFCTHERMALADMITTANCEMEASUREIFCIRREGULARTIMESERIESVALUEIFCYEARNUMBERIFCBOUNDINGBOXIFCTIMESERIESVALUEIFCBLOBTEXTUREIFCCLASSIFICATIONNOTATIONFACETIFCLINEARFORCEMEASUREIFCWASTETERMINALTYPEIFCTYPEPRODUCTIFCCONNECTIONSURFACEGEOMETRYIFCPROJECTIFCAPPROVALACTORRELATIONSHIPIFCTHERMALRESISTANCEMEASUREIFCOFFSETCURVE2DIFCFILLAREASTYLETILESYMBOLWITHSTYLEIFCTRANSFORMERTYPEIFCCOLOURSPECIFICATIONIFCREINFORCEMENTDEFINITIONPROPERTIESIFCELECTRICMOTORTYPEIFCSTRUCTURALLOADSTATICIFCMETRICIFCCOMPLEXNUMBERIFCBOILERTYPEIFCREFERENCESVALUEDOCUMENTIFCISOTHERMALMOISTURECAPACITYMEASUREIFCSTRUCTURALPOINTCONNECTIONIFCHOURINDAYIFCMECHANICALFASTENERTYPEIFCCARTESIANTRANSFORMATIONOPERATOR3DIFCMATERIALLAYERSETUSAGEIFCPLACEMENTIFCPERMEABLECOVERINGPROPERTIESIFCSTRUCTURALCONNECTIONCONDITIONIFCMONTHINYEARNUMBERIFCFLOWTREATMENTDEVICEIFCSTRUCTURALLOADPLANARFORCEIFCDUCTFITTINGTYPEIFCLIGHTSOURCEAMBIENTIFCELEMENTASSEMBLYIFCCOOLEDBEAMTYPEIFCACTIONREQUESTIFCSENSORTYPEIFCFLOWSTORAGEDEVICEIFCPROFILEDEFIFCELECTRICAPPLIANCETYPEIFCGEOMETRICREPRESENTATIONCONTEXTIFCPREDEFINEDSYMBOLIFCBLOCKIFCHALFSPACESOLIDIFCEXTERNALREFERENCEIFCDAYINMONTHNUMBERIFCCOMPOUNDPLANEANGLEMEASUREIFCTIMESERIESSCHEDULEIFCELECTRICALBASEPROPERTIESIFCRELASSIGNSTOGROUPIFCPREDEFINEDTERMINATORSYMBOLIFCCONNECTIONGEOMETRYIFCPERMITIFCRAMPFLIGHTIFCTUBEBUNDLETYPEIFCFURNISHINGELEMENTTYPEIFCELEMENTIFCELLIPSEPROFILEDEFIFCAXIS2PLACEMENT2DIFCPROPERTYCONSTRAINTRELATIONSHIPIFCPROXYIFCEXTENDEDMATERIALPROPERTIESIFCPRODUCTIFCCURVESTYLEIFCFURNITURETYPEIFCNORMALISEDRATIOMEASUREIFCANNOTATIONCURVEOCCURRENCEIFCRECTANGULARPYRAMIDIFCRELCONNECTSPATHELEMENTSIFCCONNECTIONPOINTGEOMETRYIFCBUILDINGIFCUSHAPEPROFILEDEFIFCPREDEFINEDCOLOURIFCCENTERLINEPROFILEDEFIFCFANTYPEIFCNUMERICMEASUREIFCLIGHTDISTRIBUTIONDATAIFCSOUNDPOWERMEASUREIFCLUMINOUSINTENSITYMEASUREIFCPOSITIVELENGTHMEASUREIFCWINDOWSTYLEIFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORMIFCCARTESIANTRANSFORMATIONOPERATOR2DIFCLUMINOUSINTENSITYDISTRIBUTIONMEASUREIFCDOORSTYLEIFCSTACKTERMINALTYPEIFCMEASUREWITHUNITIFCFASTENERIFCFACEOUTERBOUNDIFCRELASSOCIATESAPPLIEDVALUEIFCCIRCLEIFCPOLYLINEIFCRELASSOCIATESLIBRARYIFCFLUIDFLOWPROPERTIESIFCLSHAPEPROFILEDEFIFCLAMPTYPEIFCRELSERVICESBUILDINGSIFCTABLEROWIFCCOORDINATEDUNIVERSALTIMEOFFSETIFCMATERIALPROPERTIESIFCFLOWSEGMENTTYPEIFCCABLECARRIERFITTINGTYPEIFCDRAUGHTINGPREDEFINEDTEXTFONTIFCEQUIPMENTELEMENTIFCBUILDINGSTOREYIFCDOCUMENTELECTRONICFORMATIFCBOUNDARYFACECONDITIONIFCPILEIFCSOUNDPRESSUREMEASUREIFCRELAGGREGATESIFCFLOWCONTROLLERIFCINTEGERIFCRELCONNECTSIFCPROJECTIONELEMENTIFCTEXTLITERALIFCFLOWSEGMENTIFCMAGNETICFLUXMEASUREIFCVERTEXIFCSTRUCTURALITEMIFCTEXTURECOORDINATEIFCLOGICALIFCPROTECTIVEDEVICETYPEIFCFILTERTYPEIFCFACETEDBREPIFCORGANIZATIONIFCDISTRIBUTIONFLOWELEMENTTYPEIFCSUBCONTRACTRESOURCEIFCSPACEIFCANGULARVELOCITYMEASUREIFCRELASSIGNSTOACTORIFCSURFACECURVESWEPTAREASOLIDIFCWORKPLANIFCZONEIFCAXIS2PLACEMENT3DIFCFONTSTYLEIFCENERGYMEASUREIFCMECHANICALSTEELMATERIALPROPERTIESIFCMAPPEDITEMIFCTEXTUREVERTEXIFCLABELIFCSTRUCTURALLOADTEMPERATUREIFCRAILINGIFCFIRESUPPRESSIONTERMINALTYPEIFCELEMENTCOMPONENTIFCOWNERHISTORYIFCSTRUCTURALLOADSINGLEFORCEWARPINGIFCMOTORCONNECTIONTYPEIFCDRAUGHTINGCALLOUTIFCGEOMETRICCURVESETIFCDISTRIBUTIONPORTIFCSTRUCTURALSTEELPROFILEPROPERTIESIFCDIAMETERDIMENSIONIFCKINEMATICVISCOSITYMEASUREIFCPLANEANGLEMEASUREIFCSTRUCTURALLINEARACTIONVARYINGIFCSTRUCTURALANALYSISMODELIFCFLOWCONTROLLERTYPEIFCPIXELTEXTUREIFCFOOTINGIFCARBITRARYCLOSEDPROFILEDEFIFCPRESSUREMEASUREIFCGEOMETRICSETIFCRAMPFLIGHTTYPEIFCACTORROLEIFCWINDOWPANELPROPERTIESIFCSPACEHEATERTYPEIFCCONNECTIONCURVEGEOMETRYIFCTRIMMEDCURVEIFCCOOLINGTOWERTYPEIFCEVAPORATORTYPEIFCDERIVEDUNITIFCSTRUCTURALLOADIFCPATHIFCCONNECTIONPORTGEOMETRYIFCSITEIFCMODULUSOFELASTICITYMEASUREIFCSHEARMODULUSMEASUREIFCQUANTITYAREAIFCVERTEXBASEDTEXTUREMAPIFCQUANTITYWEIGHTIFCLIGHTSOURCEGONIOMETRICIFCCONSTRAINTIFCCOSTITEMIFCCLOSEDSHELLIFCDISTRIBUTIONCONTROLELEMENTIFCCOMPOSITEPROFILEDEFIFCSPHEREIFCPLANARBOXIFCTOPOLOGICALREPRESENTATIONITEMIFCSTRUCTURALLOADSINGLEDISPLACEMENTDISTORTIONIFCREINFORCEMENTBARPROPERTIESIFCVERTEXLOOPIFCPIPEFITTINGTYPEIFCSTRUCTUREDDIMENSIONCALLOUTIFCDRAUGHTINGPREDEFINEDCURVEFONTIFCDRAUGHTINGPREDEFINEDCOLOURIFCBOXALIGNMENTIFCVOLUMEMEASUREIFCOBJECTIFCCONSTRAINTAGGREGATIONRELATIONSHIPIFCGRIDPLACEMENTIFCPLANARFORCEMEASUREIFCSURFACEOFREVOLUTIONIFCCURRENCYRELATIONSHIPIFCSPACEPROGRAM" );

let EntityTypesIfcSearch = new MinimalPerfectHash< EntityTypesIfc >( gMapEntityTypesIfc, prefixSumAddressEntityTypesIfc, slotMapEntityTypesIfc, encodedDataEntityTypesIfc );

export default EntityTypesIfcSearch;