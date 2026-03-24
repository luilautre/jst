// Charger variables.json
fetch("/variables")
  .then(r => r.json())
  .then(data => {
    document.getElementById("jsonEditor").value = JSON.stringify(data, null, 2);
  });

// Charger functions.js
fetch("/functions")
  .then(r => r.text())
  .then(code => {
    document.getElementById("codeEditor").value = code;
  });

function saveJSON() {
  const txt = document.getElementById("jsonEditor").value;
  try {
    const parsed = JSON.parse(txt);
    document.getElementById("jsonError").innerText = "";

    fetch("/variables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    }).then(() => alert("variables.json sauvegardé"));
  } catch (e) {
    document.getElementById("jsonError").innerText = "JSON invalide : " + e.message;
  }
}

function saveCode() {
  const code = document.getElementById("codeEditor").value;

  fetch("/functions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  }).then(() => alert("functions.js sauvegardé"));
}
