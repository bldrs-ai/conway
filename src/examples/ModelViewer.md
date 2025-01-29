# IFC Model Browser CLI

This TypeScript CLI allows you to **load** and **interactively explore** an IFC model in the terminal. It features:

- **Auto-completion** of IFC classes (e.g. `IFCBUILDING`, `IFCBUILDINGELEMENTPROXY`),  
- **Auto-completion** of **instance IDs** (e.g. `IFCBUILDINGELEMENTPROXY[#30]`),  
- **Recursive** dot-navigation of entity fields (e.g. `IFCBUILDINGELEMENTPROXY[#30].OwnerHistory.OwningUser`).

When you type a command and press **Tab**, the CLI will show possible completions. Once you **select** or **type** a path and press **Enter**, the CLI displays either the final primitive **value** or a list of **subfields** if you’re still on an entity.

## 1. Prerequisites

Follow the setup guide in the **main project README**:

- **[Setup Instructions](../../README.md)**
- A local **IFC** file to test.

## 2. Usage

1. **Compile** (`yarn build`) and run:
   ```bash
   node --experimental-specifier-resolution=node ./compiled/src/examples/browser.js '/path/to/your.ifc'
   ```
2. You should see a prompt (>). Now you can type partial IFC class names and press Tab to see completions.



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

## Development Path
- [x] 
- [ ] Spatial structure dot expansion, e.g. for this IFC:
```
#1 IFCSITE()
#2 IFCBUILDING(#1)
#3 IFCSTOREY('Story 1', #2)
#4 IFCSTOREY('Story 2', #2)
#5 IFCSTOREY('Story 3', #2)
```
This works:
```IFCSITE.IFCBUILDING.IFCBUILDINGSTOREY[1] // Story 2```
- [ ] Camel case, using the reverse name map, e.g. ```IfcSite.IfcBuilding.IfcBuildingStorey[1] // Story 2```
