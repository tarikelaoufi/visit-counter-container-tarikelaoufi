const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
const port = process.env.PORT || 3000;
const visitsFile = path.join(__dirname, "visits.json");

let lock = false;

function readCounter() {
  try {
    if (!fs.existsSync(visitsFile)) {
      fs.writeFileSync(
        visitsFile,
        JSON.stringify({ count: 0 }, null, 2),
        "utf8"
      );
    }

    const data = fs.readFileSync(visitsFile, "utf8");
    const parsedData = JSON.parse(data);

    return Number(parsedData.count) || 0;
  } catch (error) {
    console.error("Erreur pendant la lecture de visits.json :", error);
    return 0;
  }
}

function writeCounter(count) {
  try {
    fs.writeFileSync(
      visitsFile,
      JSON.stringify({ count }, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Erreur pendant l’écriture de visits.json :", error);
  }
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket.remoteAddress || "Indisponible";
}

function getServerIp() {
  const interfaces = os.networkInterfaces();

  for (const interfaceName of Object.keys(interfaces)) {
    const networks = interfaces[interfaceName] || [];

    for (const network of networks) {
      if (network.family === "IPv4" && !network.internal) {
        return network.address;
      }
    }
  }

  return "Indisponible";
}

app.get("/", async (req, res) => {
  while (lock) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  lock = true;

  try {
    let visitCount = readCounter();
    visitCount++;

    writeCounter(visitCount);

    const hostname = req.hostname || os.hostname();
    const serverIp = getServerIp();
    const clientIp = getClientIp(req);

    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >
          <title>Compteur de visites : Test CI/CD réussi</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              background: #f2f5f9;
              min-height: 100vh;
              margin: 0;
              padding: 40px 20px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .card {
              width: min(700px, 100%);
              padding: 40px;
              background: white;
              border-radius: 20px;
              box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
              text-align: center;
            }

            h1 {
              color: #24292f;
              margin-top: 0;
            }

            h2 {
              color: #0078d4;
            }

            .author {
              color: #555;
            }

            .counter {
              margin: 25px 0 15px;
              font-size: 64px;
              font-weight: bold;
              color: #0078d4;
            }

            .reload-button {
              margin-top: 10px;
              padding: 12px 22px;
              border: none;
              border-radius: 12px;
              background: #0078d4;
              color: white;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition:
                transform 0.2s ease,
                background 0.2s ease;
            }

            .reload-button:hover {
              background: #005fa3;
              transform: translateY(-1px);
            }

            .reload-button:active {
              transform: translateY(0);
            }

            .section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #d9d9d9;
              text-align: left;
            }

            .info-row {
              margin: 12px 0;
              overflow-wrap: anywhere;
            }

            .status {
              margin-top: 25px;
              padding: 12px;
              background: #e8f5e9;
              border-radius: 10px;
              color: #1b5e20;
            }

            @media (max-width: 600px) {
              .card {
                padding: 25px;
              }

              .counter {
                font-size: 50px;
              }
            }
          </style>
        </head>

        <body>
          <div class="card">
            <h1>Compteur de visites : Test CI/CD réussi</h1>

            <p class="author">
              <strong>Réalisé par :</strong> Tarik El Aoufi
            </p>

            <p>Nombre de visites :</p>

            <div class="counter">${visitCount}</div>

            <button
              type="button"
              class="reload-button"
              onclick="window.location.reload()"
            >
              Recharger la page
            </button>

            <div class="section">
              <h2>Informations serveur</h2>

              <p class="info-row">
                <strong>Hostname :</strong> ${hostname}
              </p>

              <p class="info-row">
                <strong>Port :</strong> ${port}
              </p>

              <p class="info-row">
                <strong>IP serveur :</strong> ${serverIp}
              </p>
            </div>

            <div class="section">
              <h2>Informations client</h2>

              <p class="info-row">
                <strong>IP client :</strong> ${clientIp}
              </p>
            </div>

            <div class="status">
              Application déployée automatiquement sur Azure avec GitHub Actions
            </div>
          </div>
        </body>
      </html>
    `);
  } finally {
    lock = false;
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    visits: readCounter(),
    hostname: os.hostname(),
    port
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Application démarrée sur le port ${port}`);
});