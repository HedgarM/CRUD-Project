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
      .catch(err => res.send({trans: "Error", error: err.message}));

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