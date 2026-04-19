const PING_TIMEOUT_MS = 5000;

async function main() {
  try {
    const [serversData, operatorsData] = await Promise.all([
      fetch("https://raw.githubusercontent.com/znp-consortium/directory/refs/heads/main/servers.json").then((r) => r.json()),
      fetch("https://raw.githubusercontent.com/znp-consortium/directory/refs/heads/main/operators.json").then((r) => r.json()),
    ]);
    const servers = serversData.servers ?? [];
    const operators = operatorsData.operators ?? [];
    renderServers(servers, operators);
    renderOperators(operators);
    pingAll(servers);
  } catch (err) {
    document.body.textContent = "failed to load directory: " + String(err);
  }
}

function renderServers(servers, operators) {
  document.getElementById("servers-count").textContent = String(servers.length);
  const opById = new Map(operators.map((o) => [o.id, o]));
  const tbody = document.querySelector("#servers-table tbody");
  tbody.replaceChildren();

  for (const srv of servers) {
    const tr = document.createElement("tr");
    tr.dataset.url = srv.url;

    const urlCell = td("url");
    const urlLink = document.createElement("a");
    urlLink.href = srv.url.replace(/^ws/, "http");
    urlLink.target = "_blank";
    urlLink.rel = "noopener";
    urlLink.textContent = srv.url;
    urlCell.appendChild(urlLink);

    const regionCell = td("", srv.region ?? "");

    const opCell = td("");
    const op = opById.get(srv.operator);
    if (op?.website) {
      const a = document.createElement("a");
      a.href = normalizeUrl(op.website);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = op.name ?? srv.operator;
      opCell.appendChild(a);
    } else {
      opCell.textContent = op?.name ?? srv.operator ?? "";
    }

    const pingCell = td("ping");
    pingCell.textContent = "---";

    tr.append(urlCell, regionCell, opCell, pingCell);
    tbody.appendChild(tr);
  }
}

function renderOperators(operators) {
  document.getElementById("operators-count").textContent = String(operators.length);
  const list = document.getElementById("operator-list");
  list.replaceChildren();

  for (const op of operators) {
    const block = document.createElement("div");
    block.className = "operator";

    const h3 = document.createElement("h3");
    const displayName = op.name ?? op.id;
    h3.textContent = op.name && op.id && op.name !== op.id
      ? `${op.id} / ${displayName}`
      : displayName;
    block.appendChild(h3);

    const locParts = [op.location?.city, op.location?.country].filter(Boolean);
    if (locParts.length) {
      const loc = document.createElement("div");
      loc.className = "loc";
      loc.textContent = locParts.join(", ");
      block.appendChild(loc);
    }

    if (op.description) {
      const desc = document.createElement("p");
      desc.className = "desc";
      desc.textContent = op.description;
      block.appendChild(desc);
    }

    const dl = document.createElement("dl");
    if (op.contact) appendDef(dl, "contact", op.contact, /*maybeLink*/ true);
    if (op.website) appendDef(dl, "website", op.website, /*maybeLink*/ true);
    if (op.policies?.logging) appendDef(dl, "logging", op.policies.logging);
    if (op.policies?.retention) appendDef(dl, "retention", op.policies.retention);
    if (op.policies?.jurisdiction) appendDef(dl, "jurisdiction", op.policies.jurisdiction);
    if (op.policies?.tos && op.policies.tos !== "n/a")
      appendDef(dl, "tos", op.policies.tos, /*maybeLink*/ true);
    if (dl.children.length) block.appendChild(dl);

    list.appendChild(block);
  }
}

function td(className, text) {
  const el = document.createElement("td");
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function appendDef(dl, term, value, maybeLink = false) {
  const dt = document.createElement("dt");
  dt.textContent = term;
  const dd = document.createElement("dd");
  if (maybeLink && looksLikeLink(value)) {
    const a = document.createElement("a");
    a.href = normalizeUrl(value);
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = value;
    dd.appendChild(a);
  } else {
    dd.textContent = value;
  }
  dl.append(dt, dd);
}

function looksLikeLink(s) {
  return /^https?:\/\//i.test(s) || /\./.test(s) || s.includes("@");
}

function normalizeUrl(s) {
  if (/^https?:\/\//i.test(s)) return s;
  if (s.includes("@") && !s.includes("/")) return "mailto:" + s;
  return "https://" + s;
}

async function pingAll(servers) {
  await Promise.all(
    servers.map(async (srv) => {
      const ms = await pingServer(srv.url);
      const cell = document.querySelector(
        `#servers-table tr[data-url="${cssEscape(srv.url)}"] .ping`,
      );
      if (!cell) return;
      if (ms == null) {
        cell.classList.add("err");
        cell.textContent = "unreachable";
        return;
      }
      cell.classList.add("ready");
      cell.textContent = Math.round(ms) + " ms";
    }),
  );
}

function pingServer(url) {
  return new Promise((resolve) => {
    let ws;
    const t0 = performance.now();
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { ws && ws.close(); } catch {}
      resolve(result);
    };
    const timer = setTimeout(() => finish(null), PING_TIMEOUT_MS);
    try {
      ws = new WebSocket(url);
    } catch {
      finish(null);
      return;
    }
    ws.onopen = () => finish(performance.now() - t0);
    ws.onerror = () => finish(null);
  });
}

function cssEscape(s) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(s);
  return s.replace(/"/g, '\\"');
}

main();
