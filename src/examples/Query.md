Status: DRAFT API DOCS. Please join or Discord to disuss https://discord.gg/9SxguBkFfQ

# Query

## Query API

The **Query API** (`query.js`) allows you to **query** model entities and their properties using **JavaScript-like dot and array syntax**.

Example:

```
query('IfcBuilding') // get element as an object
query('IfcWall.OverallHeight') // get a property value directly e.g. 2.5
query('IfcBuildingElementProxy[#30]') // by instance ID
query('IfcBuildingElementProxy[#30].OwnerHistory.OwningUser') // nested objects via dot syntax
```

## Query CLI Tool

This TypeScript CLI allows you to **load** and **interactively explore** an IFC model in the terminal. It features:

- **Auto-completion** of IFC classes (e.g. `IfcBuilding`, `IfcBuildingElementProxy`),  
- **Auto-completion** of **instance IDs** (e.g. `IfcBuildingElementProxy[#30]`),  
- **Dot-navigation** of nested entity fields (e.g. `IfcBuildingElementProxy[#30].OwnerHistory.OwningUser`).

When you type a command and press **Tab**, the CLI will show possible completions. Once you **select** or **type** a path and press **Enter**, the CLI displays either the final primitive **value** or a list of **subfields** if you’re still on an entity.

## 1. Prerequisites

Follow the setup guide in the **main project README**:

- **[Setup Instructions](../../README.md)**
- A local **IFC** file to test.

## 2. Usage

1. **Compile** (`yarn build`) and run:
   ```bash
   > ./query.sh /path/to/your.ifc
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

## Development Plan
- [ ] Camel case, using the reverse name map, e.g.
  ```text
  IfcSite.IfcBuilding.IfcBuildingStorey[1] // Story 2
  ```
- [ ] Spatial structure dot expansion, e.g. for this IFC:
  ```text
  #1 IFCSITE()
  #2 IFCBUILDING(#1)
  #3 IFCSTOREY('Story 1', #2)
  #4 IFCSTOREY('Story 2', #2)
  #5 IFCSTOREY('Story 3', #2)
  ```
  This works:
  ```text
  IFCSITE.IFCBUILDING.IFCBUILDINGSTOREY[1] // Story 2
  ```
