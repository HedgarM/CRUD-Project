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
    console.log(sql);
    // Check data provided and build the query as necessary
    if (customer.cusid && customer.cusid !== "") {
        params.push(parseInt(customer.cusid));
        sql += ` AND cusid = $${i}`;
        i++;
    }
    if (customer.cusfname && customer.cusfname.trim() !== "") {
        params.push(`${customer.cusfname}%`);
        sql += ` AND cusfname LIKE $${i}`;
        i++;
    }
    if (customer.cuslname && customer.cuslname.trim() !== "") {
        params.push(`${customer.cuslname}%`);
        sql += ` AND cuslname LIKE $${i}`;
        i++;
    }
    if (customer.cusstate && customer.cusstate.trim() !== "") {
        params.push(customer.cusstate);
        sql += ` AND cusstate = $${i}`;
        i++;
    }
    console.log("cussalesytd raw input:", customer.cussalesytd, "Type:", typeof customer.cussalesytd);
    if (customer.cussalesytd && customer.cussalesytd.trim() !== "" && !isNaN(Number(customer.cussalesytd))) {
        console.log("Sales YTD value detected:", customer.cussalesytd); // Debugging
        params.push(Number(customer.cussalesytd));
        sql += ` AND cussalesytd >= $${i}`;
        i++;
    }
    
    if (customer.cussalesprev && customer.cussalesprev.trim() !== "" && !isNaN(parseFloat(customer.cussalesprev))) {
        params.push(parseFloat(customer.cussalesprev));
        sql += ` AND cussalesprev >= $${i}`;
        i++;
    }
    


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