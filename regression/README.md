## Regression Testing

Conway has a built in regression testing framework that is designed to be run as a batch process for release checking, but also supports spot and verbose output to track down where regressions are.

### CI tiering

CI runs the framework at three escalating scopes, so full-corpus cost is paid once per release instead of per push:

1. **Every PR / merge** — unit tests plus the in-repo `data/` goldens (Tier A in `build.yml`), and the digest batch over the **smoke subset** in `regression/smoke_models.txt`. A smoke model that fails to parse blocks the PR; digest *changes* are informational and reviewed via the visual diff.
2. **Release candidate (`rc-*` tag)** — `rc-regression.yml` runs the batch over the **entire public and private corpora**, goes red on any failure, and opens a baseline PR in each test-models repo. That PR's diff is the release's regression report; merging it blesses the baselines so they track releases exactly.
3. **Perf** — the headless-three benchmarks also run per `rc-*` tag (`perf-three-*` in `build.yml`); timings from the parallel smoke batch are contended and only a coarse signal.

 ### Individual models

Conway can run produce regression dump output, designed to be diffed against the dumps of previous versions. This is done by the individual regression testing console application, which has a manifest digest mode (which produces a CSV hash manifest of all the curve, profile and mesh components of an IFC file) and a verbose mode (produces OBJ files for all the same components in a directory).

It can be run with:

```

node --experimental-specifier-resolution=node ./compiled/src/ifc/ifc_regression_main.js -d <ifc file path> [output path]

node --experimental-specifier-resolution=node ./compiled/src/ifc/ifc_regression_main.js -v <ifc file path> [output path]

node --experimental-specifier-resolution=node ./compiled/src/ifc/ifc_regression_main.js -d -v <ifc file path> [output path]

```

The digest (-d) or verbose OBJ modes (-v) can be run separately or together. The output path is optional and is otherwise the ifc file path without the ".ifc" extension. For verbose mode a folder with "_obj" appended will be used for the output, and for the digest mode, the ".csv" extension will be appended to the output path.

Digests for IFC files are stably sorted (by Express ID) and have SHA1 hashes for the individual pieces of geometry produced by Conway, including curves, meshes, profiles and materials, as well as the type and references for the operands for boolean operators, and if the particular element is a void. For an example, check out the manifest of the index.ifc file from the [test models repository](https://github.com/bldrs-ai/test-models) [here](test_models/index.csv).

### Digest columns

IFC digests are `ID,Hash,Type,Operand 1,Operand2,Void`. STEP (AP214)
digests carry those six unchanged and add a seventh, `Placement`:

| column | meaning |
|---|---|
| `ID` | expressID of the element the row is for, or the geometry's local id where it has none. Rows are stably sorted by it. |
| `Hash` | SHA1 of the OBJ serialisation of that geometry **definition** — its tessellation, in its own local frame. |
| `Type` | Entity type name. |
| `Operand 1` / `Operand2` | Boolean-operator operands (IFC only; AP214 leaves them empty). |
| `Void` | Whether the element is a void (IFC CSG; `FALSE` on every AP214 mesh row, empty on curve rows). |
| `Placement` | **AP214 only.** SHA1 over the sorted set of places that definition was put: for each placed instance, its full absolute 4x4 transform and the occurrence path (NAUO express ids) that placed it. Empty for a definition the scene never placed, and for curve rows, which are memoized per definition and never enter the scene graph. |

`Hash` and `Placement` are the two independent axes of a STEP regression.
`Hash` moves when tessellation changes; `Placement` moves when geometry
lands somewhere else, or under a different assembly occurrence, while
tessellating identically. Before `Placement` existed the digest could not
see the second axis at all — `data/ap214-mapped-item-failure.step`
relocates five solids by 500 mm with a byte-identical digest (conway#583).
Keeping them in separate columns is deliberate: a row that moves only in
`Placement` is geometry that was placed differently, and a row that moves
only in `Hash` is geometry that was tessellated differently, and the diff
says which.

`Placement` is order-invariant by construction — the per-definition
records are sorted before hashing — so it does not depend on the walk
order, on `demandItemsPerUnit`, or on where the pump's wall-clock budget
happened to end a batch. That property is the point of the column, and
`src/AP214E3_2010/ap214_placement_digest.test.ts` pins it.

The IFC digest has the same structural blindness and no equivalent column
yet; see [design/new/step-regression.md](../design/new/step-regression.md)
§"The placement column" for why that was left alone.


### Batch Mode

There is a batch mode console application that is used for batch mode testing that is expected to be run on repositories of test models and have its results put into the regression baselines folder (the regression folder in the repository), with a sub-folder per set of baselines. The regression baseline application is designed to be run from the Conway repository root.

The batch mode only runs regressions in digest mode, putting them into the output folder, and then creates a master manifest/digest, in a stable sorted order, with a hash of each digest and the corresponding model name. The batch mode also creates an errors manifest, containing the logged errors and counts for each file that has been run.

After this, it also runs a diff using git against the previous version (or one specified by a git commit reference such as a commit hash, tag or branch head) of the folder to create a changes csv file that summarizes the number of changed lines in each digest/manifest. In addition to this there is a "dry run" mode which will roll back the changes to the manifests after producing the changes file. This can be used for running regression tests after making changes before commit. 

The batch app can be run like so: 

```
node --experimental-specifier-resolution=node .\compiled\src\ifc\ifc_regression_batch_main.js [options...] <input IFC file> <output folder>
```
Here are the options:

 1. Setting a commit diff target (_--target_ or _-t_ &lt;commit reference&gt;)
 2. Dry run mode (_--dryrun_ or _-d_)
 3. Set the changes file output path (_--changes_ or _-c_ &lt;file path without csv extension&gt;)
 4. Exclusion regex filter that filters out files from being processed (_--exclude_ or _-e_ &lt;regex&gt;).
 5. Aggregate performance CSV output (_--perf_ &lt;output path&gt;). Each model emits a one-row `parseTimeMs / geometryTimeMs / totalTimeMs / rssMb / heapUsedMb / heapTotalMb` row; the batch sorts by file name and writes them all to this path. Disabled when unset. The output path should live outside the regression folder so machine-specific timings don't get picked up by the git-diff step.

Assuming you have the test models repository checked out in the cloned in the same parent folder as the conway repository, here would be an example of how to run regression on an the repo, putting the regression baselines in the correct place, as well as creating a custom change file, for a release. This assumes there is a tag (conway-0.1.596) in this case for the release, and that there is a new release for history that will be 0.2.597.

```
node --experimental-specifier-resolution=node ./compiled/src/ifc/ifc_regression_batch_main.js -e "sp-.*\.ifc" -t conway-0.1.596 -c ./regression/history/test-models-conway-0.2.597-vs-conway-0.1.596 ../test-models ./regression/test_models
```

