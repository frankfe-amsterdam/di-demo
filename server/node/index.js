const express = require("express");
const irma = require("@privacybydesign/irmajs");
const app = express();
const cors = require("cors");
const util = require("util");
const fs = require("fs");
const path = require("path");
const uuidv5 = require("uuid/v5");
var proxy = require("http-proxy-middleware");

// global configuration variable.
let config;

const CREDENTIALS_TO_REQUEST = {
  DEMO: {
    DEMO1_18: [["irma-demo.gemeente.personalData.over18"]],
    DEMO1_65: [["irma-demo.gemeente.personalData.over65"]],
    DEMO2: [
      [
        "irma-demo.gemeente.address.zipcode",
        "irma-demo.gemeente.personalData.over18",
      ],
      [
        "irma-demo.RU.idinData.zipcode",
        "irma-demo.gemeente.personalData.over18",
      ],
    ],
    DEMO3: [
      [
        "irma-demo.gemeente.personalData.fullname",
        "irma-demo.gemeente.personalData.bsn",
      ],
    ],
    DEMO4: [
      [
        "irma-demo.gemeente.personalData.fullname",
        "irma-demo.gemeente.address.street",
        "irma-demo.gemeente.address.houseNumber",
        "irma-demo.RU.idinData.zipcode",
        "irma-demo.RU.idinData.city",
        "irma-demo.pbdf.mobilenumber.mobilenumber",
        // TODO fix irma-demo.sidn-pbdf.email.email
        // "irma-demo.sidn-pbdf.email.email",
      ],
    ],
    DEMO5: [["irma-demo.sidn-pbdf.email.domain"]],
  },
  PRODUCTION: {
    DEMO1_18: [["pbdf.gemeente.personalData.over18"]],
    DEMO1_65: [["pbdf.gemeente.personalData.over65"]],
    DEMO2: [
      ["pbdf.gemeente.address.zipcode", "pbdf.gemeente.personalData.over18"],
    ],
    DEMO3: [
      ["pbdf.gemeente.personalData.fullname", "pbdf.gemeente.personalData.bsn"],
    ],
    DEMO4: [
      [
        "pbdf.gemeente.personalData.fullname",
        "pbdf.gemeente.address.street",
        "pbdf.gemeente.address.houseNumber",
        "pbdf.gemeente.address.zipcode",
        "pbdf.gemeente.address.city",
        "pbdf.pbdf.mobilenumber.mobilenumber",
        // TODO fix pbdf.pbdf.email.email
        // "pbdf.pbdf.email.email",
      ],
    ],
    DEMO5: [["pbdf.pbdf.email.domain"]],
  },
};

/**
 * Use this call to check the request:
 * `curl -H "Content-Type: application/json" -H 'X-IRMA-MinProtocolVersion: "2.4"' -H 'X-IRMA-MaxProtocolVersion: "2.5"' https://acc.attr.auth.amsterdam.nl/irma/session/zhvALcNoCbCyU0MMZNz5`
 * `curl -H "Content-Type: application/json" -H 'X-IRMA-MinProtocolVersion: "2.4"' -H 'X-IRMA-MaxProtocolVersion: "2.5"' http://localhost:8088/irma/session/WJGQXzbdepNfUg1dc3nT`
 *
 * The result should look like `{"@context":"https://irma.app/ld/request/disclosure/v2","context":"AQ==","nonce":"VItsL+3+GiBHyIt1hIRwSQ==","protocolVersion":"2.5","disclose":[[["pbdf.sidn-pbdf.irma.pseudonym"]]]}`
 */

const createIrmaRequest = (content) => {
  return {
    "@context": "https://irma.app/ld/request/disclosure/v2",
    disclose: [[...content]],
  };
};

