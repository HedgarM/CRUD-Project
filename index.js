// Import required packages and modules
const express = require("express");
const path = require("path");
const app = express();
const dblib = require("./dblib.js");
const multer = require("multer");
const upload = multer();

require('dotenv').config(); // Load environment variables from .env file

// Serve static files from the 'public' directory
app.use(express.static("public"));

// PostgreSQL connection setup using environment variables
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2 // Limit database connections
});

// Middleware to handle CORS headers for API calls
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Setup EJS as the view engine
app.set("view engine", "ejs");

// Middleware to parse incoming requests (JSON and URL-encoded)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Start the server on a specified port
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started (http://localhost:3000/) !");
});

// ------------------ ROUTES ------------------

// Render the home page
app.get("/", (req, res) => {
  res.render("index");
});

// Manage Customers - GET
app.get("/managecust", async (req, res) => {
  const totRecs = await dblib.getTotalRecords(); // Fetch total records count
  res.render("managecust", { totRecs: totRecs.totRecords });
});

// Manage Customers - POST (Search for customers)
app.post("/managecust", upload.array(), async (req, res) => {
  dblib.findCustomer(req.body)
    .then(result => res.send(result)) // Send search results
    .catch(err => res.send({ trans: "Error", error: err.message }));
});

// Create Customer - GET (Display form)
app.get("/create", (req, res) => {
  res.render("create", { model: {} });
});

// Create Customer - POST (Insert into database)
app.post("/create", (req, res) => {
  const sql = `
    INSERT INTO customer (cusfname, cuslname, cusstate, cussalesytd, cussalesprev) 
    VALUES ($1, $2, $3, $4, $5)`;
  const customer = [
    req.body.cusfname, 
    req.body.cuslname, 
    req.body.cusstate, 
    req.body.cussalesytd, 
    req.body.cussalesprev
  ];

  pool.query(sql, customer, (err, result) => {
    if (err) {
      console.error("Database query error:", err.message);
      return res.status(500).render("create", { 
        message: "Error: Unable to create customer", 
        model: req.body 
      });
    }
    console.log("Record added successfully");
    res.render("create", { 
      message: "New Customer Created!", 
      model: {} 
    });
  });
});

// Delete Customer - GET (Confirmation page)
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM customer WHERE cusid = $1";
  pool.query(sql, [id], (err, result) => {
    res.render("delete", { model: result.rows[0] });
  });
});

// Delete Customer - POST (Delete from database)
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM customer WHERE cusid = $1";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Database query error:", err.message);
      return res.status(500).render("delete", { 
        message: "Error: Unable to delete customer", 
        model: {}
      });
    }
    console.log("Record deleted successfully");
    res.render("delete", { 
      message: "Customer Deleted Successfully!", 
      model: {}
    });
  });
});

// Edit Customer - GET (Load customer data into form)
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM customer WHERE cusid = $1";
  pool.query(sql, [id], (err, result) => {
    res.render("edit", { model: result.rows[0] });
  });
});

// Edit Customer - POST (Update customer data)
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const customer = [
    req.body.cusfname, 
    req.body.cuslname, 
    req.body.cusstate, 
    req.body.cussalesytd, 
    req.body.cussalesprev, 
    id
  ];

  const sql = `
    UPDATE customer 
    SET cusfname = $1, cuslname = $2, cusstate = $3, cussalesytd = $4, cussalesprev = $5 
    WHERE cusid = $6`;

  pool.query(sql, customer, (err, result) => {
    if (err) {
      console.error("Database query error:", err.message);
      return res.status(500).render("edit", {
        message: "Error: Unable to update customer.",
        model: req.body
      });
    }
    console.log("Record updated successfully");
    res.render("edit", {
      message: "Customer Updated Successfully!",
      model: req.body
    });
  });
});

// Import Customers - GET
app.get("/import", async (req, res) => {
  const totRecs = await dblib.getTotalRecords(); // Fetch total records
  res.render("import", { totRecs: totRecs.totRecords });
});

// Import Customers - POST (Process file upload)
app.post("/import", upload.single('filename'), async (req, res) => {
  if (!req.file || Object.keys(req.file).length === 0) {
    return res.status(400).json({ message: "Error: Import file not uploaded" });
  }

  const buffer = req.file.buffer;
  const lines = buffer.toString().split(/\r?\n/);

  let successCount = 0;
  let failedCount = 0;
  const errors = [];

  // Process each line in the file
  for (const line of lines) {
    if (!line.trim()) continue;

    const product = line.split(",");
    const sql = `
      INSERT INTO customer (cusfname, cuslname, cusstate, cussalesytd, cussalesprev) 
      VALUES ($1, $2, $3, $4, $5)`;

    try {
      await pool.query(sql, product);
      successCount++;
    } catch (err) {
      failedCount++;
      errors.push(`Error on line "${line}": ${err.message}`);
    }
  }

  // Return summary of the import process
  res.json({ total: lines.length, success: successCount, failed: failedCount, errors: errors });
});

// Export Customers - GET
app.get("/export", async (req, res) => {
  const totRecs = await dblib.getTotalRecords();
  res.render("export", { message: "", totRecs: totRecs.totRecords });
});

// Export Customers - POST (Generate CSV file)
app.post("/export", (req, res) => {
  const sql = "SELECT * FROM customer ORDER BY cusid";
  const filename = req.body.filename || "export.csv";
  const safeFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  pool.query(sql, [], (err, result) => {
    if (err) {
      res.render("export", { message: `Error - ${err.message}` });
    } else {
      let exportdata = "";
      result.rows.forEach(product => {
        exportdata += `${product.cusid},${product.cusfname},${product.cuslname},${product.cusstate},${product.cussalesytd},${product.cussalesprev}\r\n`;
      });
      res.header("Content-Type", "text/csv");
      res.attachment(safeFilename);
      return res.send(exportdata);
    }
  });
});
