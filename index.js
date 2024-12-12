//SERVER SETUP
const express = require("express");
const path = require("path");
const app = express();
const dblib = require("./dblib.js");
const multer = require("multer");
const upload = multer();

require('dotenv').config();

app.use(express.static("public"));

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 2
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false })); // <--- middleware configuration

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
  // res.send("Hello world...");
  res.render("index");
});

app.get("/managecust", async (req, res) => {
  // Omitted validation check
  const totRecs = await dblib.getTotalRecords();
  res.render("managecust", {
    totRecs: totRecs.totRecords,
  });
});

app.post("/managecust", upload.array(), async (req, res) => {
  dblib.findCustomer(req.body)
    .then(result => res.send(result))
    .catch(err => res.send({ trans: "Error", error: err.message }));

});

// GET /create
app.get("/create", (req, res) => {
  res.render("create", { model: {} });
});

// POST /create
app.post("/create", (req, res) => {
  const sql = "INSERT INTO customer (cusfname, cuslname, cusstate, cussalesytd, cussalesprev) VALUES ($1, $2, $3, $4, $5)";
  const customer = [req.body.cusfname, req.body.cuslname, req.body.cusstate, req.body.cussalesytd, req.body.cussalesprev];

  pool.query(sql, customer, (err, result) => {
    console.log(sql);
    if (err) {
      console.error("Database query error:", err.message); // Log the error
      return res.status(500).send("Error inserting data into the database."); // Send error response
    }
    console.log("Record added successfully");
    res.redirect("/managecust");
  });
});

// GET /delete
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM customer WHERE cusid = $1";
  pool.query(sql, [id], (err, result) => {
    // if (err) ...
    res.render("delete", { model: result.rows[0] });
  });
});

// POST /delete
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM customer WHERE cusid = $1";
  pool.query(sql, [id], (err, result) => {
    // if (err) ...
    res.redirect("/managecust");
  });
});

// GET /edit
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM customer WHERE cusid = $1";
  pool.query(sql, [id], (err, result) => {
    // if (err) ...
    res.render("edit", { model: result.rows[0] });
  });
});

// POST /edit
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const customer = [req.body.cusfname, req.body.cuslname, req.body.cusstate, req.body.cussalesytd, req.body.cussalesprev, id];
  const sql = "UPDATE customer SET cusfname = $1, cuslname = $2, cusstate = $3, cussalesytd = $4, cussalesprev = $5 WHERE (cusid = $6)";
  pool.query(sql, customer, (err, result) => {
    // if (err) ...
    res.redirect("/managecust");
  });
});

app.get("/import", async (req, res) => {
  const totRecs = await dblib.getTotalRecords();
  res.render("import", {
    totRecs: totRecs.totRecords,
  });
});

app.post("/import", upload.single('filename'), async (req, res) => {
  if (!req.file || Object.keys(req.file).length === 0) {
    return res.status(400).json({ message: "Error: Import file not uploaded" });
  }

  const buffer = req.file.buffer;
  const lines = buffer.toString().split(/\r?\n/);

  let successCount = 0;
  let failedCount = 0;
  const errors = [];

  // Process file line by line
  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines

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

  // Send the summary as JSON response
  res.json({
    total: lines.length,
    success: successCount,
    failed: failedCount,
    errors: errors
  });
});


app.get("/export", async (req, res) => {
  let message = "";
  const totRecs = await dblib.getTotalRecords();

  res.render("export", {
    message: message,
    totRecs: totRecs.totRecords,
  });
});

app.post("/export", (req, res) => {
  const sql = "SELECT * FROM customer ORDER BY cusid";
  const filename = req.body.filename || "export.csv"; // Default to "export.csv" if empty

  // Ensure the filename ends with ".csv"
  const safeFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  pool.query(sql, [], (err, result) => {
    let message = "";
    if (err) {
      message = `Error - ${err.message}`;
      res.render("export", { message: message });
    } else {
      let exportdata = "";
      result.rows.forEach(product => {
        exportdata += `${product.cusid},${product.cusfname},${product.cuslname},${product.cusstate},${product.cussalesytd},${product.cussalesprev}\r\n`;
      });
      res.header("Content-Type", "text/csv");
      res.attachment(safeFilename); // Use the user-provided filename
      return res.send(exportdata);
    }
  });
});