const init = async () => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set");
  }

  try {
    // read the config file only once each session
    if (config === undefined) {
      const json = await util.promisify(fs.readFile)("config.json", "utf-8");
      console.log("Using config", json);
      config = JSON.parse(json);
    }

    app.use(express.json());

    // Note: To use the demo credentials on non-production environments add ?demo=true to the URL
    app.get("/getsession/demo1/18", cors(), irmaDiscloseDemo1_18);
    app.get("/getsession/demo1/65", cors(), irmaDiscloseDemo1_65);
    app.get("/getsession/demo2", cors(), irmaDiscloseDemo2);
    app.get("/getsession/demo3", cors(), irmaDiscloseDemo3);
    app.get("/getsession/demo4", cors(), irmaDiscloseDemo4);
    app.get("/getsession/demo5", cors(), irmaDiscloseDemo5);
    app.get("/config", cors(), getConfig);

    if (
      process.env.NODE_ENV === "acceptance" ||
      process.env.NODE_ENV === "production"
    ) {
      app.use(express.static(config.docroot));
      app.get("*", function (req, res) {
        res.sendFile(path.join(__dirname, config.docroot, "index.html"));
      });
    } else {
      console.log("Using proxy to the react app for development");
      // proxy the root to the react app container in development mode
      app.use(
        "/",
        proxy({
          target: "http://fe:9000",
          changeOrigin: true,
        })
      );
    }

    app.listen(config.port, () =>
      console.log(
        `Di-demo backend running in ${
          process.env.NODE_ENV || "development"
        } mode.`
      )
    );
  } catch (e) {
    console.log(e);
    error(e);
  }
};

const irmaDiscloseRequest = async (req, res, requestType, id) => {
  const authmethod = "publickey";
  const request = createIrmaRequest(requestType, req.query.clientReturnUrl);

  console.log("irma.irmaDiscloseRequest called: ", {
    url: config.irma,
    request: JSON.stringify(request),
    authmethod,
  });

  try {
    const session = await irma.startSession(
      config.irma,
      request,
      authmethod,
      process.env.PRIVATE_KEY,
      config.requestorname
    );

    console.log("session result", session);
    res.json(session);
  } catch (e) {
    console.log("irma.startSession error:", JSON.stringify(e));
    error(e, res);
  }
};

const getCredentialSourceFromRequest = (req) => {
  return req &&
    req.query.demo === "true" &&
    process.env.NODE_ENV !== "production"
    ? CREDENTIALS_TO_REQUEST.DEMO
    : CREDENTIALS_TO_REQUEST.PRODUCTION;
};

async function irmaDiscloseDemo1_18(req, res) {
  return irmaDiscloseRequest(
    req,
    res,
    getCredentialSourceFromRequest(req).DEMO1_18
  );
}

async function irmaDiscloseDemo1_65(req, res) {
  return irmaDiscloseRequest(
    req,
    res,
    getCredentialSourceFromRequest(req).DEMO1_65
  );
}

async function irmaDiscloseDemo2(req, res) {
  return irmaDiscloseRequest(
    req,
    res,
    getCredentialSourceFromRequest(req).DEMO2
  );
}
async function irmaDiscloseDemo3(req, res) {
  return irmaDiscloseRequest(
    req,
    res,
    getCredentialSourceFromRequest(req).DEMO3
  );
}
async function irmaDiscloseDemo4(req, res) {
  return irmaDiscloseRequest(
    req,
    res,
    getCredentialSourceFromRequest(req).DEMO4
  );
}

async function irmaDiscloseDemo5(req, res) {
  return irmaDiscloseRequest(
    req,
    res,
    getCredentialSourceFromRequest(req).DEMO5
  );
}

const getConfig = async (req, res) => {
  config.environment = process.env.NODE_ENV;
  console.log("get config", JSON.stringify(config));
  res.json(config);
};

const error = (e, res) => {
  const jsonError = JSON.stringify(e);
  console.error("Node error", jsonError);
  if (res) {
    res.json({ error: jsonError });
  }
};

init();