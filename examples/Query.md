Status: DRAFT API DOCS. Please join or Discord to disuss https://discord.gg/9SxguBkFfQ

# Query

## Query API

The **Query API** (`query.js`) allows you to **query** model entities and their
properties using **JavaScript-like dot and array syntax**.

Example:

```
query('IfcBuilding') // get element as an object
query('IfcWall.OverallHeight') // get a property value directly e.g. 2.5
query('IfcBuildingElementProxy[#30]') // by instance ID
query('IfcBuildingElementProxy[#30].OwnerHistory.OwningUser') // nested objects via dot syntax
```
