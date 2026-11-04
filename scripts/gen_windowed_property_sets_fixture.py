#!/usr/bin/env python3
# Writes data/windowed_property_sets.ifc, the fixture for
# src/compat/web-ifc/property_sets_windowed.test.ts (conway#755, conway#761).
#
#   python3 scripts/gen_windowed_property_sets_fixture.py > data/windowed_property_sets.ifc
#
# Layout, in file order: units and the project; four blocks of property
# values; a complex property two hops deep; quantities; twelve walls, a wall
# type and a material; then sets interleaved with the relationships that
# attach them, one set whose properties come after it (forward references).
# Unreferenced IFCCARTESIANPOINT padding spreads the records over many 512 B
# windows, so with the test's three resident windows a set's flatten reaches
# evicted windows and the relationship records span more windows than stay
# resident. The test hard-codes express IDs (the walls start at #207), so
# re-check those after changing this.
import sys
out = []
nid = [100]
def new(line):
    i = nid[0]; nid[0] += 1
    out.append(f"#{i}= {line};")
    return i
def gid(i):
    return ("0PropFixture" + format(i, '010d'))[:22]
def filler(n):
    # Unreferenced points: pad the file so the records around them sit in
    # different 512 B windows.
    for k in range(n):
        new(f"IFCCARTESIANPOINT(({k}.,{k}.5,0.))")

hdr = """ISO-10303-21;
HEADER;FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('windowed_property_sets.ifc','2026-11-04T00:00:00',('Bldrs'),('Bldrs Inc'),'conway','conway#755/#761 fixture','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;"""
length = new("IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)")
area = new("IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)")
units = new(f"IFCUNITASSIGNMENT((#{length},#{area}))")
project = new(f"IFCPROJECT('{gid(1)}',$,'Property fixture',$,$,$,$,$,#{units})")
filler(8)
# Properties first, far ahead of the sets that reference them, in several
# blocks, so a set's flatten reaches records in windows the set's own read
# did not page in.
props = []
for b in range(4):
    for k in range(5):
        props.append(new(f"IFCPROPERTYSINGLEVALUE('P{b}_{k}','block {b}',IFCLENGTHMEASURE({b}.{k}),#{length})"))
    filler(10)
# A nested complex property: two hops to its leaves.
inner = new(f"IFCCOMPLEXPROPERTY('Inner',$,'usage',(#{props[2]},#{props[17]}))")
filler(10)
outer = new(f"IFCCOMPLEXPROPERTY('Outer',$,'usage',(#{inner},#{props[7]}))")
filler(10)
quantities = [new(f"IFCQUANTITYAREA('Area{k}',$,#{area},{k + 1}.5,$)") for k in range(3)]
filler(10)
walls = []
for w in range(12):
    walls.append(new(f"IFCWALL('{gid(100 + w)}',$,'Wall {w}',$,$,$,$,$,$)"))
    if w % 4 == 3:
        filler(6)
wtype = new(f"IFCWALLTYPE('{gid(200)}',$,'Wall type',$,$,$,$,$,$,.STANDARD.)")
mat = new("IFCMATERIAL('Concrete',$,$)")
filler(10)
# Sets and the relationships that attach them, interleaved with padding so
# the relationship records span many windows, more than stay resident.
rels = []
def pset(name, ps):
    return new(f"IFCPROPERTYSET('{gid(300 + len(rels) * 3)}',$,'{name}',$,(" + ",".join(f"#{p}" for p in ps) + "))")
def rel(related, relating):
    rels.append(new(f"IFCRELDEFINESBYPROPERTIES('{gid(301 + len(rels) * 3)}',$,$,$,(" + ",".join(f"#{r}" for r in related) + f"),#{relating})"))
s0 = pset('Common', [props[0], props[5], props[10]])
filler(4)
rel(walls[0:6], s0)
filler(8)
s1 = pset('Nested', [outer, props[15]])
filler(4)
# A wall listed twice in one relationship still gets the set once.
rel([walls[1], walls[6], walls[1]], s1)
filler(8)
q0 = new(f"IFCELEMENTQUANTITY('{gid(400)}',$,'Qto',$,$,(" + ",".join(f"#{q}" for q in quantities) + "))")
filler(4)
rel(walls[2:12], q0)
filler(8)
# Forward references: a set whose properties come after it.
s2 = pset('Forward', [nid[0] + 6, nid[0] + 7])
filler(5)
fwd = [new(f"IFCPROPERTYSINGLEVALUE('F{k}',$,IFCLABEL('forward {k}'),$)") for k in range(2)]
assert fwd == [s2 + 6, s2 + 7], (fwd, s2)
filler(4)
rel([walls[0], walls[11]], s2)
filler(8)
# The type and the project carry sets too.
s3 = pset('TypeSet', [props[3], props[19]])
rel([wtype, project], s3)
filler(8)
new(f"IFCRELDEFINESBYTYPE('{gid(500)}',$,$,$,(" + ",".join(f"#{w}" for w in walls[:8]) + f"),#{wtype})")
filler(8)
new(f"IFCRELASSOCIATESMATERIAL('{gid(501)}',$,$,$,(" + ",".join(f"#{w}" for w in walls[4:]) + f"),#{mat})")
# Walls 7..9 get their sets last: the second relationship for wall 7.
filler(8)
rel([walls[7], walls[8], walls[9]], s0)
# A proxy with a representation, and a type with a representation map, for
# the default flatten that leaves geometry representations as handles. The
# shape records sit behind padding of their own, away from the proxy.
filler(8)
# Forward references, filled in once the shape records have IDs.
proxy = new(f"IFCBUILDINGELEMENTPROXY('{gid(600)}',$,'Proxy',$,$,$,@PDS@,$,$)")
ptype = new(f"IFCBUILDINGELEMENTPROXYTYPE('{gid(601)}',$,'Proxy type',$,$,$,(@MAP@),$,$,.NOTDEFINED.)")
new(f"IFCRELDEFINESBYTYPE('{gid(602)}',$,$,$,(#{proxy}),#{ptype})")
rel([proxy], s0)
filler(16)
origin = new("IFCCARTESIANPOINT((0.,0.,0.))")
axis = new(f"IFCAXIS2PLACEMENT3D(#{origin},$,$)")
context = new(f"IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#{axis},$)")
corners = [new(f"IFCCARTESIANPOINT(({k}.,0.,0.))") for k in range(3)]
shape = new(f"IFCSHAPEREPRESENTATION(#{context},'Annotation','Point',(" + ",".join(f"#{c}" for c in corners) + "))")
pds = new(f"IFCPRODUCTDEFINITIONSHAPE($,$,(#{shape}))")
pmap = new(f"IFCREPRESENTATIONMAP(#{axis},#{shape})")
out = [line.replace("@PDS@", f"#{pds}").replace("@MAP@", f"#{pmap}") for line in out]
sys.stdout.write(hdr + "\n" + "\n".join(out) + "\nENDSEC;\nEND-ISO-10303-21;\n")
