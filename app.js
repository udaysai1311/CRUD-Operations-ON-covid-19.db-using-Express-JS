const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started at http://locahost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBServer();

//Convert State
const convert = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

//Convert District
const convertDis = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

//GET state API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const stateArray = await db.all(getStatesQuery);
  response.send(stateArray.map((eachObj) => convert(eachObj)));
});

//GET state API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convert(state));
});

//POST District API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictQuery = `
        INSERT INTO district
            (district_name,state_id,cases,cured,active,deaths)
        VALUES
            ('${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths});
    `;
  const dbResponse = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//GET District using ID API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const dbResponse = await db.get(getDistrictQuery);
  response.send(convertDis(dbResponse));
});

//DELETE District API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//PUT District API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE
            district
        SET 
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE
            district_id = ${districtId};`;
  const dbResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET stats API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
        SELECT
            sum(cases) AS totalCases,
            sum(cured) AS totalCured,
            sum(active) AS totalActive,
            sum(deaths) AS totalDeaths
        FROM 
            district
        WHERE 
            state_id = ${stateId};`;
  const dbResponse = await db.get(getStatsQuery);
  response.send(dbResponse);
});

//GET API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  //const { districtId } = request.params;
  //const getStateNameQuery = `
  //      SELECT
  //          state_name AS stateName
  //      FROM
  //          state JOIN district ON state.state_id = district.district_id
  //      WHERE
  //          district_id = ${districtId};`;
  //const dbResponse = await db.all(getStateNameQuery);
  //response.send(dbResponse);
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    SELECT 
        state_id 
    FROM 
        district
    WHERE 
        district_id = ${districtId};`; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
    SELECT 
        state_name AS stateName 
    FROM 
        state
    WHERE 
        state_id = ${getDistrictIdQueryResponse.state_id};`; //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
