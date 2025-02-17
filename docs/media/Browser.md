Status: DRAFT API DOCS.  Please join or Discord to disuss https://discord.gg/9SxguBkFfQ


# Model Browser Tool

## Usage

1. ```yarn install```
2. ```yarn browse <your model.ifc>```
3. You should see a prompt (>). Now you can type partial IFC class names and press Tab to see completions.


## Examples
#### Autocompleting IFC classes:
```
> IfcB [Tab]
IFCBUILDING                IFCBUILDINGELEMENTPROXY  IFCBUILDINGSTOREY
```
#### Listing instances:
```
> IFCBUILDINGELEMENTPROXY [Tab]
IFCBUILDINGELEMENTPROXY[#30]  IFCBUILDINGELEMENTPROXY[#52]  ...
```

#### Selecting a specific ID (e.g. IFCBUILDINGELEMENTPROXY[#30]) then navigating its fields:
```
> IFCBUILDINGELEMENTPROXY[#30].
GlobalId       OwnerHistory    Name         ...

> IFCBUILDINGELEMENTPROXY[#30].Ow [Tab]
OwningUser     OwningApplication
```

#### Computing a value from the loaded model

```
> IFCBUILDINGELEMENTPROXY[#30].OwnerHistory.OwningApplication.Version
> "4.0.0"
```
