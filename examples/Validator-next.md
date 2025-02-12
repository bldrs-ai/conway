Status: DRAFT API DOCS.  Please join or Discord to disuss https://discord.gg/9SxguBkFfQ


# Validation API & Validator Tool

## Usage

1. ```yarn install```
2. ```yarn validator <your model.ifc>```
3. You should see a prompt (>). Now you can type partial JS expressions to assert validation conditions.


## Validation API

The **Validation API** is used by the `validator.js` tool to **validate**
conditions on model entities and their properties using **JavaScript
expressions** and the powerful assertion frameworks of Jest/Mocha.

Example API call:

```
expectElements('IfcWall.OverallHeight').toEqual(2.5)
```


## Validator Tool

Run validation checks from the command line:

```
> ./validate.sh ./path/to/model.ifc 'IfcWall.OverallHeight <= 5'
Validation report for query: IfcWall.OverallHeight <= 5

✔️ IfcWall[#12] → PASS (OverallHeight: 4.8)
❌ IfcWall[#23] → FAIL (OverallHeight: 5.5)
✔️ IfcWall[#31] → PASS (OverallHeight: 4.9)

✔️ Total Passing: 2
❌ Total Failing: 1
```

## Query Syntax

Queries use pure JS expression syntax, on a built-in `query` function.
```text
query('<ClassName>[#OptionalID].<Property>')<JSexpression>
```

Assertions use pure expressions, on a built-in `expect` function.  The return value may be chained using any functions supported in the [bun-jest implementation](https://github.com/oven-sh/bun/issues/1825)
```text
expectElements('<ClassName>[#OptionalID].<Property>')<Jest expression>
```


### **Abbreviated Structure**

An abbreviated syntax is available for simple checks using in/equality operators:

```text
<ClassName>[#OptionalID].<Property> <Operator> <Value>
```

Is equivalent to:
```text
query('<ClassName>[#OptionalID].<Property>')<JSexpression>
```

The validator just extracts the first token of the terse query and surrounds it by `query(${FIRST_TOKEN})`

---

### **Examples**

**1. Checking All IFC Windows with a Height Constraint**

```js
query('IFCWINDOW.Height') <= 5
```

Terse:
```js
IFCWINDOW.Height <= 5
```


**2. Checking Specific IFC Window (Express ID `#15`)**

```js
expectElements('IFCWINDOW[#15].Height') <= 5
```
No terse form.

**3. Checking IFC Doors That Are Taller Than 2.1**

```js
query('IFCDOOR.Height') > 2.1
```
Terse:
```js
IFCDOOR.Height > 2.1
```

**4. Checking If A Window Width Is Exactly 1.2**

```query('IFCWINDOW.Width') == 1.2```


**5. Checking If A Window Has a Specific Name**

```query('IFCWINDOW.Name') == "LivingRoomWindow"```


**6. Checking If An IFC Site Exists**

```expectElements('IFCSITE').toExist()```

---

## Validation Report Output

After running a validation query, you will see a **summary report** in the terminal:

### **Example Output:**
```text
Validation Report for Query: IFCWINDOW.OverallHeight <= 5

✔️ IFCWINDOW[#12] → PASSED (OverallHeight: 4.8)
❌ IFCWINDOW[#23] → FAILED (OverallHeight: 5.5)
✔️ IFCWINDOW[#31] → PASSED (OverallHeight: 4.9)

✅ Total Passing: 2
❌ Total Failing: 1
```

---

## How Expressions Are Evaluated

This tool **directly evaluates** your query using **JavaScript expressions** (`eval`).  

Here’s what happens internally:

1. Parse query string
   1. If the string starts with 'IFC' (or lower case), expect a Terse format, then **Parse the query** into:
     - **Class (`IFCWINDOW`)**
     - **Property (`Height`)**
     - **Operator (`<=`)**
     - **Value (`5`)**
   2. Otherwise, pass full string thru as Query
3. **Finds** all instances of `IFCWINDOW` in the IFC file.  
4. **Extracts** their `Height` property.  
5. **Evaluates the condition** dynamically using `eval()`, in the context of a Jest test harness:
   ```js
   const value = 4.8                           // Example query result for one entity
   const condition = '<= 5'                    // From your expression
   const expr = `${value} ${condition}`;       // Expression to be evaluated
   const result = eval(condition);             // Eval the expression

   // Use jest testing framework to assert expected result
   it(`test: ${condition}`, () => expect(result).toBeTrue())
   ```
6. **Generates a pass/fail report** on all elements matching your query.

---

## Additional Features

### ✅ **Supports All IFC Entities**
- Works on **all IFC classes** (`IFCWALL`, `IFCWINDOW`, `IFCDOOR`, etc.).
- Works for **custom properties** as long as they exist on the IFC entity.

### ✅ **Supports Arbitrary JavsScript Expressions and Jest/Mocha asserts**
- Use any **valid JavaScript comparison operators**.
- Use any Jest/Mocha test operator

### ✅ **Handles Missing Data**
- If a property **does not exist**, it is treated as `undefined`.

---

## Error Handling

### ❌ **Invalid Query Format**
```js
query('IFCWINDOW.[Height]') <= 5
```
**Error:** `"Invalid query format"`

✅ **Fix:** Remove extra brackets:  
```js
query('IFCWINDOW.Height') <= 5"
```

---

### ❌ **Property Does Not Exist**
```js
expect('IFCWINDOW.NonExistentProp').toExist() == 1"
```
**Error:** `"Property 'NonExistentProp' not found on IFCWINDOW"`

✅ **Fix:** Use an existing property like `IFCWINDOW.Height`.

---

### ❌ **Unknown IFC Class**
```js
query('IFCFAKECLASS.Height') > 3"
```
**Error:** `"IFC class 'IFCFAKECLASS' does not exist in this model"`

✅ **Fix:** Ensure you're querying a **valid IFC class**.

---

## Summary

- ✅ **Pass a query** to filter IFC entities by **properties** and **values**.
- ✅ **Supports expressions** using **JavaScript operators** (`<=`, `>=`, `==`, etc.).
- ✅ **Works on specific instances** (e.g., `IFCWINDOW[#15]`).
- ✅ **Returns a validation report** of passing and failing instances.
- ✅ **Handles missing properties** gracefully.
- ✅ **Interactive IFC model validation** from the terminal. 🚀

---

### 🎯 **Try It Now!**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "query(IFCDOOR.Height) >= 2.1"
```

This CLI makes **IFC validation intuitive, powerful, and scriptable**—directly in **JavaScript expressions**. 🚀
