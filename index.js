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