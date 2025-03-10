## Regression Testing

Conway has a built in regression testing framework that is designed to be run as a batch process for release checking, but also supports spot and verbose output to track down where regressions are.

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

Assuming you have the test models repository checked out in the cloned in the same parent folder as the conway repository, here would be an example of how to run regression on an the repo, putting the regression baselines in the correct place, as well as creating a custom change file, for a release. This assumes there is a tag (conway-0.1.596) in this case for the release, and that there is a new release for history that will be 0.2.597.

```
node --experimental-specifier-resolution=node ./compiled/src/ifc/ifc_regression_batch_main.js -e "sp-.*\.ifc" -t conway-0.1.596 -c ./regression/history/test-models-conway-0.2.597-vs-conway-0.1.596 ../test-models ./regression/test_models
```

