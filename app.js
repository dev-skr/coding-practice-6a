const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
let dbPath = path.join(__dirname + "/covid19India.db");
let app = express();
app.use(express.json());

let db = null;

async function starting() {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => console.log("server started at 3000"));
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
}
starting();

app.get("/states/", async (request, response) => {
  let query = `select * from state`;
  let temp = await db.all(query);
  let result = temp.map((obj) => {
    return {
      stateId: obj.state_id,
      stateName: obj.state_name,
      population: obj.population,
    };
  });
  response.send(result);
});

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let query = `select * from state where state_id=${stateId}`;
  let obj = await db.get(query);
  let result = {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
  response.send(result);
});

app.post("/districts/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  console.log(request.body);
  let query = `insert into district (district_name,state_id, cases, cured, active, deaths)
    values("${districtName}",${stateId},${cases},
    ${cured},${active},${deaths})`;
  console.log(query);
  await db.run(query);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let query = `select * from district where district_id=${districtId}`;
  let temp = await db.get(query);
  let result = {
    districtId: temp.district_id,
    districtName: temp.district_name,
    stateId: temp.state_id,
    cases: temp.cases,
    cured: temp.cured,
    active: temp.active,
    deaths: temp.deaths,
  };
  response.send(result);
});

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let query = `delete from district where district_id=${districtId}`;
  await db.run(query);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let { districtName, stateId, cases, active, cured, deaths } = request.body;
  let query = `update district set 
    district_name="${districtName}",state_id=${stateId},cases=${cases},
    active=${active},cured=${cured},deaths=${deaths}
     where district_id=${districtId}`;
  await db.run(query);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  let query = `select sum(district.cases) as cases,
  sum(district.cured) as cured,
  sum(district.active) as active,
  sum(district.deaths) as deaths
  from state inner join district on state.state_id=district.state_id
  where state.state_id=${stateId}
  group by state.state_id`;
  let temp = await db.get(query);
  console.log(temp);
  let result = {
    totalCases: temp.cases,
    totalCured: temp.cured,
    totalActive: temp.active,
    totalDeaths: temp.deaths,
  };
  response.send(result);
});

app.get("/districts/:districtId/details/", async (req, res) => {
  let { districtId } = req.params;
  let query = `select state.state_name from state natural join district 
    where state.state_id=district.state_id`;
  let re = await db.get(query);
  let result = {
    stateName: re.state_name,
  };
  res.send(result);
});

module.exports = app;
