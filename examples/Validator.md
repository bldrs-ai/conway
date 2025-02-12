# IFC Model Validator CLI

The **IFC Model Validator** (`validator.js`) allows you to **validate**
conditions on IFC entities and their properties using **JavaScript
expressions**.

This tool lets you:

- **Query** all instances of an IFC class (e.g. `IFCWINDOW`)  
- **Filter** specific properties using operators (`<=`, `>=`, `==`, etc.)  
- **Validate** a condition across all instances and **generate a report**  
- **Check specific IFC entities** by their Express ID (e.g. `IFCWINDOW[#15]`)  

## 1. Prerequisites

Follow the setup guide in the **main project README**:

- **[Setup Instructions](../../README.md)**
- A local **IFC** file to test.

### Requirements

- **Node.js** (version 14+ recommended).  
- **TypeScript** (if you compile locally) or use `ts-node` for direct execution.  
- A valid **IFC file** to run validation on (e.g. `myFile.ifc`).

---

## 2. Usage

### Running the Validator

1. Ensure your project is set up correctly using the **[../../README.md](../../README.md)** setup guide.
2. Execute the validator with:
   
   ```bash
   node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js '/path/to/your.ifc' "JSexpression"
   ```

3. The `<JSexpression>` is a **JavaScript-executable condition** to check against an IFC class or a specific instance.

---

## 3. Query Syntax

### **Basic Structure**

```text
<ClassName>[#OptionalID].<Property> <Operator> <Value>
```

- `<ClassName>` → The **IFC class** (e.g. `IFCWINDOW`, `IFCDOOR`).  
- `[#OptionalID]` → (Optional) A **specific instance Express ID** (e.g. `[#15]`).  
- `<Property>` → The **property name** of the entity (e.g. `Height`, `Width`).  
- `<Operator>` → A **JavaScript comparison operator** (`<`, `<=`, `>`, `>=`, `==`, `!=`).  
- `<Value>` → The **value to compare against** (number, boolean, or string).

---

### **Comparison Operators**

| Operator | Meaning |
|----------|---------|
| `<`  | Less than |
| `<=` | Less than or equal to |
| `>`  | Greater than |
| `>=` | Greater than or equal to |
| `==` | Equal to (loose comparison) |
| `===` | Strict equal (type-sensitive) |
| `!=` | Not equal |
| `!==` | Strict not equal |

---

### **Examples**

#### **1. Checking All IFC Windows with a Height Constraint**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCWINDOW.Height <= 5"
```

#### **2. Checking Specific IFC Window (Express ID `#15`)**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCWINDOW[#15].Height <= 5"
```

#### **3. Checking IFC Doors That Are Taller Than 2.1**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCDOOR.Height > 2.1"
```

#### **4. Checking If A Window Width Is Exactly 1.2**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCWINDOW.Width == 1.2"
```

#### **5. Checking If A Window Has a Specific Name**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc 'IFCWINDOW.Name == "LivingRoomWindow"'
```

#### **6. Checking If An IFC Site Exists**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCSITE"
```

---

## 4. Validation Report Output

After running a validation query, you will see a **summary report** in the terminal:

### **Example Output:**
```text
Validation Report for Query: IFCWINDOW.Height <= 5

✔️ IFCWINDOW[#12] → PASSED (Height: 4.8)
❌ IFCWINDOW[#23] → FAILED (Height: 5.5)
✔️ IFCWINDOW[#31] → PASSED (Height: 4.9)

✅ Total Passing: 2
❌ Total Failing: 1
```

---

## 5. How Expressions Are Evaluated

This tool **directly evaluates** your query using **JavaScript expressions** (`eval`).  
Here’s what happens internally:

1. **Parses the query** into:
   - **Class (`IFCWINDOW`)**
   - **Property (`Height`)**
   - **Operator (`<=`)**
   - **Value (`5`)**  
2. **Finds** all instances of `IFCWINDOW` in the IFC file.  
3. **Extracts** their `Height` property.  
4. **Evaluates the condition** dynamically using `eval()`:
   ```js
   const condition = `4.8 <= 5`; // Example for one entity
   const result = eval(condition); // true or false
   ```
5. **Generates a pass/fail report**.

---

## 6. Additional Features

### ✅ **Supports All IFC Entities**
- Works on **all IFC classes** (`IFCWALL`, `IFCWINDOW`, `IFCDOOR`, etc.).
- Works for **custom properties** as long as they exist on the IFC entity.

### ✅ **Supports Multiple Operators**
- Use any **valid JavaScript comparison operators**.

### ✅ **Handles Missing Data**
- If a property **does not exist**, it is treated as `undefined`.

---

## 7. Error Handling

### ❌ **Invalid Query Format**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCWINDOW.[Height] <= 5"
```
**Error:** `"Invalid query format"`

✅ **Fix:** Remove extra brackets:  
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCWINDOW.Height <= 5"
```

---

### ❌ **Property Does Not Exist**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCWINDOW.NonExistentProp == 1"
```
**Error:** `"Property 'NonExistentProp' not found on IFCWINDOW"`

✅ **Fix:** Use an existing property like `"IFCWINDOW.Height <= 5"`.

---

### ❌ **Unknown IFC Class**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCFAKECLASS.Height > 3"
```
**Error:** `"IFC class 'IFCFAKECLASS' does not exist in this model"`

✅ **Fix:** Ensure you're querying a **valid IFC class**.

---

## 8. Summary

- ✅ **Pass a query** to filter IFC entities by **properties** and **values**.
- ✅ **Supports expressions** using **JavaScript operators** (`<=`, `>=`, `==`, etc.).
- ✅ **Works on specific instances** (e.g., `IFCWINDOW[#15]`).
- ✅ **Returns a validation report** of passing and failing instances.
- ✅ **Handles missing properties** gracefully.
- ✅ **Interactive IFC model validation** from the terminal. 🚀

---

### 🎯 **Try It Now!**
```bash
node --experimental-specifier-resolution=node ./compiled/src/examples/validator.js myModel.ifc "IFCDOOR.Height >= 2.1"
```

This CLI makes **IFC validation intuitive, powerful, and scriptable**—directly in **JavaScript expressions**. 🚀
