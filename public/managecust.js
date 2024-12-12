// Function to display results
const displayResults = (result) => {
  const divElement = document.getElementById("output");
  // Reset output for each call
  divElement.innerHTML = "";

  if (result.trans === "Error") {
      // Create h2 and paragraph elements and add to div
      const h2Elem = document.createElement("h2");
      h2Elem.innerText = "Application Error";
      const paraElement = document.createElement("p");
      paraElement.innerText = result.error;
      // Add elements
      divElement.appendChild(h2Elem);
      divElement.appendChild(paraElement);
  } else {
      if (result.rows.length === 0) {
        // Create h3 and add to div
        const h3Elem = document.createElement("h3");
        h3Elem.innerText = "No Records found!";
        divElement.appendChild(h3Elem);
      } else {
          // Create a table element and table header row
          const tblElement = document.createElement("table");
          tblElement.classList.add("table","table-hover","align-middle","table-striped");
          const theadElement = document.createElement("thead");
          const thRowElement = document.createElement("tr");
          
          const thIdElement = document.createElement("th");
          thIdElement.innerText = "ID";
          const thFNameElement = document.createElement("th");
          thFNameElement.innerText = "First Name";
          const thLNameElement = document.createElement("th");
          thLNameElement.innerText = "Last Name";
          const thStateElement = document.createElement("th");
          thStateElement.innerText = "State";
          const thYTDElement = document.createElement("th");
          thYTDElement.innerText = "Sales YTD";
          const thPrevSalesElement = document.createElement("th");
          thPrevSalesElement.innerText = "Previous Years Sales";
          const thAddRecordElement = document.createElement("th");
          thAddRecordElement.classList.add("d-print-none");
          thAddRecordElement.innerHTML = '<a class="btn btn-sm btn-success" href="/create">Create Customer</a>';
          
          // Add header elements
          thRowElement.appendChild(thIdElement);
          thRowElement.appendChild(thFNameElement);
          thRowElement.appendChild(thLNameElement);
          thRowElement.appendChild(thStateElement);
          thRowElement.appendChild(thYTDElement);
          thRowElement.appendChild(thPrevSalesElement);
          thRowElement.appendChild(thAddRecordElement);
          
          theadElement.appendChild(thRowElement);
          tblElement.appendChild(theadElement);
          

          // Loop
          result.rows.forEach(product => { 
            // Create table rows
            const trElement = document.createElement("tr");
            
            const tdIdElement = document.createElement("td");
            tdIdElement.innerText = product.cusid;
            
            const tdFNameElement = document.createElement("td");
            tdFNameElement.innerText = product.cusfname;
            
            const tdLNameElement = document.createElement("td");
            tdLNameElement.innerText = product.cuslname;
            
            const tdStateElement = document.createElement("td");
            tdStateElement.innerText = product.cusstate;
            
            const tdYTDElement = document.createElement("td");
            tdYTDElement.innerText = product.cussalesytd;
            
            const tdPrevSalesElement = document.createElement("td");
            tdPrevSalesElement.innerText = product.cussalesprev;
        
            // Create buttons for Edit and Delete
            const tdActionsElement = document.createElement("td");
            tdActionsElement.classList.add("text-center", "d-print-none");
        
            const editButton = document.createElement("button");
            editButton.classList.add("btn", "btn-sm", "btn-warning", "me-2");
            editButton.innerText = "Edit";
            editButton.addEventListener("click", () => {
                window.location.href = `/edit/${product.cusid}`;;
            });
        
            const deleteButton = document.createElement("button");
            deleteButton.classList.add("btn", "btn-sm", "btn-danger");
            deleteButton.innerText = "Delete";
            deleteButton.addEventListener("click", () => {
                window.location.href = `/delete/${product.cusid}`;
            });
        
            // Append buttons to actions cell
            tdActionsElement.appendChild(editButton);
            tdActionsElement.appendChild(deleteButton);
        
            // Add cells to the row
            trElement.appendChild(tdIdElement);
            trElement.appendChild(tdFNameElement);
            trElement.appendChild(tdLNameElement);
            trElement.appendChild(tdStateElement);
            trElement.appendChild(tdYTDElement);
            trElement.appendChild(tdPrevSalesElement);
            trElement.appendChild(tdActionsElement);
        
            // Append row to the table
            tblElement.appendChild(trElement);
        });
          // Add table to div
          divElement.appendChild(tblElement);
       };
  };
};

// Handle form submission
document.querySelector("form").addEventListener("submit", e => {
  // Cancel default behavior of sending a synchronous POST request
  e.preventDefault();
  // Create a FormData object, passing the form as a parameter
  const formData = new FormData(e.target);
  fetch("/managecust", {
      method: "POST",
      body: formData
  })
      .then(response => response.json())
      .then(result => {
          displayResults(result);
      })
      .catch(err => {
          console.error(err.message);
      });
});