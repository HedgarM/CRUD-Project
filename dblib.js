// Add packages
require("dotenv").config();
// Add database package and connection string
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 2
});

const getTotalRecords = () => {
    const sql = "SELECT COUNT(*) FROM customer";
    return pool.query(sql)
        .then(result => {
            return {
                msg: "success",
                totRecords: result.rows[0].count
            }
        })
        .catch(err => {
            return {
                msg: `Error: ${err.message}`
            }
        });
};

module.exports.getTotalRecords = getTotalRecords;

const findCustomer = (customer) => {
    // Will build the query based on data provided in the form
    //  Use parameters to avoid sql injection

    // Declare variables
    let i = 1;
    const params = [];
    let sql = "SELECT * FROM customer WHERE true";

    // Check data provided and build the query as necessary
    if (customer.cusid !== "") {
        params.push(parseInt(customer.cusid));
        sql += ` AND cusid = $${i}`;
        i++;
    };
    if (customer.cusfname !== "") {
        params.push(`${customer.cusfname}%`);
        sql += ` AND UPPER(cusfname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cuslname !== "") {
        params.push(`${customer.cuslname}%`);
        sql += ` AND UPPER(cuslname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cusstate !== "") {
        params.push(parseFloat(customer.cusstate));
        sql += ` AND cusstate >= $${i}`;
        i++;
    };

    sql += ` ORDER BY cusid`;
    // for debugging
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql, params)
        .then(result => {
            return { 
                trans: "success",
                rows: result.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                error: `Error: ${err.message}`
            }
        });
};

// Add towards the bottom of the page
module.exports.findCustomer = findCustomer;