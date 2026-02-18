d3.json("matrix_data.json").then(data => {

  // Convert Date
  data.forEach(d => {
    d.Date = new Date(d.Date);
  });

  const districtSelect = d3.select("#districtFilter");
  const mandalSelect   = d3.select("#mandalFilter");
  const schoolSelect   = d3.select("#schoolFilter");
  const sortBySelect   = d3.select("#sortBy");
  const sortOrderSelect = d3.select("#sortOrder");

  // ----------------------------
  // Populate Filters
  // ----------------------------

  function populateFilters() {

    const districts = ["All", ...new Set(data.map(d => d.District))];
    const mandals   = ["All", ...new Set(data.map(d => d.Mandal))];
    const schools   = ["All", ...new Set(data.map(d => d.School))];

    districtSelect.selectAll("option")
      .data(districts)
      .enter().append("option")
      .text(d => d);

    mandalSelect.selectAll("option")
      .data(mandals)
      .enter().append("option")
      .text(d => d);

    schoolSelect.selectAll("option")
      .data(schools)
      .enter().append("option")
      .text(d => d);
  }

  populateFilters();

  // ----------------------------
  // Sorting Logic
  // ----------------------------

  function sortStudents(studentGroups, sortField, order) {

    const milestoneOrder = [
      "B",
      "F1_L1","F1_L2","F1_L3",
      "F2_L1","F2_L2","F2_L3",
      "F3_L1","F3_L2","F3_L3",
      "m1","m2","m3","m4","m5","m6","m7","m8","m9"
    ];

    return studentGroups.sort((a, b) => {

      const aMeta = a[1][0];
      const bMeta = b[1][0];

      let valA = aMeta[sortField];
      let valB = bMeta[sortField];

      if(sortField === "Start_Milestone" || sortField === "Current_Milestone") {
        valA = milestoneOrder.indexOf(valA);
        valB = milestoneOrder.indexOf(valB);
      }

      if(order === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }

  // ----------------------------
  // Render Table
  // ----------------------------

  function renderTable(filteredData) {

    const table = d3.select(".matrix-table");
    table.select("thead").html("");
    table.select("tbody").html("");

    const dates = Array.from(
      new Set(filteredData.map(d => d.Date.getTime()))
    ).sort((a,b) => a-b)
     .map(d => new Date(d));

    let students = d3.groups(filteredData, d => d.VirtualId);

    const sortField = sortBySelect.property("value");
    const sortOrder = sortOrderSelect.property("value");

    students = sortStudents(students, sortField, sortOrder);

    const thead = table.select("thead");
    const tbody = table.select("tbody");

    const headerRow = thead.append("tr");

    ["Student","Grade","Total Days","Start Milestone","Current Milestone"]
      .forEach(h => headerRow.append("th").text(h));

    headerRow.selectAll("th.date")
      .data(dates)
      .enter()
      .append("th")
      .text(d => d3.timeFormat("%b %d")(d));

    students.forEach(([id, records]) => {

      records.sort((a,b) => a.Date - b.Date);

      const row = tbody.append("tr");
      const meta = records[0];

      row.append("td")
        .attr("class","student-name")
        .text(meta.Student);

      row.append("td").text(meta.Grade);
      row.append("td").text(meta.Total_Days);
      row.append("td").text(meta.Start_Milestone);
      row.append("td").text(meta.Current_Milestone);

      dates.forEach(date => {

        const record = records.find(r =>
          r.Date.getTime() === date.getTime()
        );

        const cell = row.append("td");

        if(record) {

          let pillClass = "no-change";

          if(record.Movement && record.Movement.includes("→")) {
            pillClass = "transition";
          }

          cell.append("span")
            .attr("class", "pill " + pillClass)
            .text(record.Movement);
        }
      });
    });
  }

  // ----------------------------
  // Apply Filters
  // ----------------------------

  function applyFilters() {

    const district = districtSelect.property("value");
    const mandal   = mandalSelect.property("value");
    const school   = schoolSelect.property("value");

    const filtered = data.filter(d =>
      (district === "All" || d.District === district) &&
      (mandal   === "All" || d.Mandal   === mandal) &&
      (school   === "All" || d.School   === school)
    );

    renderTable(filtered);
  }

  districtSelect.on("change", applyFilters);
  mandalSelect.on("change", applyFilters);
  schoolSelect.on("change", applyFilters);
  sortBySelect.on("change", applyFilters);
  sortOrderSelect.on("change", applyFilters);

  renderTable(data);

});