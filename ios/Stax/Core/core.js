"use strict";
var Core = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value2) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value2 }) : obj[key] = value2;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value2) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value2);

  // core/entry.ts
  var entry_exports = {};
  __export(entry_exports, {
    handle: () => handle
  });

  // src/routes/api/v1/backup/+server.ts
  var server_exports = {};
  __export(server_exports, {
    GET: () => GET,
    POST: () => POST
  });

  // core/shims/kit.ts
  var HttpError = class extends Error {
    constructor(status, body) {
      super(body.message);
      __publicField(this, "status", status);
      __publicField(this, "body", body);
    }
  };
  function json(data, init) {
    return { status: init?.status ?? 200, body: JSON.stringify(data) };
  }
  function error(status, message) {
    throw new HttpError(status, typeof message === "string" ? { message } : message);
  }

  // core/shims/sqlite.ts
  var pack = (p) => JSON.stringify(p.map((v) => typeof v === "boolean" ? v ? 1 : 0 : typeof v === "bigint" ? Number(v) : v === void 0 ? null : v));
  var StatementSync = class {
    constructor(sql) {
      __publicField(this, "sql", sql);
    }
    all(...p) {
      return JSON.parse(__stax.query(this.sql, pack(p)));
    }
    get(...p) {
      return this.all(...p)[0];
    }
    run(...p) {
      return JSON.parse(__stax.run(this.sql, pack(p)));
    }
  };
  var DatabaseSync = class {
    constructor(_path) {
    }
    exec(sql) {
      __stax.exec(sql);
    }
    prepare(sql) {
      return new StatementSync(sql);
    }
  };

  // core/shims/fs.ts
  var mkdirSync = () => void 0;

  // core/shims/path.ts
  var join = (...parts) => parts.join("/");
  var resolve = (...parts) => parts.join("/");

  // src/lib/server/seed.ts
  var UITGAVEN = [
    ["Wonen", "budget", null, "home", [
      ["Hypotheek", null, null, null],
      ["Gas, Water & Licht", null, null, "bolt"],
      ["Internet & telefoon", null, null, "phone"],
      ["Woonverzekering", "pot", "spaar", "shield"],
      ["Onderhoud huis", "pot", "spaar", "wrench"],
      ["Lokale lasten", "pot", "spaar", "building"],
      ["Huis & Tuin", null, null, null]
    ]],
    ["Vervoer", "budget", null, "car", [
      ["OV", null, null, "train"],
      ["Brandstof", "budget", null, "fuel"],
      ["Parkeren", null, null, null],
      ["Autoverzekering", "pot", "spaar", "shield"],
      ["Wegenbelasting", "pot", "spaar", "building"],
      ["Onderhoud auto", "pot", "spaar", "wrench"]
    ]],
    ["Zorg", "pot", "spaar", "heart", [
      ["Zorgpremie", null, null, null],
      ["Overige zorgkosten", null, null, null]
    ]],
    ["Levensonderhoud", "budget", null, "cart", [
      ["Boodschappen", null, null, "cart"],
      ["Verzorging", null, null, null],
      ["Kleding", null, null, "shirt"]
    ]],
    ["Vrije tijd", "budget", null, "sun", [
      ["Entertainment", null, null, "play"],
      ["Cadeautjes", null, null, "gift"],
      ["Uitjes", null, null, null],
      ["Vakantie", "pot", "spaar", "plane"],
      ["Uiteten, Terras & To-Go", null, null, "cup"]
    ]],
    ["Sparen", "pot", "spaar", "piggy", [
      ["Noodfonds", null, null, "umbrella"],
      ["Vrij sparen", null, null, null]
    ]],
    ["Overig", "budget", null, "dots", [["Bankkosten", null, null, null]]]
  ];
  var INKOMSTEN = [
    ["Salaris", null, null, "briefcase"],
    ["Extra inkomsten", null, null, null],
    ["Rente", null, null, null],
    ["Teruggaven & vergoedingen", null, null, null]
  ];
  var MCC = {
    "5411": "Boodschappen",
    "5422": "Boodschappen",
    "5441": "Boodschappen",
    "5451": "Boodschappen",
    "5462": "Boodschappen",
    "5499": "Boodschappen",
    "5541": "Brandstof",
    "5542": "Brandstof",
    "4111": "OV",
    "4112": "OV",
    "4131": "OV",
    "7523": "Parkeren",
    "5812": "Uiteten, Terras & To-Go",
    "5813": "Uiteten, Terras & To-Go",
    "5814": "Uiteten, Terras & To-Go",
    "5200": "Huis & Tuin",
    "5211": "Huis & Tuin",
    "5251": "Huis & Tuin",
    "5261": "Huis & Tuin",
    "5712": "Huis & Tuin",
    "5719": "Huis & Tuin",
    "5651": "Kleding",
    "5661": "Kleding",
    "5691": "Kleding",
    "5699": "Kleding",
    "5912": "Verzorging",
    "5977": "Verzorging",
    "7230": "Verzorging",
    "4899": "Entertainment",
    "5815": "Entertainment",
    "5818": "Entertainment",
    "7832": "Uitjes",
    "7922": "Uitjes",
    "7991": "Uitjes",
    "7996": "Uitjes"
  };
  function seed(db2) {
    const insert = db2.prepare("INSERT INTO categories (parent_id, tree, name, behavior, funding, icon, sort) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const ids = /* @__PURE__ */ new Map();
    function add(nodes, parent, tree) {
      nodes.forEach(([name, behavior, funding, icon, children], i) => {
        const id = Number(insert.run(parent, tree, name, behavior, funding, icon, i).lastInsertRowid);
        ids.set(name, id);
        if (children) add(children, id, tree);
      });
    }
    const uitgaven = Number(insert.run(null, "uitgaven", "Uitgaven", "budget", null, null, 0).lastInsertRowid);
    const inkomsten = Number(insert.run(null, "inkomsten", "Inkomsten", "budget", null, null, 1).lastInsertRowid);
    add(UITGAVEN, uitgaven, "uitgaven");
    add(INKOMSTEN, inkomsten, "inkomsten");
    const rule = db2.prepare("INSERT INTO rules (field, op, pattern, category_id) VALUES ('mcc', 'is', ?, ?)");
    for (const [mcc, name] of Object.entries(MCC)) {
      const id = ids.get(name);
      if (id) rule.run(mcc, id);
    }
  }

  // src/lib/server/migrate-groups.ts
  var ICONS = {
    home: "home",
    car: "directions_car",
    heart: "favorite",
    cart: "shopping_cart",
    sun: "sunny",
    piggy: "savings",
    plane: "flight",
    wrench: "build",
    shield: "shield",
    building: "account_balance",
    fuel: "local_gas_station",
    train: "train",
    gift: "redeem",
    shirt: "checkroom",
    umbrella: "umbrella",
    briefcase: "work",
    phone: "mobile",
    bolt: "bolt",
    cup: "local_cafe",
    play: "live_tv",
    coins: "payments",
    dots: "more_horiz"
  };
  function groupsOnly(db2) {
    for (const [from, to] of Object.entries(ICONS)) db2.prepare("UPDATE categories SET icon = ? WHERE icon = ?").run(to, from);
    const cats = db2.prepare("SELECT id, parent_id, tree, name, behavior, funding, opening_cents, goal_cents, goal_date, start_month, archived FROM categories").all();
    const byId = new Map(cats.map((c) => [c.id, c]));
    const kids = (id) => cats.filter((c) => c.parent_id === id && !c.archived);
    const effective = (c) => {
      const up = c.parent_id != null ? effective(byId.get(c.parent_id)) : { behavior: "budget", funding: "spaar" };
      return { behavior: c.behavior ?? up.behavior, funding: c.funding ?? up.funding };
    };
    const insert = db2.prepare(
      `INSERT INTO categories (parent_id, tree, name, behavior, funding, opening_cents, goal_cents, goal_date, start_month, sort)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort), -1) + 1 FROM categories WHERE parent_id = ?))`
    );
    for (const c of cats) {
      if (kids(c.id).length === 0) {
        const e2 = effective(c);
        if (c.parent_id != null) db2.prepare("UPDATE categories SET behavior = ?, funding = ? WHERE id = ?").run(e2.behavior, e2.behavior === "pot" ? e2.funding : null, c.id);
        continue;
      }
      const e = effective(c);
      const spaarSplits = db2.prepare(
        `SELECT s.id FROM splits s JOIN transactions t ON t.id = s.transaction_id JOIN accounts a ON a.id = t.account_id
				 WHERE s.category_id = ? AND a.kind = 'spaar'`
      ).all(c.id);
      if (c.tree === "uitgaven" && (spaarSplits.length || c.opening_cents)) {
        const pot = Number(insert.run(c.id, c.tree, "Spaargeld", "pot", "spaar", c.opening_cents, null, null, c.start_month, c.id).lastInsertRowid);
        for (const s of spaarSplits) db2.prepare("UPDATE splits SET category_id = ? WHERE id = ?").run(pot, s.id);
        db2.prepare(
          `UPDATE rules SET category_id = ? WHERE category_id = ? AND field = 'omschrijving' AND pattern IN (
				 SELECT lower(t.description) FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE a.kind = 'spaar')`
        ).run(pot, c.id);
        db2.prepare("UPDATE categories SET opening_cents = 0 WHERE id = ?").run(c.id);
      }
      const has = (sql) => !!db2.prepare(sql).get(c.id);
      const rest = has("SELECT 1 FROM splits WHERE category_id = ?") || has("SELECT 1 FROM budgets WHERE category_id = ?") || has("SELECT 1 FROM rules WHERE category_id = ?") || c.goal_cents != null && c.parent_id != null;
      if (rest) {
        const name = c.parent_id == null && c.tree === "inkomsten" ? "Overige inkomsten" : "Algemeen";
        const behavior = c.tree === "uitgaven" ? e.behavior : "budget";
        const id = Number(
          insert.run(c.id, c.tree, name, behavior, behavior === "pot" ? e.funding : null, 0, c.goal_cents, c.goal_date, c.start_month, c.id).lastInsertRowid
        );
        for (const table of ["splits", "budgets", "rules"]) db2.prepare(`UPDATE ${table} SET category_id = ? WHERE category_id = ?`).run(id, c.id);
      }
      db2.prepare("UPDATE categories SET behavior = NULL, funding = NULL, goal_cents = NULL, goal_date = NULL WHERE id = ?").run(c.id);
    }
  }

  // src/lib/server/migrate-levels.ts
  function twoLevels(db2) {
    const load = () => db2.prepare("SELECT id, parent_id, tree, name, sort, icon FROM categories ORDER BY sort, name").all();
    const ownData = (id) => !!db2.prepare("SELECT 1 FROM splits WHERE category_id = ? LIMIT 1").get(id) || !!db2.prepare("SELECT 1 FROM budgets WHERE category_id = ? AND amount_cents != 0 LIMIT 1").get(id) || !!db2.prepare("SELECT 1 FROM rules WHERE category_id = ? LIMIT 1").get(id) || !!db2.prepare("SELECT 1 FROM categories WHERE id = ? AND (opening_cents != 0 OR goal_cents IS NOT NULL)").get(id);
    const setParent = db2.prepare("UPDATE categories SET parent_id = ?, sort = ? WHERE id = ?");
    const remove = (id) => {
      db2.prepare("DELETE FROM budgets WHERE category_id = ?").run(id);
      db2.prepare("DELETE FROM categories WHERE id = ?").run(id);
    };
    for (const tree of ["uitgaven", "inkomsten"]) {
      const root = load().find((c) => c.tree === tree && c.parent_id == null);
      if (!root) continue;
      if (tree === "uitgaven") {
        const promoted = /* @__PURE__ */ new Map();
        for (; ; ) {
          const cats2 = load();
          const byId = new Map(cats2.map((c) => [c.id, c]));
          const kids = (id) => cats2.filter((c) => c.parent_id === id);
          const depth2 = (c) => c.parent_id == null ? 0 : 1 + depth2(byId.get(c.parent_id));
          const sub = cats2.filter((c) => c.tree === tree && depth2(c) >= 2 && kids(c.id).length > 0).sort((a, b) => depth2(a) - depth2(b))[0];
          if (!sub) break;
          let top = byId.get(sub.parent_id);
          while (top.parent_id !== root.id) top = byId.get(top.parent_id);
          const left = byId.get(sub.parent_id);
          if (!sub.icon) {
            let up = left;
            while (up && !up.icon) up = up.parent_id != null ? byId.get(up.parent_id) : void 0;
            if (up?.icon) db2.prepare("UPDATE categories SET icon = ? WHERE id = ?").run(up.icon, sub.id);
          }
          const done = promoted.get(top.id) ?? 0;
          promoted.set(top.id, done + 1);
          const order = kids(root.id).map((c) => c.id);
          order.splice(order.indexOf(top.id) + 1 + done, 0, sub.id);
          order.forEach((id, i) => setParent.run(root.id, i, id));
          if (left.id !== root.id && kids(left.id).filter((c) => c.id !== sub.id).length === 0 && !ownData(left.id)) remove(left.id);
        }
        const cats = load();
        const loose = cats.filter((c) => c.parent_id === root.id && !cats.some((k) => k.parent_id === c.id) && ownData(c.id));
        if (loose.length) {
          let overig = cats.find((c) => c.parent_id === root.id && c.name === "Overig" && !loose.includes(c));
          if (!overig) {
            const id = Number(
              db2.prepare("INSERT INTO categories (parent_id, tree, name, icon, sort) VALUES (?, 'uitgaven', 'Overig', 'more_horiz', 999)").run(root.id).lastInsertRowid
            );
            overig = { id, parent_id: root.id, tree: "uitgaven", name: "Overig", sort: 999, icon: "more_horiz" };
          }
          const start = cats.filter((c) => c.parent_id === overig.id).length;
          loose.forEach((c, i) => setParent.run(overig.id, start + i, c.id));
        }
      } else {
        for (; ; ) {
          const cats = load();
          const group = cats.find((c) => c.tree === tree && c.parent_id != null && cats.some((k) => k.parent_id === c.id));
          if (!group) break;
          const order = cats.filter((c) => c.parent_id === root.id).map((c) => c.id);
          const inner = cats.filter((c) => c.parent_id === group.id).map((c) => c.id);
          order.splice(order.indexOf(group.id) + 1, 0, ...inner);
          order.forEach((id, i) => setParent.run(root.id, i, id));
          if (!ownData(group.id)) remove(group.id);
        }
      }
    }
    db2.exec(`UPDATE categories SET behavior = NULL, funding = NULL, goal_cents = NULL, goal_date = NULL
		WHERE tree = 'uitgaven' AND parent_id IN (SELECT id FROM categories WHERE parent_id IS NULL)`);
  }

  // src/lib/server/db.ts
  var DATA_DIR = resolve("data");
  var MIGRATIONS = [
    `
	CREATE TABLE accounts (
		id INTEGER PRIMARY KEY,
		iban TEXT NOT NULL UNIQUE,
		name TEXT NOT NULL,
		kind TEXT NOT NULL DEFAULT 'betaal' CHECK (kind IN ('betaal', 'spaar'))
	);

	CREATE TABLE imports (
		id INTEGER PRIMARY KEY,
		filename TEXT NOT NULL,
		account_id INTEGER NOT NULL REFERENCES accounts(id),
		imported_at TEXT NOT NULL DEFAULT (datetime('now')),
		n_total INTEGER NOT NULL,
		n_new INTEGER NOT NULL
	);

	-- Begin- en eindsaldo uit elk afschrift; het recentste eindsaldo bepaalt het rekeningsaldo.
	CREATE TABLE statements (
		id INTEGER PRIMARY KEY,
		import_id INTEGER NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
		account_id INTEGER NOT NULL REFERENCES accounts(id),
		opening_cents INTEGER,
		opening_date TEXT,
		closing_cents INTEGER,
		closing_date TEXT
	);

	CREATE TABLE transactions (
		id INTEGER PRIMARY KEY,
		account_id INTEGER NOT NULL REFERENCES accounts(id),
		import_id INTEGER REFERENCES imports(id),
		bank_ref TEXT NOT NULL,
		booking_date TEXT NOT NULL,
		amount_cents INTEGER NOT NULL,
		counterparty TEXT,
		counterparty_iban TEXT,
		description TEXT NOT NULL DEFAULT '',
		raw_info TEXT NOT NULL DEFAULT '',
		bank_code TEXT,
		mcc TEXT,
		transfer_account_id INTEGER REFERENCES accounts(id),
		transfer_tx_id INTEGER REFERENCES transactions(id),
		excluded INTEGER NOT NULL DEFAULT 0,
		note TEXT,
		UNIQUE (account_id, bank_ref)
	);
	CREATE INDEX transactions_date ON transactions(booking_date);

	-- tree: 'uitgaven' of 'inkomsten'. Elke boom heeft \xE9\xE9n wortel (parent_id NULL).
	-- behavior NULL = overnemen van de bovenliggende map.
	CREATE TABLE categories (
		id INTEGER PRIMARY KEY,
		parent_id INTEGER REFERENCES categories(id),
		tree TEXT NOT NULL CHECK (tree IN ('uitgaven', 'inkomsten')),
		name TEXT NOT NULL,
		behavior TEXT CHECK (behavior IN ('sparen', 'budget_reset', 'budget_mee', 'bijhouden')),
		monthly_cents INTEGER,
		opening_cents INTEGER NOT NULL DEFAULT 0,
		start_month TEXT,
		sort INTEGER NOT NULL DEFAULT 0,
		archived INTEGER NOT NULL DEFAULT 0
	);

	-- Een boeking is ingedeeld via \xE9\xE9n of meer splitsingen; samen tellen ze op tot het bedrag.
	CREATE TABLE splits (
		id INTEGER PRIMARY KEY,
		transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
		category_id INTEGER NOT NULL REFERENCES categories(id),
		amount_cents INTEGER NOT NULL,
		source TEXT NOT NULL DEFAULT 'hand' CHECK (source IN ('hand', 'regel', 'naam'))
	);
	CREATE INDEX splits_tx ON splits(transaction_id);
	CREATE INDEX splits_cat ON splits(category_id);

	-- field: 'iban' en 'mcc' vergelijken exact, 'tegenpartij' en 'omschrijving' op 'is' of 'bevat'.
	CREATE TABLE rules (
		id INTEGER PRIMARY KEY,
		field TEXT NOT NULL CHECK (field IN ('iban', 'tegenpartij', 'omschrijving', 'mcc')),
		op TEXT NOT NULL DEFAULT 'is' CHECK (op IN ('is', 'bevat')),
		pattern TEXT NOT NULL,
		category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		UNIQUE (field, op, pattern)
	);

	CREATE TABLE settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);
	`,
    // Twee soorten mappen: 'budget' (elke maand opnieuw) en 'pot' (bouwt op), plus doel, geldplek en icoon.
    `
	CREATE TABLE categories_new (
		id INTEGER PRIMARY KEY,
		parent_id INTEGER REFERENCES categories(id),
		tree TEXT NOT NULL CHECK (tree IN ('uitgaven', 'inkomsten')),
		name TEXT NOT NULL,
		behavior TEXT CHECK (behavior IN ('budget', 'pot')),
		monthly_cents INTEGER,
		opening_cents INTEGER NOT NULL DEFAULT 0,
		start_month TEXT,
		goal_cents INTEGER,
		goal_date TEXT,
		funding TEXT CHECK (funding IN ('spaar', 'betaal')),
		icon TEXT,
		sort INTEGER NOT NULL DEFAULT 0,
		archived INTEGER NOT NULL DEFAULT 0
	);
	INSERT INTO categories_new (id, parent_id, tree, name, behavior, monthly_cents, opening_cents, start_month, funding, sort, archived)
	SELECT id, parent_id, tree, name,
		-- Een meegaand budget zonder bedrag wordt een gewoon budget; met bedrag een pot op de betaalrekening.
		CASE WHEN behavior = 'sparen' OR (behavior = 'budget_mee' AND monthly_cents IS NOT NULL) THEN 'pot' WHEN behavior IS NULL THEN NULL ELSE 'budget' END,
		monthly_cents, opening_cents, start_month,
		CASE WHEN behavior = 'sparen' THEN 'spaar' WHEN behavior = 'budget_mee' AND monthly_cents IS NOT NULL THEN 'betaal' END,
		sort, archived
	FROM categories;
	DROP TABLE categories;
	ALTER TABLE categories_new RENAME TO categories;
	UPDATE categories SET icon = CASE name
		WHEN 'Wonen' THEN 'home' WHEN 'Vervoer' THEN 'car' WHEN 'Zorg' THEN 'heart' WHEN 'Levensonderhoud' THEN 'cart'
		WHEN 'Vrije tijd' THEN 'sun' WHEN 'Sparen' THEN 'piggy' WHEN 'Overig' THEN 'dots' WHEN 'Vakantie' THEN 'plane'
		WHEN 'Onderhoud huis' THEN 'wrench' WHEN 'Onderhoud' THEN 'wrench' WHEN 'Woonverzekering' THEN 'shield' WHEN 'Verzekering' THEN 'shield'
		WHEN 'Lokale lasten' THEN 'building' WHEN 'Wegenbelasting' THEN 'building' WHEN 'Brandstof' THEN 'fuel' WHEN 'OV' THEN 'train'
		WHEN 'Cadeautjes' THEN 'gift' WHEN 'Kleding' THEN 'shirt' WHEN 'Noodfonds' THEN 'umbrella' WHEN 'Afschrijving' THEN 'car'
		WHEN 'Salaris' THEN 'briefcase' WHEN 'Internet & telefoon' THEN 'phone' WHEN 'Gas, Water & Licht' THEN 'bolt'
		WHEN 'Uiteten, Terras & To-Go' THEN 'cup' WHEN 'Boodschappen' THEN 'cart' WHEN 'Entertainment' THEN 'play'
	END;
	`,
    // Budget (of geplande inleg) per maand. 'vanaf' geldt vanaf die maand tot de volgende 'vanaf';
    // 'alleen' wijkt af voor precies één maand. '0000-00' betekent: vanaf het begin.
    // categories.monthly_cents wordt niet meer gebruikt.
    `
	CREATE TABLE budgets (
		category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
		month TEXT NOT NULL,
		scope TEXT NOT NULL CHECK (scope IN ('vanaf', 'alleen')),
		amount_cents INTEGER NOT NULL,
		PRIMARY KEY (category_id, month, scope)
	);
	INSERT INTO budgets (category_id, month, scope, amount_cents)
		SELECT id, '0000-00', 'vanaf', monthly_cents FROM categories WHERE monthly_cents IS NOT NULL;
	UPDATE categories SET monthly_cents = NULL;
	`,
    // v4: inloggen. Wachtwoorden als scrypt-hash, TOTP-geheim per gebruiker, sessies als hash van het token.
    `
	CREATE TABLE users (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL UNIQUE COLLATE NOCASE,
		pass_hash TEXT NOT NULL,
		totp_secret TEXT NOT NULL,
		totp_last INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);
	CREATE TABLE sessions (
		token_hash TEXT PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		expires_at TEXT NOT NULL
	);
	`,
    // v5: een uitgave op een spaarpot kan van de lopende rekening betaald zijn zonder dat het geld uit de pot gaat.
    // from_pot = 0: telt mee als uitgegeven, maar het saldo van de pot blijft gelijk.
    `
	ALTER TABLE splits ADD COLUMN from_pot INTEGER NOT NULL DEFAULT 1;
	`,
    // v6: teruggaven. Bij een uitgave het bedrag dat je nog terugverwacht; een binnenkomende boeking
    // die daarvoor terugkomt wijst met refund_of naar die uitgave en volgt de indeling ervan.
    `
	ALTER TABLE transactions ADD COLUMN refund_expected INTEGER;
	ALTER TABLE transactions ADD COLUMN refund_of INTEGER REFERENCES transactions(id);
	CREATE INDEX transactions_refund_of ON transactions(refund_of);
	`,
    // v7: alles is een budget. Een map met budgetten eronder is alleen een groep die optelt; wat er direct op
    // stond gaat naar een subbudget, en elk budget krijgt zijn eigen soort en geldplek in plaats van te erven.
    groupsOnly,
    // v8: de iOS-app. Elke telefoon krijgt na inloggen een eigen sleutel (alleen als hash bewaard), die je kunt intrekken.
    `
	CREATE TABLE devices (
		id INTEGER PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name TEXT NOT NULL,
		token_hash TEXT NOT NULL UNIQUE,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		last_used_at TEXT
	);
	`,
    // v9: twee niveaus. Bij uitgaven een groep met budgetten erin, bij inkomsten alleen budgetten; geen groepen in groepen.
    twoLevels
  ];
  function open() {
    mkdirSync(DATA_DIR, { recursive: true });
    const db2 = new DatabaseSync(join(DATA_DIR, "stax.db"));
    db2.exec("PRAGMA journal_mode = WAL;");
    const { user_version } = db2.prepare("PRAGMA user_version").get();
    db2.exec("PRAGMA foreign_keys = OFF;");
    for (let v = user_version; v < MIGRATIONS.length; v++) {
      transaction(db2, () => {
        const step = MIGRATIONS[v];
        if (typeof step === "string") db2.exec(step);
        else step(db2);
        db2.exec(`PRAGMA user_version = ${v + 1}`);
      });
    }
    if (user_version === 0)
      transaction(db2, () => {
        seed(db2);
        groupsOnly(db2);
        twoLevels(db2);
      });
    const broken = db2.prepare("PRAGMA foreign_key_check").all();
    if (broken.length) throw new Error(`Database klopt niet na migratie: ${JSON.stringify(broken)}`);
    db2.exec("PRAGMA foreign_keys = ON;");
    return db2;
  }
  var depth = /* @__PURE__ */ new WeakMap();
  function transaction(database, fn) {
    const level = depth.get(database) ?? 0;
    const sp = `sp${level}`;
    database.exec(level === 0 ? "BEGIN" : `SAVEPOINT ${sp}`);
    depth.set(database, level + 1);
    try {
      const result = fn();
      database.exec(level === 0 ? "COMMIT" : `RELEASE ${sp}`);
      return result;
    } catch (e) {
      database.exec(level === 0 ? "ROLLBACK" : `ROLLBACK TO ${sp}; RELEASE ${sp}`);
      throw e;
    } finally {
      depth.set(database, level);
    }
  }
  var g = globalThis;
  var db = g.__staxDb ?? (g.__staxDb = open());
  function tx(fn) {
    return transaction(db, fn);
  }
  function getSetting(key) {
    const row2 = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row2?.value ?? null;
  }
  function setSetting(key, value2) {
    if (value2 === null) db.prepare("DELETE FROM settings WHERE key = ?").run(key);
    else db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value2);
  }

  // src/lib/server/backup.ts
  var BACKUP_FORMAT = "stax-backup";
  var BACKUP_VERSION = 1;
  var TABLES = ["accounts", "imports", "statements", "categories", "transactions", "splits", "rules", "budgets", "settings"];
  var BackupError = class extends Error {
  };
  var schemaVersion = () => db.prepare("PRAGMA user_version").get().user_version;
  var columns = (table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  function exportBackup() {
    const tables = {};
    for (const t of TABLES) tables[t] = db.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all();
    return { format: BACKUP_FORMAT, version: BACKUP_VERSION, schema: schemaVersion(), created: (/* @__PURE__ */ new Date()).toISOString(), tables };
  }
  function checkBackup(input) {
    const b = input;
    if (!b || typeof b !== "object" || b.format !== BACKUP_FORMAT || !b.tables || typeof b.tables !== "object") throw new BackupError("Dit is geen Stax-back-up.");
    if (!Number.isInteger(b.version) || b.version > BACKUP_VERSION) throw new BackupError("Deze back-up komt van een nieuwere versie van Stax. Werk Stax eerst bij.");
    if (!Number.isInteger(b.schema) || b.schema > schemaVersion()) throw new BackupError("Deze back-up komt van een nieuwere versie van Stax. Werk Stax eerst bij.");
    for (const t of TABLES) if (!Array.isArray(b.tables[t])) throw new BackupError("De back-up is onvolledig.");
    return b;
  }
  function summarize(b) {
    return { accounts: b.tables.accounts.length, transactions: b.tables.transactions.length, budgets: b.tables.categories.filter((c) => c.parent_id != null).length };
  }
  function importBackup(input) {
    const b = checkBackup(input);
    tx(() => {
      db.exec("PRAGMA defer_foreign_keys = ON");
      for (const t of [...TABLES].reverse()) db.exec(`DELETE FROM ${t}`);
      for (const t of TABLES) {
        const known = columns(t);
        for (const row2 of b.tables[t]) {
          if (!row2 || typeof row2 !== "object") throw new BackupError("De back-up is beschadigd.");
          const cols = Object.keys(row2).filter((c) => known.includes(c));
          const values = cols.map((c) => {
            const v = row2[c];
            if (v === null || typeof v === "number" || typeof v === "string") return v;
            throw new BackupError("De back-up is beschadigd.");
          });
          db.prepare(`INSERT INTO ${t} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`).run(...values);
        }
      }
      if (db.prepare("PRAGMA foreign_key_check").all().length) throw new BackupError("De back-up is beschadigd: verwijzingen kloppen niet.");
      if (!db.prepare("SELECT 1 FROM categories WHERE parent_id IS NULL LIMIT 1").get()) throw new BackupError("De back-up bevat geen budgetten.");
    });
    return summarize(b);
  }

  // src/routes/api/v1/backup/+server.ts
  function GET() {
    return json(exportBackup());
  }
  async function POST({ request }) {
    const b = await request.json().catch(() => null);
    try {
      return json({ ok: true, ...importBackup(b) });
    } catch (e) {
      if (e instanceof BackupError) error(400, e.message);
      throw e;
    }
  }

  // src/routes/api/v1/boekingen/+server.ts
  var server_exports2 = {};
  __export(server_exports2, {
    GET: () => GET2
  });

  // src/lib/types.ts
  function kindOf(n) {
    if (n.effective === "budget") return "budget";
    return n.goal_cents || n.goal ? "doelpot" : "spaarpot";
  }
  function kindTag(k) {
    return k === "spaarpot" ? "Spaart" : k === "doelpot" ? "Spaart \xB7 doel" : "";
  }

  // src/lib/server/categories.ts
  function loadTree(includeArchived = false) {
    const rows = db.prepare(`SELECT * FROM categories ${includeArchived ? "" : "WHERE archived = 0"} ORDER BY sort, name`).all();
    const byId = /* @__PURE__ */ new Map();
    for (const r of rows) byId.set(r.id, { ...r, children: [], depth: 0, path: [], effective: "budget", effFunding: "spaar", effIcon: null });
    const roots = {};
    for (const node of byId.values()) {
      const parent = node.parent_id != null ? byId.get(node.parent_id) : void 0;
      if (parent) parent.children.push(node);
      else if (node.parent_id == null) roots[node.tree] = node;
    }
    const flat = [];
    function walk(node, depth2, path, parent) {
      node.depth = depth2;
      node.path = path;
      node.effective = groupAt(node, depth2) ? "budget" : node.behavior ?? "budget";
      node.effFunding = node.funding ?? "spaar";
      node.effIcon = node.icon ?? parent?.effIcon ?? null;
      flat.push(node);
      const childPath = depth2 === 0 ? [] : [...path, node.name];
      for (const c of node.children) walk(c, depth2 + 1, childPath, node);
    }
    for (const tree of ["uitgaven", "inkomsten"]) if (roots[tree]) walk(roots[tree], 0, [], null);
    return { roots, byId, flat };
  }
  function fullName(node) {
    return node.depth === 0 ? `${node.name} (algemeen)` : [...node.path, node.name].join(" \u203A ");
  }
  function toOptions(tree) {
    return tree.flat.map((n) => ({
      id: n.id,
      tree: n.tree,
      name: n.name,
      label: fullName(n),
      depth: n.depth,
      isGroup: isGroup(n),
      effective: n.effective,
      effFunding: n.effFunding,
      kind: kindOf(n),
      savings: holdsSavings(n),
      parent: n.parent_id,
      icon: n.depth === 0 ? "folder" : n.effIcon,
      group: n.depth === 0 ? "" : n.path[0] ?? n.name
    }));
  }
  function subtreeIds(node) {
    const ids = [];
    const walk = (n) => {
      ids.push(n.id);
      n.children.forEach(walk);
    };
    walk(node);
    return ids;
  }
  function groupAt(n, depth2) {
    return depth2 === 0 || n.tree === "uitgaven" && depth2 === 1 || n.children.length > 0;
  }
  function isGroup(n) {
    return groupAt(n, n.depth);
  }
  function isBudgetId(tree, id) {
    const n = tree.byId.get(id);
    return !!n && !isGroup(n);
  }
  function isSavingsPot(n) {
    return !isGroup(n) && n.tree === "uitgaven" && n.effective === "pot" && n.effFunding === "spaar";
  }
  function holdsSavings(n) {
    return isSavingsPot(n);
  }
  var STOPWORDS = /* @__PURE__ */ new Set(["overig", "overige", "en", "de", "het", "van", "voor", "&", "-"]);
  function words(s) {
    return s.toLowerCase().split(/[^a-z0-9à-ÿ]+/).filter((w) => w && !STOPWORDS.has(w));
  }
  function matchPotByName(tree, description) {
    const desc = new Set(words(description));
    if (desc.size === 0) return null;
    let best = null;
    let bestScore = 0;
    let tie = false;
    for (const node of tree.flat) {
      if (!holdsSavings(node)) continue;
      const own = words(node.name);
      if (own.length === 0) continue;
      const partial = (w) => [...desc].some((d) => d.length > 4 && w.length > 4 && (d.includes(w) || w.includes(d)));
      if (!own.every((w) => desc.has(w) || partial(w))) continue;
      const score = own.reduce((s, w) => s + (desc.has(w) ? 3 : 1), 0) + node.path.flatMap(words).filter((w) => desc.has(w)).length;
      if (score > bestScore) {
        best = node;
        bestScore = score;
        tie = false;
      } else if (score === bestScore) tie = true;
    }
    return tie ? null : best;
  }

  // src/lib/server/budgets.ts
  var BEGIN = "0000-00";
  var Budgets = class {
    constructor() {
      __publicField(this, "byCat", /* @__PURE__ */ new Map());
      const rows = db.prepare("SELECT category_id, month, scope, amount_cents FROM budgets ORDER BY month").all();
      for (const r of rows) {
        if (!this.byCat.has(r.category_id)) this.byCat.set(r.category_id, { vanaf: [], alleen: /* @__PURE__ */ new Map() });
        const e = this.byCat.get(r.category_id);
        if (r.scope === "vanaf") e.vanaf.push([r.month, r.amount_cents]);
        else e.alleen.set(r.month, r.amount_cents);
      }
    }
    /** Het sjabloonbedrag dat in een maand geldt, en sinds wanneer. */
    template(id, month) {
      const e = this.byCat.get(id);
      if (!e) return null;
      let hit = null;
      for (const v of e.vanaf) if (v[0] <= month) hit = v;
      return hit && hit[1] ? { amount: hit[1], since: hit[0] } : null;
    }
    /** Afwijking voor precies deze maand (0 = deze maand geen budget). */
    override(id, month) {
      return this.byCat.get(id)?.alleen.get(month) ?? null;
    }
    /** Het bedrag dat in een maand geldt. */
    amount(id, month) {
      const o = this.override(id, month);
      if (o !== null) return o || null;
      return this.template(id, month)?.amount ?? null;
    }
    hasAny(id) {
      return (this.byCat.get(id)?.vanaf.length ?? 0) > 0;
    }
  };
  function setBudget(categoryId, month, amount2, scope) {
    tx(() => {
      if (scope === "alleen") {
        db.prepare("DELETE FROM budgets WHERE category_id = ? AND month = ? AND scope = 'alleen'").run(categoryId, month);
        if (amount2 !== null) db.prepare("INSERT INTO budgets VALUES (?, ?, 'alleen', ?)").run(categoryId, month, amount2);
        return;
      }
      const first = !db.prepare("SELECT 1 FROM budgets WHERE category_id = ? AND scope = 'vanaf'").get(categoryId);
      const from = first ? BEGIN : month;
      db.prepare("DELETE FROM budgets WHERE category_id = ? AND scope = 'vanaf' AND month >= ?").run(categoryId, from);
      db.prepare("DELETE FROM budgets WHERE category_id = ? AND scope = 'alleen' AND month = ?").run(categoryId, month);
      db.prepare("INSERT INTO budgets VALUES (?, ?, 'vanaf', ?)").run(categoryId, from, amount2 ?? 0);
    });
  }

  // src/lib/months.ts
  function shiftMonth(month, delta) {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
  }
  function goalMonthOf(goalDate) {
    return goalDate.length === 4 ? `${goalDate}-12` : goalDate.slice(0, 7);
  }

  // src/lib/format.ts
  var number = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function amount(cents2, signed = false) {
    if (cents2 == null) return "";
    const sign = cents2 < 0 ? "\u2212" : signed && cents2 > 0 ? "+" : "";
    return sign + number.format(Math.abs(cents2) / 100);
  }
  function money(cents2, signed = false) {
    if (cents2 == null) return "";
    return "\u20AC\xA0" + amount(cents2, signed);
  }
  function parseMoney(input) {
    if (input == null) return null;
    let s = String(input).replace(/[€\s]/g, "");
    if (!s) return null;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n * 100) : null;
  }

  // src/lib/server/reports.ts
  var NEEDS_SPLIT = `(t.transfer_account_id IS NULL OR a.kind = 'spaar')`;
  function incomePotId(tree) {
    const set = getSetting("inkomstenpot");
    const n = set === null ? tree.flat.find((c) => holdsSavings(c) && c.name.toLowerCase() === "vrij sparen") : tree.byId.get(Number(set));
    return n && holdsSavings(n) ? n.id : null;
  }
  function savingsTargets(tree) {
    const income = incomePotId(tree) != null;
    return tree.flat.filter((n) => holdsSavings(n) || income && n.tree === "inkomsten" && !isGroup(n)).map((n) => n.id);
  }
  function isOpenSql(tree = loadTree()) {
    const holders = savingsTargets(tree);
    return `(t.excluded = 0 AND ${NEEDS_SPLIT} AND (COALESCE((SELECT SUM(amount_cents) FROM splits WHERE transaction_id = t.id), 0) != t.amount_cents
		OR (a.kind = 'spaar' AND EXISTS (SELECT 1 FROM splits s WHERE s.transaction_id = t.id AND s.category_id NOT IN (${holders.join(",") || "0"})))))`;
  }
  function monthEnd(month) {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  }
  function currentMonth() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  }
  function accountBalance(accountId, date) {
    const st = db.prepare("SELECT closing_cents, closing_date FROM statements WHERE account_id = ? AND closing_cents IS NOT NULL ORDER BY closing_date DESC, id DESC LIMIT 1").get(accountId);
    if (!st) return null;
    const after = db.prepare("SELECT COALESCE(SUM(amount_cents), 0) AS s FROM transactions WHERE account_id = ? AND booking_date > ? AND booking_date <= ?").get(accountId, date, st.closing_date);
    return st.closing_cents - after.s;
  }
  function accounts() {
    return db.prepare("SELECT id, iban, name, kind FROM accounts ORDER BY kind, name").all();
  }
  function lastBookingDate() {
    return db.prepare("SELECT MAX(booking_date) AS d FROM transactions").get().d;
  }
  function potFromDate() {
    const start = getSetting("startdatum");
    if (start) return start;
    return db.prepare("SELECT MIN(booking_date) AS d FROM transactions").get().d ?? `${currentMonth()}-01`;
  }
  function monthsBetween(from, to) {
    const [y1, m1] = from.split("-").map(Number);
    const [y2, m2] = to.split("-").map(Number);
    return (y2 - y1) * 12 + (m2 - m1);
  }
  var ZERO = { flow: 0, inleg: 0, outside: 0, opname: 0, direct: 0, uitPot: 0 };
  var KEYS = Object.keys(ZERO);
  function loadLedger(potFrom) {
    const rows = db.prepare(
      `SELECT s.category_id AS id, substr(t.booking_date, 1, 7) AS m, t.booking_date >= ? AS in_pot,
			 SUM(CASE WHEN t.transfer_account_id IS NULL THEN s.amount_cents ELSE 0 END) AS flow,
			 SUM(CASE WHEN t.transfer_account_id IS NOT NULL AND t.amount_cents > 0 THEN s.amount_cents ELSE 0 END) AS inleg,
			 SUM(CASE WHEN t.transfer_account_id IS NOT NULL AND t.amount_cents < 0 THEN s.amount_cents ELSE 0 END) AS opname,
			 SUM(CASE WHEN t.transfer_account_id IS NULL AND s.from_pot = 0 THEN s.amount_cents ELSE 0 END) AS outside,
			 SUM(CASE WHEN t.transfer_account_id IS NULL AND a.kind = 'spaar' THEN s.amount_cents ELSE 0 END) AS direct,
			 SUM(CASE WHEN t.transfer_account_id IS NULL AND a.kind = 'betaal' AND s.from_pot = 1 THEN s.amount_cents ELSE 0 END) AS uitPot
			 FROM splits s JOIN transactions t ON t.id = s.transaction_id JOIN accounts a ON a.id = t.account_id
			 WHERE t.excluded = 0
			 GROUP BY s.category_id, m, in_pot`
    ).all(potFrom);
    const all = /* @__PURE__ */ new Map();
    const pot = /* @__PURE__ */ new Map();
    for (const r of rows) {
      for (const target of r.in_pot ? [all, pot] : [all]) {
        if (!target.has(r.id)) target.set(r.id, /* @__PURE__ */ new Map());
        const cur = target.get(r.id).get(r.m) ?? ZERO;
        target.get(r.id).set(r.m, Object.fromEntries(KEYS.map((k) => [k, cur[k] + r[k]])));
      }
    }
    return { all, pot };
  }
  var Ledger = class {
    constructor(tree = loadTree()) {
      __publicField(this, "tree", tree);
      __publicField(this, "potFrom");
      __publicField(this, "potFromMonth");
      __publicField(this, "sums");
      __publicField(this, "budgets", new Budgets());
      __publicField(this, "incomePot");
      __publicField(this, "incomeIds");
      this.potFrom = potFromDate();
      this.potFromMonth = this.potFrom.slice(0, 7);
      this.sums = loadLedger(this.potFrom);
      this.incomePot = incomePotId(tree);
      this.incomeIds = tree.flat.filter((n) => n.tree === "inkomsten").map((n) => n.id);
    }
    /** Alle potbedragen van een map vanaf de startdatum tot en met een maand, opgeteld. */
    potSums(n, month) {
      const total = { ...ZERO };
      if (month < this.potFromMonth) return total;
      for (const [m, v] of this.sums.pot.get(n.id) ?? []) if (m <= month) for (const k of KEYS) total[k] += v[k];
      if (n.id === this.incomePot) {
        for (const id of this.incomeIds) for (const [m, v] of this.sums.pot.get(id) ?? []) if (m <= month) total.direct += v.direct;
      }
      return total;
    }
    isPot(n) {
      return n.tree === "uitgaven" && !isGroup(n) && n.effective === "pot";
    }
    /** Eerste maand waarin een maandbedrag van deze pot meetelt. */
    potStartMonth(n) {
      return n.start_month && n.start_month > this.potFromMonth ? n.start_month : this.potFromMonth;
    }
    /**
     * Eigen saldo van een pot (zonder submappen) aan het eind van een maand.
     * Spaargeld telt alleen wat er echt op de spaarrekening gebeurde: stortingen, opnames en rente.
     * Zo tellen de potten altijd op tot het saldo van de spaarrekening.
     */
    ownPotBalance(n, month) {
      if (holdsSavings(n)) {
        const v2 = this.potSums(n, month);
        return n.opening_cents + v2.inleg + v2.opname + v2.direct;
      }
      if (!this.isPot(n) || month < this.potFromMonth) return this.isPot(n) ? n.opening_cents : 0;
      const v = this.potSums(n, month);
      let total = n.opening_cents + v.flow - v.outside + v.inleg + v.opname;
      for (let m = this.potFromMonth; m <= month; m = shiftMonth(m, 1)) total += this.budgets.amount(n.id, m) ?? 0;
      return total;
    }
    /**
     * Wat er nog van de spaarrekening opgenomen moet worden voor deze pot: uitgaven van de betaalrekening
     * die uit de pot komen, min wat er al aan opnames aan de pot gekoppeld is.
     */
    ownToWithdraw(n, month) {
      if (!isSavingsPot(n)) return 0;
      const v = this.potSums(n, month);
      return Math.max(0, v.opname - v.uitPot);
    }
    /** Saldo van een pot inclusief alle potten eronder. */
    potBalance(n, month) {
      return this.ownPotBalance(n, month) + n.children.reduce((s, c) => s + this.potBalance(c, month), 0);
    }
    ownMonth(n, month) {
      return this.sums.all.get(n.id)?.get(month) ?? ZERO;
    }
    ownInlegActual(n, month) {
      if (!this.isPot(n)) return 0;
      if (n.effFunding === "betaal") return month >= this.potFromMonth ? this.budgets.amount(n.id, month) ?? 0 : 0;
      return this.ownMonth(n, month).inleg;
    }
    goal(n, balance, month) {
      if (!n.goal_cents) return null;
      const target = n.goal_cents;
      const g2 = { target, date: n.goal_date, progress: target > 0 ? balance / target : 0, expected: null, perMonth: null, monthsLeft: null };
      if (n.goal_date) {
        const goalMonth = goalMonthOf(n.goal_date);
        const start = this.potStartMonth(n);
        const total = Math.max(1, monthsBetween(start, goalMonth) + 1);
        const elapsed = Math.min(total, Math.max(0, monthsBetween(start, month) + 1));
        g2.expected = Math.round(n.opening_cents + (target - n.opening_cents) * elapsed / total);
        g2.monthsLeft = Math.max(0, monthsBetween(month, goalMonth));
        g2.perMonth = g2.monthsLeft > 0 ? Math.max(0, Math.ceil((target - balance) / g2.monthsLeft)) : Math.max(0, target - balance);
      }
      return g2;
    }
    /** Cijfers voor één maand, als boom. */
    month(month) {
      const build = (n) => {
        const children = n.children.map(build);
        const own = this.ownMonth(n, month);
        const isPot = this.isPot(n);
        const ownPot = this.ownPotBalance(n, month);
        const monthly = this.budgets.amount(n.id, month);
        const stats = {
          id: n.id,
          name: n.name,
          tree: n.tree,
          depth: n.depth,
          path: n.path,
          effective: n.effective,
          funding: n.effFunding,
          icon: n.effIcon,
          monthly,
          budgetTemplate: this.budgets.template(n.id, month)?.amount ?? null,
          budgetOverride: this.budgets.override(n.id, month) !== null,
          flow: own.flow + children.reduce((s, c) => s + c.flow, 0),
          ownFlow: own.flow,
          outside: own.outside + children.reduce((s, c) => s + c.outside, 0),
          ownPot,
          ownInleg: this.ownInlegActual(n, month),
          isPot,
          pot: ownPot + children.reduce((s, c) => s + c.pot, 0),
          potSpaar: (isPot && n.effFunding === "spaar" ? ownPot : 0) + children.reduce((s, c) => s + c.potSpaar, 0),
          inlegPlanned: (isPot ? monthly ?? 0 : 0) + children.reduce((s, c) => s + c.inlegPlanned, 0),
          inlegActual: this.ownInlegActual(n, month) + children.reduce((s, c) => s + c.inlegActual, 0),
          toWithdraw: this.ownToWithdraw(n, month) + children.reduce((s, c) => s + c.toWithdraw, 0),
          hasPot: isPot || children.some((c) => c.hasPot),
          available: null,
          goal: null,
          children
        };
        if (n.effective === "budget" && monthly) stats.available = monthly + stats.flow;
        if (isPot) stats.goal = this.goal(n, stats.pot, month);
        return stats;
      };
      return { uitgaven: build(this.tree.roots.uitgaven), inkomsten: build(this.tree.roots.inkomsten) };
    }
    /** Potsaldo aan het eind van elke maand, voor een grafiek. */
    potSeries(n, months2) {
      return months2.map((m) => ({ month: m, balance: this.potBalance(n, m) }));
    }
  };
  function openCounts(month) {
    return db.prepare(
      `SELECT COUNT(*) AS n,
			 COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN t.amount_cents END), 0) AS uit,
			 COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents END), 0) AS bij
			 FROM transactions t JOIN accounts a ON a.id = t.account_id
			 WHERE ${isOpenSql()} AND substr(t.booking_date, 1, 7) = ?`
    ).get(month);
  }
  function plannedTotal(root) {
    let sum = 0;
    const walk = (n) => {
      if (n.effective === "budget" && n.monthly) sum += n.monthly;
      n.children.forEach(walk);
    };
    walk(root);
    return sum + root.inlegPlanned;
  }
  function rowsUnder(node) {
    const rows = [];
    const walk = (n, level) => {
      rows.push({ node: n, level, parent: n.children.length > 0 });
      n.children.forEach((c) => walk(c, level + 1));
    };
    node.children.forEach((c) => walk(c, 0));
    return rows;
  }
  function monthRows(root) {
    return root.children.map((group) => ({ group, rows: rowsUnder(group) })).filter((g2) => g2.rows.length > 0);
  }
  function incomeSummary(inkomsten, month) {
    let expected = 0;
    const walk = (n) => {
      expected += n.monthly ?? 0;
      n.children.forEach(walk);
    };
    walk(inkomsten);
    const received = inkomsten.flow;
    const base = expected > 0 ? expected : received;
    if (expected <= 0) return { expected, received, base, note: null };
    const diff = received - expected;
    const done = month < currentMonth() || (lastBookingDate() ?? "") >= monthEnd(month);
    const note = diff === 0 ? "precies zoals verwacht ontvangen" : diff > 0 ? `${money(diff)} meer ontvangen dan verwacht` : done ? `${money(-diff)} minder ontvangen dan verwacht` : `nog ${money(-diff)} te ontvangen`;
    return { expected, received, base, note };
  }

  // src/lib/server/categorize.ts
  var FIELD_ORDER = ["iban", "tegenpartij", "omschrijving", "mcc"];
  function needsPot(t) {
    return t.account_kind === "spaar";
  }
  function isWithdrawal(t) {
    return t.transfer_account_id != null && t.account_kind === "spaar" && t.amount_cents < 0;
  }
  function loadRules() {
    const rules = db.prepare("SELECT id, field, op, pattern, category_id FROM rules").all();
    return rules.sort(
      (a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field) || (a.op === "is" ? 0 : 1) - (b.op === "is" ? 0 : 1) || b.pattern.length - a.pattern.length
    );
  }
  function value(t, field) {
    switch (field) {
      case "iban":
        return t.counterparty_iban ?? "";
      case "tegenpartij":
        return (t.counterparty ?? "").toLowerCase();
      case "omschrijving":
        return t.description.toLowerCase();
      case "mcc":
        return t.mcc ?? "";
    }
  }
  function matches(rule, t) {
    const v = value(t, rule.field);
    if (!v) return false;
    const p = rule.field === "iban" || rule.field === "mcc" ? rule.pattern : rule.pattern.toLowerCase();
    return rule.op === "is" ? v === p : v.includes(p);
  }
  function suggest(t, rules, tree) {
    if (needsPot(t)) {
      const allowed = new Set(savingsTargets(tree));
      const rule2 = rules.find((r) => r.field === "omschrijving" && matches(r, t) && allowed.has(r.category_id));
      if (rule2) return { categoryId: rule2.category_id, source: "regel" };
      const pot = matchPotByName(tree, t.description);
      return pot ? { categoryId: pot.id, source: "naam" } : null;
    }
    if (t.transfer_account_id != null) return null;
    const rule = rules.find((r) => matches(r, t) && isBudgetId(tree, r.category_id));
    return rule ? { categoryId: rule.category_id, source: "regel" } : null;
  }
  function autoCategorize() {
    const rules = loadRules();
    const tree = loadTree();
    const open2 = db.prepare(
      `SELECT t.*, a.kind AS account_kind FROM transactions t JOIN accounts a ON a.id = t.account_id
			 WHERE t.excluded = 0 AND NOT EXISTS (SELECT 1 FROM splits s WHERE s.transaction_id = t.id)`
    ).all();
    const insert = db.prepare("INSERT INTO splits (transaction_id, category_id, amount_cents, source) VALUES (?, ?, ?, ?)");
    let n = 0;
    tx(() => {
      for (const t of open2) {
        const s = suggest(t, rules, tree);
        if (!s) continue;
        insert.run(t.id, s.categoryId, t.amount_cents, s.source);
        n++;
      }
    });
    return n;
  }
  function learnRule(transactionId, categoryId) {
    const t = db.prepare("SELECT t.*, a.kind AS account_kind FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE t.id = ?").get(transactionId);
    if (!t) return false;
    let field;
    let pattern;
    if (needsPot(t) || !t.counterparty) {
      if (!t.description) return false;
      field = "omschrijving";
      pattern = t.description;
    } else {
      field = "tegenpartij";
      pattern = t.counterparty;
    }
    db.prepare(
      `INSERT INTO rules (field, op, pattern, category_id) VALUES (?, 'is', ?, ?)
		 ON CONFLICT(field, op, pattern) DO UPDATE SET category_id = excluded.category_id`
    ).run(field, pattern.toLowerCase(), categoryId);
    return true;
  }
  function setSplits(transactionId, splits) {
    tx(() => {
      db.prepare("DELETE FROM splits WHERE transaction_id = ?").run(transactionId);
      const insert = db.prepare("INSERT INTO splits (transaction_id, category_id, amount_cents, source, from_pot) VALUES (?, ?, ?, ?, ?)");
      for (const s of splits) insert.run(transactionId, s.category_id, s.amount_cents, s.source ?? "hand", s.from_pot === 0 ? 0 : 1);
    });
  }

  // src/lib/server/refunds.ts
  var RECEIVED = "(SELECT COALESCE(SUM(r.amount_cents), 0) FROM transactions r WHERE r.refund_of = t.id)";
  var REFUND_OPEN = `(t.refund_expected IS NOT NULL AND t.refund_expected > ${RECEIVED})`;
  function openRefunds() {
    return db.prepare(
      `SELECT t.id, t.booking_date, t.amount_cents, COALESCE(t.counterparty, t.description) AS name, t.note,
			 t.refund_expected AS expected, ${RECEIVED} AS received
			 FROM transactions t WHERE ${REFUND_OPEN} ORDER BY t.booking_date DESC, t.id DESC`
    ).all();
  }
  function setExpected(id, cents2) {
    db.prepare("UPDATE transactions SET refund_expected = ? WHERE id = ? AND amount_cents < 0").run(cents2 && cents2 > 0 ? cents2 : null, id);
  }
  function closeExpected(id) {
    db.prepare(`UPDATE transactions AS t SET refund_expected = NULLIF(${RECEIVED}, 0) WHERE t.id = ?`).run(id);
  }
  function mirror(expense, amount2) {
    const total = expense.reduce((s, x) => s + x.amount_cents, 0);
    if (!total) return [];
    const out = expense.map((s) => ({
      category_id: s.category_id,
      amount_cents: Math.round(amount2 * s.amount_cents / total),
      source: "hand",
      from_pot: s.from_pot
    }));
    const diff = amount2 - out.reduce((s, x) => s + x.amount_cents, 0);
    if (diff) out.reduce((a, b) => Math.abs(b.amount_cents) > Math.abs(a.amount_cents) ? b : a).amount_cents += diff;
    return out.filter((s) => s.amount_cents);
  }
  function splitsOf(id) {
    return db.prepare("SELECT category_id, amount_cents, from_pot FROM splits WHERE transaction_id = ?").all(id);
  }
  function link(refundId, expenseId) {
    const r = db.prepare("SELECT amount_cents, transfer_account_id FROM transactions WHERE id = ?").get(refundId);
    const e = db.prepare("SELECT amount_cents FROM transactions WHERE id = ?").get(expenseId);
    if (!r || !e) return "Boeking niet gevonden.";
    if (r.amount_cents <= 0 || r.transfer_account_id != null) return "Alleen geld dat binnenkomt kan een teruggave zijn.";
    if (e.amount_cents >= 0) return "Een teruggave hoort bij een uitgave.";
    tx(() => {
      db.prepare("UPDATE transactions SET refund_of = ? WHERE id = ?").run(expenseId, refundId);
      db.prepare("UPDATE transactions SET refund_expected = COALESCE(refund_expected, ?) WHERE id = ?").run(r.amount_cents, expenseId);
      const splits = mirror(splitsOf(expenseId), r.amount_cents);
      if (splits.length) setSplits(refundId, splits);
    });
    return null;
  }
  function unlink(refundId) {
    tx(() => {
      const was = db.prepare("UPDATE transactions SET refund_of = NULL WHERE id = ? AND refund_of IS NOT NULL").run(refundId);
      if (was.changes) setSplits(refundId, []);
    });
  }
  function syncRefunds(expenseIds) {
    if (!expenseIds.length) return;
    const refunds = db.prepare(`SELECT id, amount_cents, refund_of FROM transactions WHERE refund_of IN (${expenseIds.join(",")})`).all();
    tx(() => {
      for (const r of refunds) {
        const splits = mirror(splitsOf(r.refund_of), r.amount_cents);
        if (splits.length) setSplits(r.id, splits);
      }
    });
  }

  // src/lib/server/bookings.ts
  function queryRows(where, params) {
    const rows = db.prepare(
      `SELECT t.id, t.account_id, a.kind AS account_kind, t.booking_date, t.amount_cents, t.counterparty, t.counterparty_iban,
			 t.description, t.raw_info, t.transfer_account_id, t.excluded, t.note, t.refund_expected,
			 (SELECT COALESCE(SUM(r.amount_cents), 0) FROM transactions r WHERE r.refund_of = t.id) AS refund_received,
			 (SELECT json_object('id', e.id, 'date', e.booking_date, 'amount', e.amount_cents, 'name', COALESCE(e.counterparty, e.description))
			  FROM transactions e WHERE e.id = t.refund_of) AS refund_source,
			 (SELECT json_group_array(json_object('category_id', category_id, 'amount_cents', amount_cents, 'source', source, 'from_pot', from_pot)) FROM splits WHERE transaction_id = t.id) AS splits,
			 ${isOpenSql()} AS is_open
			 FROM transactions t JOIN accounts a ON a.id = t.account_id
			 ${where.length ? "WHERE " + where.join(" AND ") : ""}
			 ORDER BY t.booking_date DESC, t.id DESC LIMIT 600`
    ).all(...params);
    return rows.map((r) => {
      const splits = JSON.parse(r.splits);
      const pot = needsPot(r);
      const withdrawal = isWithdrawal(r);
      const status = r.excluded ? "uitgesloten" : r.is_open ? "open" : r.transfer_account_id != null && !pot ? "overboeking" : "ingedeeld";
      return { ...r, splits, status, needsPot: pot, withdrawal, refund_source: r.refund_source ? JSON.parse(r.refund_source) : null };
    });
  }
  function filtersFrom(params) {
    return {
      status: params.get("status") ?? "alle",
      q: params.get("q")?.trim() ?? "",
      account: Number(params.get("rekening")) || null,
      cat: Number(params.get("map")) || null,
      van: params.get("van")?.trim() || null,
      month: params.get("maand")
    };
  }
  function listBookings(f) {
    const tree = loadTree();
    const { status, q, account, cat, van } = f;
    const chosen = f.month;
    const month = chosen === "alle" ? null : chosen ?? (q || van || status === "open" || status === "terug" ? null : lastBookingDate()?.slice(0, 7) ?? currentMonth());
    const where = [];
    const params = [];
    if (month) {
      where.push("substr(t.booking_date, 1, 7) = ?");
      params.push(month);
    }
    if (account) {
      where.push("t.account_id = ?");
      params.push(account);
    }
    if (q) {
      where.push("(t.counterparty LIKE ? OR t.description LIKE ? OR t.raw_info LIKE ? OR replace(printf('%.2f', abs(t.amount_cents) / 100.0), '.', ',') LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q.replace(".", ",")}%`);
    }
    if (van) {
      where.push("t.counterparty = ?");
      params.push(van);
    }
    if (status === "open") where.push(isOpenSql(tree));
    if (status === "terug") where.push(REFUND_OPEN);
    if (cat && tree.byId.has(cat)) {
      const ids = subtreeIds(tree.byId.get(cat));
      where.push(`EXISTS (SELECT 1 FROM splits s WHERE s.transaction_id = t.id AND s.category_id IN (${ids.join(",")}))`);
    }
    const list = queryRows(where, params);
    const months2 = db.prepare("SELECT DISTINCT substr(booking_date, 1, 7) AS m FROM transactions ORDER BY m DESC").all().map((r) => r.m);
    const ledger = new Ledger(tree);
    const now = lastBookingDate()?.slice(0, 7) ?? currentMonth();
    const toWithdraw = tree.flat.filter(isSavingsPot).map((n) => ({ id: n.id, name: fullName(n), cents: ledger.ownToWithdraw(n, now) })).filter((p) => p.cents > 0);
    return {
      tree,
      rows: list,
      toWithdraw,
      // Inkomsten op de spaarrekening mogen bij inkomsten; het geld gaat dan naar deze pot.
      incomePot: ledger.incomePot ? fullName(tree.byId.get(ledger.incomePot)) : null,
      months: months2,
      refunds: openRefunds(),
      filters: { status, q, account, cat, month, van }
    };
  }
  function classify(id, c) {
    const t = db.prepare("SELECT t.amount_cents, a.kind FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE t.id = ?").get(id);
    if (!t) return { error: "Boeking niet gevonden.", status: 404 };
    const splits = c.splits.filter((s) => s.category_id && s.amount_cents);
    const total = splits.reduce((s, x) => s + x.amount_cents, 0);
    if (splits.length && total !== t.amount_cents) return { error: "De delen tellen niet op tot het bedrag van de boeking.", status: 400 };
    const tree = loadTree();
    if (splits.some((x) => !tree.byId.has(x.category_id) || isGroup(tree.byId.get(x.category_id))))
      return { error: "Kies een budget, geen groep.", status: 400 };
    if (t.kind === "spaar") {
      const allowed = new Set(savingsTargets(tree));
      if (splits.some((x) => !allowed.has(x.category_id))) return { error: "Op de spaarrekening hoort elke boeking bij een budget dat spaart, of bij inkomsten.", status: 400 };
    }
    if (t.amount_cents < 0 && c.refund !== null && !(c.refund > 0)) return { error: "Vul in hoeveel je terugverwacht.", status: 400 };
    setSplits(id, splits.map((s) => ({ ...s, source: "hand", from_pot: c.fromPot })));
    db.prepare("UPDATE transactions SET note = ?, excluded = ? WHERE id = ?").run(c.note.trim() || null, c.excluded ? 1 : 0, id);
    if (t.amount_cents < 0) {
      setExpected(id, c.refund ? Math.abs(c.refund) : null);
      syncRefunds([id]);
    }
    const applied = c.remember && splits.length === 1 && learnRule(id, splits[0].category_id) ? autoCategorize() : 0;
    return { applied };
  }

  // src/routes/api/v1/boekingen/+server.ts
  function GET2({ url }) {
    const { tree, ...data } = listBookings(filtersFrom(url.searchParams));
    const options = toOptions(tree).map((o) => ({
      id: o.id,
      tree: o.tree,
      name: o.name,
      label: o.label,
      depth: o.depth,
      parent: o.parent,
      group: o.isGroup,
      kind: o.kind,
      savings: o.savings,
      icon: o.icon
    }));
    return json({ ...data, options, accounts: accounts().map((a) => ({ id: a.id, name: a.name, kind: a.kind })) });
  }

  // src/routes/api/v1/boekingen/[id]/+server.ts
  var server_exports3 = {};
  __export(server_exports3, {
    POST: () => POST2
  });
  async function POST2({ params, request }) {
    const id = Number(params.id);
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.splits)) return json({ error: "Ongeldige indeling." }, { status: 400 });
    const result = classify(id, {
      splits: body.splits.map((s) => ({ category_id: Number(s.category_id), amount_cents: Math.round(Number(s.amount_cents)) })),
      fromPot: body.fromPot === false ? 0 : 1,
      note: String(body.note ?? ""),
      excluded: !!body.excluded,
      refund: body.refund == null ? null : Number(body.refund),
      remember: !!body.remember
    });
    if ("error" in result) return json({ error: result.error }, { status: result.status });
    return json({ applied: result.applied, row: queryRows(["t.id = ?"], [id])[0] ?? null });
  }

  // src/routes/api/v1/boekingen/[id]/afsluiten/+server.ts
  var server_exports4 = {};
  __export(server_exports4, {
    POST: () => POST3
  });
  function POST3({ params }) {
    const id = Number(params.id);
    closeExpected(id);
    return json({ row: queryRows(["t.id = ?"], [id])[0] ?? null });
  }

  // src/routes/api/v1/boekingen/[id]/koppel/+server.ts
  var server_exports5 = {};
  __export(server_exports5, {
    POST: () => POST4
  });
  async function POST4({ params, request }) {
    const id = Number(params.id);
    const { of } = await request.json().catch(() => ({}));
    if (!of) unlink(id);
    else {
      const problem = link(id, Number(of));
      if (problem) return json({ error: problem }, { status: 400 });
    }
    return json({ row: queryRows(["t.id = ?"], [id])[0] ?? null });
  }

  // src/routes/api/v1/budgetten/+server.ts
  var server_exports6 = {};
  __export(server_exports6, {
    GET: () => GET3,
    POST: () => POST5
  });

  // src/lib/figures.ts
  function figures(n) {
    if (n.children.length) {
      const parts = n.children.map((c) => figures(c));
      const sum = (k) => parts.reduce((s, f) => s + (f[k] ?? 0), 0);
      const plan = sum("plan");
      const income = n.tree === "inkomsten";
      return { kind: income ? "inkomsten" : "budget", budgeted: plan, planned: null, plan, net: sum("net"), spent: sum("spent"), balance: income ? null : sum("balance"), bar: null };
    }
    const flow = n.flow;
    if (n.tree === "inkomsten") {
      return { kind: "inkomsten", budgeted: n.monthly, planned: null, plan: n.monthly, net: flow, spent: flow, balance: null, bar: null };
    }
    const kind = kindOf(n);
    const spent = flow === 0 ? 0 : -flow;
    if (kind === "budget") {
      const budgeted = n.monthly;
      const balance2 = (budgeted ?? 0) - spent;
      const bar2 = budgeted ? { pct: Math.max(0, spent) / budgeted * 100, over: spent > budgeted, text: `${Math.round(Math.max(0, spent) / budgeted * 100)}% op`, warn: false } : null;
      return { kind, budgeted, planned: null, plan: budgeted, net: flow, spent, balance: balance2, bar: bar2 };
    }
    const inleg = n.inlegActual;
    const planned = n.inlegPlanned || null;
    const balance = n.pot;
    let bar = null;
    if (kind === "doelpot" && n.goal) {
      const behind = n.goal.expected != null ? n.goal.expected - balance : null;
      bar = {
        pct: n.goal.progress * 100,
        over: false,
        warn: behind != null && behind > 0,
        text: `${Math.round(n.goal.progress * 100)}% van ${amount(n.goal.target)}${behind != null ? behind > 0 ? ` \xB7 ${amount(behind)} achter` : " \xB7 op schema" : ""}`
      };
    } else if (planned) {
      bar = { pct: inleg / planned * 100, over: false, warn: false, text: `${amount(inleg)} van ${amount(planned)} ingelegd` };
    }
    return { kind, budgeted: inleg || null, planned, plan: planned, net: inleg + flow, spent, balance, bar };
  }

  // src/lib/server/api.ts
  function subtitle(n, f) {
    if (n.children.length) return `Groep \xB7 ${n.children.length} ${n.children.length === 1 ? "budget" : "budgetten"}`;
    if (f.kind === "inkomsten") return "";
    return kindTag(f.kind);
  }
  function row(n, level = 0) {
    const f = figures(n);
    return {
      id: n.id,
      name: n.name,
      icon: n.icon,
      level,
      group: n.children.length > 0,
      kind: f.kind,
      subtitle: subtitle(n, f),
      plan: f.plan ?? 0,
      net: f.net,
      balance: f.balance,
      bar: f.bar,
      toWithdraw: n.toWithdraw
    };
  }
  function months() {
    return db.prepare("SELECT DISTINCT substr(booking_date, 1, 7) AS m FROM transactions ORDER BY m DESC").all().map((r) => r.m);
  }
  function defaultMonth(month) {
    return month && /^\d{4}-\d{2}$/.test(month) ? month : lastBookingDate()?.slice(0, 7) ?? currentMonth();
  }
  function overview(monthParam) {
    const month = defaultMonth(monthParam);
    const { uitgaven, inkomsten } = new Ledger(loadTree()).month(month);
    const planned = plannedTotal(uitgaven);
    const refunds = openRefunds();
    const income = incomeSummary(inkomsten, month);
    return {
      month,
      months: months(),
      totals: {
        inkomsten: income.received,
        /** Verwacht inkomen deze maand (0 als er niets is ingevuld). */
        expected: income.expected,
        uitgaven: -uitgaven.flow || 0,
        planned,
        /** Verwacht inkomen min gebudgetteerd (ontvangen als er niets verwacht is). */
        toDistribute: income.base - planned,
        toDistributeBasis: income.expected ? "verwacht inkomen" : "inkomsten",
        incomeNote: income.note
      },
      open: openCounts(month).n,
      /** Alle boekingen die nog ingedeeld moeten worden, over alle maanden (voor het bolletje bij Boekingen). */
      openTotal: db.prepare(`SELECT COUNT(*) AS n FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE ${isOpenSql()}`).get().n,
      refunds: { n: refunds.length, cents: refunds.reduce((s, e) => s + e.expected - e.received, 0) },
      groups: monthRows(uitgaven).map(({ group, rows }) => ({ ...row(group), rows: rows.map((r) => row(r.node, r.level)) })),
      /** Inkomstenrijen: plan is het verwachte bedrag, net wat er binnenkwam. */
      income: rowsUnder(inkomsten).map((r) => row(r.node, r.level))
    };
  }
  function savings() {
    const last = lastBookingDate();
    const month = last?.slice(0, 7) ?? currentMonth();
    const { uitgaven } = new Ledger(loadTree()).month(month);
    const end = monthEnd(month);
    const balanceDate = last && last < end ? last : end;
    const spaar = accounts().filter((a) => a.kind === "spaar");
    const bank = spaar.reduce((s, a) => s + (accountBalance(a.id, balanceDate) ?? 0), 0);
    const groups = uitgaven.children.filter((g2) => g2.hasPot).map((g2) => {
      const pots = [];
      const walk = (n, path) => {
        if (n.isPot) pots.push({ ...row(n), path: path.join(" \u203A "), funding: n.funding });
        n.children.forEach((c) => walk(c, n === g2 ? [] : [...path, n.name]));
      };
      walk(g2, []);
      return { id: g2.id, name: g2.name, icon: g2.icon, group: g2.children.length > 0, total: g2.pot, pots };
    });
    return {
      balanceDate,
      total: uitgaven.pot,
      hasSavings: spaar.length > 0,
      /** Spaarrekening min spaarpotten; 0 als alles klopt. */
      difference: spaar.length ? bank - uitgaven.potSpaar : 0,
      savingsAccount: spaar[0]?.id ?? null,
      groups
    };
  }
  function find(n, id) {
    if (n.id === id) return n;
    for (const c of n.children) {
      const hit = find(c, id);
      if (hit) return hit;
    }
    return null;
  }
  function budget(id, monthParam) {
    const tree = loadTree();
    const node = tree.byId.get(id);
    if (!node) return null;
    const ledger = new Ledger(tree);
    const month = defaultMonth(monthParam);
    const root = (m) => node.tree === "inkomsten" ? ledger.month(m).inkomsten : ledger.month(m).uitgaven;
    const first = db.prepare("SELECT MIN(booking_date) AS d FROM transactions").get().d?.slice(0, 7) ?? month;
    const history = [];
    for (let m = shiftMonth(month, -11) > first ? shiftMonth(month, -11) : first; m <= month; m = shiftMonth(m, 1)) {
      const f2 = figures(find(root(m), id));
      history.push({ month: m, spent: f2.spent, plan: f2.plan ?? 0, balance: f2.balance });
    }
    const stats = find(root(month), id);
    const f = figures(stats);
    const ids = subtreeIds(node);
    const bookings = db.prepare(
      `SELECT t.id, t.booking_date AS date, COALESCE(t.counterparty, t.description) AS name, t.transfer_account_id IS NOT NULL AS transfer,
			 s.amount_cents AS amount, c.name AS budget
			 FROM splits s JOIN transactions t ON t.id = s.transaction_id JOIN categories c ON c.id = s.category_id
			 WHERE t.excluded = 0 AND s.category_id IN (${ids.join(",")}) AND substr(t.booking_date, 1, 7) = ?
			 ORDER BY t.booking_date DESC, t.id DESC`
    ).all(month);
    return {
      month,
      months: months(),
      node: {
        id,
        name: node.name,
        path: node.path,
        icon: node.effIcon,
        tree: node.tree,
        group: isGroup(node),
        kind: node.children.length ? "groep" : kindOf(node),
        funding: node.effFunding
      },
      // Alles wat de editor in de app nodig heeft; los van wat getoond wordt (het icoon is hier het eigen icoon).
      edit: {
        parentId: node.parent_id,
        ownIcon: node.icon,
        funding: node.funding,
        goalCents: node.goal_cents,
        goalDate: node.goal_date,
        bookings: db.prepare("SELECT COUNT(*) AS n FROM splits WHERE category_id = ?").get(id).n,
        childCount: node.children.length,
        /** Het maandbedrag dat nu geldt, met of het een afwijking is van het standaardbedrag. */
        amount: isGroup(node) ? null : ledger.budgets.amount(id, month),
        template: isGroup(node) ? null : ledger.budgets.template(id, month),
        override: isGroup(node) ? null : ledger.budgets.override(id, month)
      },
      figures: { ...f, inleg: stats.inlegActual, outside: -stats.outside, toWithdraw: stats.toWithdraw },
      goal: stats.goal,
      history,
      bookings: bookings.map((b) => ({ ...b, transfer: !!b.transfer })),
      children: node.children.length ? rowsUnder(stats).map((r) => row(r.node, r.level)) : []
    };
  }
  function groupChoices() {
    const tree = loadTree();
    const item = (n) => ({ id: n.id, name: n.name, icon: n.effIcon });
    return { groups: tree.roots.uitgaven.children.map(item), incomeRoot: tree.roots.inkomsten.id };
  }
  function ordering() {
    const tree = loadTree();
    const item = (n) => ({ id: n.id, name: n.name, icon: n.effIcon });
    return {
      expensesRoot: tree.roots.uitgaven.id,
      incomeRoot: tree.roots.inkomsten.id,
      groups: tree.roots.uitgaven.children.map((g2) => ({ ...item(g2), budgets: g2.children.map(item) })),
      income: tree.roots.inkomsten.children.map(item)
    };
  }

  // src/lib/material-icons.ts
  var MATERIAL_GROUPS = [
    ["Wonen", [
      ["home", "huis wonen thuis", "M160-180v-390q0-14.25 6.38-27 6.37-12.75 17.62-21l260-195q15.68-12 35.84-12Q500-825 516-813l260 195q11.25 8.25 17.63 21 6.37 12.75 6.37 27v390q0 24.75-17.62 42.37Q764.75-120 740-120H590q-12.75 0-21.37-8.63Q560-137.25 560-150v-220q0-12.75-8.62-21.38Q542.75-400 530-400H430q-12.75 0-21.37 8.62Q400-382.75 400-370v220q0 12.75-8.62 21.37Q382.75-120 370-120H220q-24.75 0-42.37-17.63Q160-155.25 160-180Z"],
      ["house", "huis woning", "M261-160q-24.75 0-42.37-17.63Q201-195.25 201-220v-332L99-475q-10.04 8-21.52 6.5T58-480q-8-10-6-22t12-20l380-290q8-6 17-9.5t19-3.5q10 0 19 3.5t17 9.5l142 108v-46q0-20.83 14.62-35.42Q687.24-800 708.12-800q20.88 0 35.38 14.58Q758-770.83 758-750v122l138 106q10 8 11.5 20t-6.5 22q-8 10-19.48 11.5T860-475l-102-78v333q0 24.75-17.62 42.37Q722.75-160 698-160h-68q-24.75 0-42.37-17.63Q570-195.25 570-220v-120q0-24.75-17.62-42.38Q534.75-400 510-400h-60q-24.75 0-42.37 17.62Q390-364.75 390-340v120q0 24.75-17.62 42.37Q354.75-160 330-160h-69Zm134-410h170q0-33-25.5-54.5T480-646q-34 0-59.5 21.34T395-570Z"],
      ["apartment", "appartement flat", "M180-120q-24.75 0-42.37-17.63Q120-155.25 120-180v-435q0-24.75 17.63-42.38Q155.25-675 180-675h105v-105q0-24.75 17.63-42.38Q320.25-840 345-840h270q24.75 0 42.38 17.62Q675-804.75 675-780v270h105q24.75 0 42.38 17.62Q840-474.75 840-450v270q0 24.75-17.62 42.37Q804.75-120 780-120H533v-165H427v165H180Zm0-60h105v-105H180v105Zm0-165h105v-105H180v105Zm0-165h105v-105H180v105Zm165 165h105v-105H345v105Zm0-165h105v-105H345v105Zm0-165h105v-105H345v105Zm165 330h105v-105H510v105Zm0-165h105v-105H510v105Zm0-165h105v-105H510v105Zm165 495h105v-105H675v105Zm0-165h105v-105H675v105Z"],
      ["cottage", "huisje vakantiehuis", "M160-180v-341l-60 46q-10 8-22 6t-20-12q-8-10-6-22t12-20l96-73v-84q0-13 8.5-21.5T190-710q13 0 21.5 8.5T220-680v38l224-170q8-6 17-9.5t19-3.5q10 0 19 3.5t17 9.5l381 290q10 8 11.5 20t-6.5 22q-8 10-19.5 11.5T861-475l-61-46v341q0 25-17.5 42.5T740-120H525q-6 0-10.5-4.5T510-135v-175q0-13-8.5-21.5T480-340q-13 0-21.5 8.5T450-310v175q0 6-4.5 10.5T435-120H220q-25 0-42.5-17.5T160-180Zm35-580q-15 0-24.5-11t-4.5-24q11-34 40-54.5t64-20.5q14 0 26-7t18-20q5-9 12.5-16t18.5-7q15 0 24.5 11t4.5 24q-12 34-40.5 54.5T270-810q-14 0-25.5 7.5T226-783q-5 9-12.5 16t-18.5 7Z"],
      ["key", "sleutel huur hypotheek", "M188.5-388.5Q151-426 151-480t37.5-91.5Q226-609 280-609t91.5 37.5Q409-534 409-480t-37.5 91.5Q334-351 280-351t-91.5-37.5ZM280-240q81 0 142.5-46T503-407h32l50 50q5 5 10 7t11 2q6 0 11-2t10-7l63-63 63 63q5 5 10 7t11 2q6 0 11-2t10-7l104-104q5-5 7-10t2-11q0-6-2-11t-7-10l-43-43q-5-5-10-7t-11-2H503q-23-72-80.5-118.5T280-720q-100 0-170 70T40-480q0 100 70 170t170 70Z"],
      ["chair", "stoel meubels", "M193-119q-13 0-21.5-8.5T163-149v-43h-19q-45 0-74.5-32.5T40-302v-242q0-31 20.5-53.5T111-620q30 0 50.5 22.5T182-544v173h596v-173q0-31 20.5-53.5T849-620q30 0 50.5 22.5T920-544v242q0 45-29.5 77.5T817-192h-20v43q0 13-8.5 21.5T767-119q-13 0-21.5-8.5T737-149v-43H223v43q0 13-8.5 21.5T193-119Zm49-312v-113q0-48-26.5-85.5T144-677v-60q0-42 28-72.5t70-30.5h476q42 0 70.5 30.5T817-737v60q-45 11-72 48.5T718-544v113H242Z"],
      ["bed", "bed slapen", "M80-230v-225q0-25 10-47t30-36v-116q0-45 30.5-75.5T226-760h180q22 0 41 10t33 27q14-17 32.5-27t40.5-10h180q45 0 76 30.5t31 75.5v116q20 14 30 36t10 47v225q0 13-8.5 21.5T850-200q-13 0-21.5-8.5T820-230v-50H140v50q0 13-8.5 21.5T110-200q-13 0-21.5-8.5T80-230Zm430-325h270v-99q0-20-13.5-33T733-700H550q-17 0-28.5 14T510-654v99Zm-330 0h270v-99q0-18-11.5-32T410-700H226q-19 0-32.5 13.5T180-654v99Z"],
      ["weekend", "bank meubels", "M144-160q-44 0-74-31.5T40-268v-240q0-31 20.5-53.5T111-584q30 0 50.5 22.5T182-508v179h596v-179q0-31 20.5-53.5T849-584q30 0 50.5 22.5T920-508v240q0 45-29.5 76.5T817-160H144Zm98-229v-119q0-43-25-78t-65-53v-52q0-45 30-77t74-32h449q44 0 73.5 32t29.5 77v52q-41 16-65.5 51.5T718-508v119H242Z"],
      ["kitchen", "keuken koelkast", "M360.5-658.63q8.5-8.62 8.5-21.37v-58q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v58q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63Zm0 361q8.5-8.62 8.5-21.37v-136q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v136q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63ZM220-80q-24.75 0-42.37-17.63Q160-115.25 160-140v-398h640v398q0 24.75-17.62 42.37Q764.75-80 740-80H220Zm-60-518v-222q0-24.75 17.63-42.38Q195.25-880 220-880h520q24.75 0 42.38 17.62Q800-844.75 800-820v222H160Z"],
      ["countertops", "aanrecht keuken", "M550.82-660Q538-660 529-668.63q-9-8.62-9-21.37 1-45 33-77.5t77.5-32.5q45.5 0 77.5 32.08 32 32.09 32 77.92v130h110q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5h-50v280q0 24.75-17.62 42.37Q764.75-160 740-160H220q-24.75 0-42.37-17.63Q160-195.25 160-220v-280h-50q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32Q97.25-560 110-560h120q-28.87 0-49.44-20.56Q160-601.13 160-630v-140q0-12.75 8.63-21.38Q177.25-800 190-800h170q12.75 0 21.38 8.62Q390-782.75 390-770v140q0 28.87-20.56 49.44Q348.88-560 320-560h360v-130q0-21.25-14.32-35.63Q651.35-740 630.18-740q-21.18 0-35.68 14.5T581-691q0 13.17-8.68 22.09-8.67 8.91-21.5 8.91ZM450-220h60v-280h-60v280Z"],
      ["bathtub", "bad badkamer", "M221.5-620.5Q200-642 200-672t21.5-51.5Q243-745 273-745t51.5 21.5Q346-702 346-672t-21.5 51.5Q303-599 273-599t-51.5-21.5ZM186-80q-18 0-32-11.5T140-120q-25 0-42.5-17.5T80-180v-230q0-13 8.5-21.5T110-440h90v-28q0-35 25-60t60-25q19 0 36 7t30 21l52 59q7 8 14.5 14.5T433-440h307v-334q0-19-12.5-32.5T696-820q-10 0-19 2t-16 9l-52 52q5 17 1.5 34.5T598-689l-102-97q16-11 35-14t37 4l52-51q15-15 34.5-24t41.5-9q44 0 74 31t30 75v334h50q13 0 21.5 8.5T880-410v230q0 25-17.5 42.5T820-120q0 17-14 28.5T773-80H186Z"],
      ["shower", "douche", "M298-263q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Zm182 0q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Zm182 0q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9ZM230-413q-13 0-21.5-8.5T200-443v-30q0-107 72.5-187T450-751v-59q0-13 8.5-21.5T480-840q13 0 21.5 8.5T510-810v59q105 11 177.5 91T760-473v30q0 13-8.5 21.5T730-413H230Zm68 293q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Zm182 0q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Zm182 0q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Z"],
      ["yard", "tuin", "M480-180q0-47-18.5-90T410-346q-30-30-68-47.5T262-415q-7-1-12.5 4.5T245-398q4 42 21.5 80t47.5 68q33 33 76 51.5t90 18.5Zm43.5-236.5Q540-433 540-460v-8q8 7 18 9t19 2q27 0 43.5-16.5T637-517q0-20-9-33t-24-24q15-6 24-21.5t9-35.5q0-27-16.5-43.5T577-691q-9 0-19 2t-18 9v-8q0-27-16.5-43.5T480-748q-27 0-43.5 16.5T420-688v8q-8-7-18-9t-19-2q-27 0-43.5 16.5T323-631q0 20 8.5 33.5T356-574q-16 7-24.5 22t-8.5 35q0 27 16.5 43.5T383-457q9 0 19.5-2t17.5-9v8q0 27 16.5 43.5T480-400q27 0 43.5-16.5Zm-99-102Q402-541 402-574t22.5-55.5Q447-652 480-652t55.5 22.5Q558-607 558-574t-22.5 55.5Q513-496 480-496t-55.5-22.5ZM480-180q47 0 90-18.5t76-51.5q30-30 47.5-68t21.5-80q1-7-4.5-12.5T698-415q-42 4-80 21.5T550-346q-33 33-51.5 76T480-180ZM140-80q-24 0-42-18t-18-42v-680q0-24 18-42t42-18h680q24 0 42 18t18 42v680q0 24-18 42t-42 18H140Z"],
      ["grass", "gras tuin", "M110-160q-13 0-21.5-8.5T80-190q0-13 8.5-21.5T110-220h210q-16-72-62-129.5T151-441q-23-13-20-26t29-13q134 0 227 93t93 227H110Zm430 0q0-42-8-73.5T512-296q40-88 120-136t168-48q26 0 29 13t-20 26q-63 35-109 93.5T640-220h210q13 0 21.5 8.5T880-190q0 13-8.5 21.5T850-160H540Zm-58-193q-14-128 51.5-223.5T704-705q25-8 33.5 4t-9.5 29q-38 36-67.5 82T621-494q-44 21-80 58.5T482-353Zm-61-76q-16-15-35-30t-32-23q3-12 4.5-26.5T360-532q0-55-13-106t-37-97q-13-23-1-31t33 8q45 34 77.5 81T468-573q-18 32-30.5 69.5T421-429Z"],
      ["potted_plant", "plant tuin", "M317-80q-20 0-36.5-12.5T259-125l-52-205h546l-52 205q-5 20-21.5 32.5T643-80H317Zm163-561q5-88 67-150t149-83q4-1 7.5-.5t6.5 3.5q3 3 4 6.5t0 7.5q-17 79-71 138t-133 74v95h300q13 0 21.5 8.5T840-520v100q0 25-17.5 42.5T780-360H180q-25 0-42.5-17.5T120-420v-100q0-13 8.5-21.5T150-550h300v-95q-79-15-133-74t-71-138q-1-4 0-7.5t4-6.5q3-3 6.5-4t7.5 0q88 20 150 83t66 151Z"],
      ["local_florist", "bloemen", "M480-570q34 0 57-24t23-56q0-34-23-57t-57-23q-32 0-56 23t-24 57q0 32 24 56t56 24Zm-65.5 168.5Q385-423 371-458q-6 0-12.5.5t-12.5.5q-48 0-82-34t-34-82q0-20 8-39.5t23-37.5q-14-18-22-37.5t-8-39.5q0-48 33.5-82t81.5-34q6 0 12.5.5t12.5.5q14-35 43.5-56.5T480-920q36 0 65.5 21.5T589-842q6 0 12.5-.5t12.5-.5q48 0 81.5 34t33.5 82q0 20-7.5 39.5T699-650q14 18 22 37.5t8 39.5q0 48-33.5 82T614-457q-6 0-12.5-.5T589-458q-14 35-43.5 56.5T480-380q-36 0-65.5-21.5ZM480-80q0-123 85.5-225T770-432q14-3 27.5-.5T820-419q10 11 12 24.5t-1 27.5q-26 118-128 202.5T480-80Zm0 0q0-123-85.5-225T190-432q-14-3-27.5-.5T140-419q-10 11-12 25t1 28q26 118 128 202t223 84Z"],
      ["handyman", "klussen gereedschap onderhoud", "M753-82q-5-2-10-7L501-331q-5-5-7-10t-2-11q0-6 2-11t7-10l85-85q5-5 10-7t11-2q6 0 11 2t10 7l242 242q5 5 7 10t2 11q0 6-2 11t-7 10l-85 85q-5 5-10 7t-11 2q-6 0-11-2Zm-569.5 0q-5.5-2-10.5-7l-84-84q-5-5-7-10.5T80-195q0-6 2-11t7-10l225-225h85l38-38-175-175h-57L80-779l99-99 125 125v57l175 175 130-130-67-67 56-56H485l-18-18 128-128 18 18v113l56-56 169 169q15 15 23.5 34.5T870-600q0 20-6.5 38.5T845-528l-85-85-56 56-52-52-211 211v84L216-89q-5 5-10 7t-11 2q-6 0-11.5-2Z"],
      ["build", "onderhoud gereedschap", "M354-370q-97 0-165-67.5T121-602q0-20 3-37.5t11-36.5q3-8 9-12t13-6q7-2 14 0t13 8l113 113 92-86-118-118q-6-6-8-13t0-14q2-7 6-12.5t12-8.5q19-8 36-11.5t37-3.5q99 0 168.5 69.5T592-602q0 24-5 47t-13 46l221 221q27 26 26.5 63.5T793-161q-26 24-61.5 23.5T670-164L447-388q-23 8-46 13t-47 5Z"],
      ["construction", "verbouwing bouw", "M740-149 517-371l57-57 223 223q12 12 12 28t-12 28q-12 12-28.5 12T740-149Zm-593-28.5q0-16.5 12-28.5l261-261-107-107-2 2q-9 9-21 9t-21-9l-23-23v97q0 10-9.5 13.5T220-488L102-606q-7-7-3.5-16.5T112-632h98l-27-27q-9-9-9-21t9-21l110-110q17-17 37-23t44-6q21 0 36 5.5t32 18.5q5 5 5.5 11t-4.5 11l-95 95 27 27q9 9 9 21t-9 21l-3 3 104 104 122-122q-8-13-12.5-30t-4.5-36q0-53 38.5-91.5T711-841q8 0 14.5.5T737-838q6 3 7.5 9.5T741-817l-61 61q-5 5-5 11t5 11l53 53q5 5 11 5t11-5l59-59q5-5 13-4t11 8q2 6 2.5 12.5t.5 14.5q0 53-38.5 91.5T711-579q-18 0-31-2.5t-24-7.5L215-148q-12 12-28 11.5T159-149q-12-12-12-28.5Z"],
      ["format_paint", "verf schilderen", "M437-80q-24 0-42-17.5T377-140v-200H220q-24 0-42-18t-18-42v-303q0-55 39.5-96t95.5-41h475q13 0 21.5 8.5T800-810v410q0 24-18 42t-42 18H583v200q0 25-18 42.5T523-80h-86ZM220-554h520v-226h-56v141q0 13-8.5 21.5T654-609q-13 0-21.5-8.5T624-639v-141h-71v55q0 13-8.5 21.5T523-695q-13 0-21.5-8.5T493-725v-55H295q-32 0-53.5 23T220-703v149Z"],
      ["roofing", "dak", "M427-160q-24.75 0-42.37-17.63Q367-195.25 367-220v-106q0-24.75 17.63-42.38Q402.25-386 427-386h106q24.75 0 42.38 17.62Q593-350.75 593-326v106q0 24.75-17.62 42.37Q557.75-160 533-160H427ZM100-474q-10.35 8-22.17 6Q66-470 58-480q-8-10-6.06-22.19Q53.89-514.38 64-522l380-291q7.94-6 16.97-9 9.03-3 19.03-3 10 0 19.03 3 9.03 3 16.97 9l142 108v-45q0-20.83 14.62-35.42Q687.24-800 708.12-800q20.88 0 35.38 14.58Q758-770.83 758-750v122l139 106q9.94 7.62 11.47 19.81Q910-490 902-480q-8 10-19.83 12-11.82 2-22.17-6L480-765 100-474Z"],
      ["window", "raam", "M510-450h330v270q0 24.75-17.62 42.37Q804.75-120 780-120H510v-330Zm0-60v-330h270q24.75 0 42.38 17.62Q840-804.75 840-780v270H510Zm-60 0H120v-270q0-24.75 17.63-42.38Q155.25-840 180-840h270v330Zm0 60v330H180q-24.75 0-42.37-17.63Q120-155.25 120-180v-270h330Z"],
      ["door_front", "deur", "M150-120q-13 0-21.5-8.5T120-150q0-13 8.5-21.5T150-180h50v-600q0-24 18-42t42-18h440q24 0 42 18t18 42v600h50q13 0 21.5 8.5T840-150q0 13-8.5 21.5T810-120H150Zm441-339q10-10 10-24t-10-24q-10-10-24-10t-24 10q-10 10-10 24t10 24q10 10 24 10t24-10Z"],
      ["bolt", "energie stroom elektriciteit", "M360-360H217q-18 0-26.5-16t2.5-31l338-488q8-11 20-15t24 1q12 5 19 16t5 24l-39 309h176q19 0 27 17t-4 32L388-66q-8 10-20.5 13T344-55q-11-5-17.5-16T322-95l38-265Z"],
      ["electric_bolt", "stroom energie", "m457-386-272-32q-19-2-25-20.5t8-31.5l440-404q4-3 8.5-5t13.5-2q15 0 23 12.5t0 25.5L503-574l272 32q19 2 25 20.5t-8 31.5L352-86q-4 3-8.5 5T330-79q-15 0-23-12.5t0-25.5l150-269Z"],
      ["water_drop", "water", "M251.5-174Q160-268 160-408q0-64 29-127t72.5-121q43.5-58 94-108.5T450-854q7-6 14.5-8.5T480-865q8 0 15.5 2.5T510-854q44 39 94.5 89.5t94 108.5Q742-598 771-535t29 127q0 140-91.5 234T480-80q-137 0-228.5-94ZM479-208q16 0 24.5-5.5T512-230q0-11-8.5-17t-25.5-6q-42 0-85.5-26.5T337-373q-2-9-9-14.5t-15-5.5q-11 0-17 8.5t-4 17.5q15 84 71 121.5T479-208Z"],
      ["local_fire_department", "gas verwarming", "M160-400q0-116 71.5-225T428-811q17-11 34.5-.5T480-780v72q0 34 23.5 57t57.5 23q18 0 33.5-7.5T622-658q8-9 18-12.5t19 2.5q66 45 103.5 116T800-400q0 95-49 171.5T622-113q23-26 35.5-58t12.5-67q0-38-14-71.5T615-370L480-502 346-370q-28 27-42 60.5T290-238q0 35 12.5 67t35.5 58q-80-39-129-115.5T160-400Zm320-18 92 90q18 18 28 41t10 49q0 53-38 90.5T480-110q-54 0-92-37.5T350-238q0-26 9.5-49t28.5-41l92-90Z"],
      ["heat", "verwarming warmte", "M526-129q-5 4-10.5 6t-10.5 2q-6 0-11-2t-10-7q-41-43-61-89t-20-96q0-36 11-76.5T453-501q26-60 35-92.5t9-59.5q0-38-16.5-71T429-789q-5-5-7-10.5t-2-11.5q0-5 1.5-10t5.5-10q5-5 10.5-7t11.5-2q5 0 10.5 2t10.5 6q44 41 65.5 85t21.5 94q0 34-10 71.5T509-478q-26 61-36 96.5T463-316q0 39 16 74.5t49 70.5q4 5 5.5 10t1.5 10q0 6-2 11.5t-7 10.5Zm203 1q-5 4-10 5.5t-10 1.5q-6 0-11.5-2t-10.5-7q-41-43-61-88.5T606-314q0-36 11-76.5T656-500q26-60 35-92.5t9-59.5q0-38-16.5-70.5T632-788q-5-5-6.5-10t-1.5-11q0-5 1.5-10.5T631-830q5-5 10.5-7t11.5-2q5 0 10 1.5t10 5.5q44 41 65.5 85t21.5 94q0 35-10.5 75T712-477q-26 60-36 95.5T666-316q0 39 16 75.5t49 70.5q4 5 5.5 10t1.5 10q0 6-2 11.5t-7 10.5Zm-406 0q-5 4-10 5.5t-10 1.5q-6 0-11.5-2t-10.5-7q-41-43-61-88.5T200-314q0-36 11-76.5T250-500q26-60 35-92.5t9-59.5q0-38-16.5-70.5T226-788q-5-5-7-10.5t-2-11.5q0-5 1.5-10.5T224-831q5-5 10.5-7.5T246-841q5 0 10.5 2t10.5 7q44 41 65.5 85t21.5 94q0 34-10.5 72.5T306-477q-25 60-35 95t-10 66q0 40 16 76t48 70q4 5 5.5 10t1.5 10q0 6-2 11.5t-7 10.5Z"],
      ["solar_power", "zonnepanelen", "M150-820q-13 0-21.5-8.5T120-850q0-13 8.5-21.5T150-880h60q13 0 21.5 8.5T240-850q0 13-8.5 21.5T210-820h-60Zm-36 570-20 98q-5 28 12.5 50T153-80h297v-170H114Zm99-414 42-42q9-9 21-9t21 9q9 9 9 21.5t-9 21.5l-42 42q-9 9-21 9t-21-9q-9-9-9-21.5t9-21.5Zm-87 354h324v-170H209q-22 0-38 13.5T150-432l-24 122Zm324-240v-60q0-13 8.5-21.5T480-640q13 0 21.5 8.5T510-610v60q0 13-8.5 21.5T480-520q-13 0-21.5-8.5T450-550Zm60 470h297q29 0 46.5-22t12.5-50l-20-98H510v170Zm0-230h324l-24-122q-5-21-21-34.5T751-480H510v170Zm195-313-43-42q-9-9-9-21t9-21q9-9 21-8.5t21 8.5l43 42q9 9 9.5 21t-8.5 21q-9 9-21.5 9t-21.5-9Zm105-197h-60q-13 0-21.5-8.5T720-850q0-13 8.5-21.5T750-880h60q13 0 21.5 8.5T840-850q0 13-8.5 21.5T810-820Zm-443 79q-48-41-62-103-3-14 6.5-25t24.5-11h288q15 0 24.5 11t6.5 25q-14 62-62 103t-113 41q-65 0-113-41Z"],
      ["lightbulb", "lamp licht", "M422.5-103.5Q399-127 399-161h162q0 34-23.5 57.5T480-80q-34 0-57.5-23.5ZM348-223q-13 0-21.5-8.5T318-253q0-13 8.5-21.5T348-283h264q13 0 21.5 8.5T642-253q0 13-8.5 21.5T612-223H348Zm-25-121q-66-43-104.5-107.5T180-597q0-122 89-211t211-89q122 0 211 89t89 211q0 81-38 145.5T637-344H323Z"],
      ["cleaning_services", "schoonmaak", "M180-40q-24.75 0-42.37-17.63Q120-75.25 120-100v-230q0-78.85 55.57-134.42Q231.15-520 310-520h60v-340q0-24.75 17.63-42.38Q405.25-920 430-920h100q24.75 0 42.38 17.62Q590-884.75 590-860v340h60q78.85 0 134.42 55.58Q840-408.85 840-330v230q0 24.75-17.62 42.37Q804.75-40 780-40H180Zm0-60h105v-130q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v130h105v-130q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v130h105v-130q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v130h105v-230q0-54.17-37.92-92.08Q704.17-460 650-460H310q-54.17 0-92.08 37.92Q180-384.17 180-330v230Z"],
      ["local_laundry_service", "was wasmachine", "M220-80q-24.75 0-42.37-17.63Q160-115.25 160-140v-680q0-24.75 17.63-42.38Q195.25-880 220-880h520q24.75 0 42.38 17.62Q800-844.75 800-820v680q0 24.75-17.62 42.37Q764.75-80 740-80H220Zm397.5-175.5Q674-312 674-393t-56.5-137.5Q561-587 480-587t-137.5 56.5Q286-474 286-393t56.5 137.5Q399-199 480-199t137.5-56.5ZM480-283q-22.68 0-44.05-8-21.38-8-37.95-24l159-159q17 15 25 36.56 8 21.56 8 44.44 0 45.83-32.08 77.92Q525.83-283 480-283ZM304.18-708q12.82 0 21.32-8.68 8.5-8.67 8.5-21.5 0-12.82-8.68-21.32-8.67-8.5-21.5-8.5-12.82 0-21.32 8.68-8.5 8.67-8.5 21.5 0 12.82 8.68 21.32 8.67 8.5 21.5 8.5Zm155.32-8.68q8.5-8.67 8.5-21.5 0-12.82-8.68-21.32-8.67-8.5-21.5-8.5-12.82 0-21.32 8.68-8.5 8.67-8.5 21.5 0 12.82 8.68 21.32 8.67 8.5 21.5 8.5 12.82 0 21.32-8.68Z"],
      ["delete", "afval vuilnis", "M261-120q-24.75 0-42.37-17.63Q201-155.25 201-180v-570h-11q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h158q0-13 8.63-21.5 8.62-8.5 21.37-8.5h204q12.75 0 21.38 8.62Q612-822.75 612-810h158q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5h-11v570q0 24.75-17.62 42.37Q723.75-120 699-120H261Zm157.5-154.63q8.5-8.62 8.5-21.37v-339q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v339q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63Zm166 0q8.5-8.62 8.5-21.37v-339q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v339q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63Z"],
      ["recycling", "afval recycling", "m383-618 74-121-59-98q-12-20-34.5-20T329-837l-83 137q-7 11-3.5 22.5T257-659l85 52q11 6 22.5 3t18.5-14Zm372 298-73-122q-7-11-3.5-23t14.5-18l86-50q11-6 23-3.5t18 13.5l49 82q11 17 12 38t-9 39q-10 20-29.5 32T800-320h-45ZM614-66 501-179q-9-9-9-21t9-21l113-113q7-7 16.5-3.5T640-324v44h190l-58 116q-11 20-30 32t-42 12h-60v44q0 10-9.5 13.5T614-66Zm-361-54q-20 0-36.5-10.5T192-158q-8-16-7.5-33.5T194-224l34-56h142q13 0 21.5 8.5T400-250v100q0 13-8.5 21.5T370-120H253Zm-99-114L89-364q-9-18-8.5-38.5T92-441l16-27-37-22q-8-5-7-15.5T75-518l155-39q12-3 22.5 3.5T266-535l39 156q2 10-6 15.5t-16 .5l-38-23-91 152Zm511-349-155-39q-10-2-11.5-12.5T506-650l38-22-125-208h141q21 0 39.5 10.5T629-841l52 87 37-23q8-5 16 1t6 16l-39 155q-3 12-13.5 18.5T665-583Z"],
      ["account_balance", "gemeente belasting overheid", "M212-271v-279q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v279q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37Zm242 0v-279q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v279q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37ZM110-121q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32Q97.25-181 110-181h740q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H110Zm578-150v-279q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v279q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37Zm166-369H103q-9.58 0-16.29-6.71Q80-653.42 80-663v-17q0-6 3.5-11.5T92-700l358-204q14.17-8 30-8t30 8l357 203q6 4 9.5 10t3.5 13.5v10.23q0 11.59-7.47 19.43Q865.05-640 854-640Z"],
      ["shield", "verzekering", "M470.5-85q-4.5-1-9.5-3-139-47-220-168.5T160-523v-196q0-19 11-34.5t28-22.5l260-97q11-4 21-4t21 4l260 97q17 7 28 22.5t11 34.5v196q0 145-81 266.5T499-88q-5 2-9.5 3t-9.5 1q-5 0-9.5-1Z"],
      ["security", "beveiliging verzekering", "M480-142q106-35 175.5-128.5T737-480H480v-335l-260 97v196q0 12 .5 20.5T223-480h257v338Zm-9.5 57q-4.5-1-9.5-3-139-47-220-168.5T160-523v-196q0-19 11-34.5t28-22.5l260-97q11-4 21-4t21 4l260 97q17 7 28 22.5t11 34.5v196q0 145-81 266.5T499-88q-5 2-9.5 3t-9.5 1q-5 0-9.5-1Z"],
      ["verified_user", "verzekering", "m439-442-79-79q-9-9-22-9t-22 9q-9 9-9 22t9 22l99 100q9 9 21 9t21-9l186-186q9-9 9-21.5t-9-20.5q-8-8-21-7.5t-21 8.5L439-442Zm31.5 357q-4.5-1-9.5-3-139-47-220-168.5T160-523v-196q0-19 11-34.5t28-22.5l260-97q11-4 21-4t21 4l260 97q17 7 28 22.5t11 34.5v196q0 145-81 266.5T499-88q-5 2-9.5 3t-9.5 1q-5 0-9.5-1Z"]
    ]],
    ["Vervoer", [
      ["directions_car", "auto", "M200-204v44q0 16.67-11.74 28.33Q176.53-120 159.76-120q-16.76 0-28.26-11.67Q120-143.33 120-160v-304q0-4.67.5-9.33.5-4.67 2.5-9.67l78-236q6-19 21.75-30T258-760h444q19.5 0 35.25 11T759-719l78 236q2 5 2.5 9.67.5 4.66.5 9.33v304q0 16.67-11.74 28.33Q816.53-120 799.76-120 783-120 771-131.96T759-161v-43H200Zm3-330h554l-55-166H258l-55 166Zm82.76 220q23.24 0 38.74-15.75Q340-345.5 340-368q0-23.33-15.75-39.67Q308.5-424 286-424q-23.33 0-39.67 16.26Q230-391.47 230-368.24q0 23.24 16.26 38.74 16.27 15.5 39.5 15.5ZM675-314q23.33 0 39.67-15.75Q731-345.5 731-368q0-23.33-16.26-39.67Q698.47-424 675.24-424q-23.24 0-38.74 16.26-15.5 16.27-15.5 39.5 0 23.24 15.75 38.74Q652.5-314 675-314Z"],
      ["electric_car", "elektrische auto", "M200-364v44q0 16.67-11.74 28.33Q176.53-280 159.76-280q-16.76 0-28.26-11.67Q120-303.33 120-320v-304q0-4.67.5-9.33.5-4.67 2.5-9.67l78-236q6-19 21.75-30T258-920h444q19.5 0 35.25 11T759-879l78 236q2 5 2.5 9.67.5 4.66.5 9.33v304q0 16.67-11.74 28.33Q816.53-280 799.76-280 783-280 771-291.96T759-321v-43H200Zm3-330h554l-55-166H258l-55 166Zm82.76 220q23.24 0 38.74-15.75Q340-505.5 340-528q0-23.33-15.75-39.67Q308.5-584 286-584q-23.33 0-39.67 16.26Q230-551.47 230-528.24q0 23.24 16.26 38.74 16.27 15.5 39.5 15.5ZM675-474q23.33 0 39.67-15.75Q731-505.5 731-528q0-23.33-16.26-39.67Q698.47-584 675.24-584q-23.24 0-38.74 16.26-15.5 16.27-15.5 39.5 0 23.24 15.75 38.74Q652.5-474 675-474ZM516-120v55q0 8.13-7 12.57-7 4.43-15 .43l-175-92q-5-3-3.91-8.5 1.09-5.5 6.91-5.5h118v-52q0-8.13 7-12.57 7-4.43 15-.43l178 89q5 2.95 3.5 8.47Q642-120 636-120H516Z"],
      ["local_gas_station", "brandstof benzine tanken", "M160-150v-630q0-24 18-42t42-18h269q24 0 42 18t18 42v288h65q20.63 0 35.31 14.69Q664-462.63 664-442v219q0 21.68 15.5 36.34Q695-172 717-172t37.5-14.66Q770-201.32 770-223v-295q-11 6-23 9t-24 3q-39.48 0-66.74-27.26Q629-560.52 629-600q0-31.61 18-56.81Q665-682 695-690l-77-77q-8-7.64-8-17.82t8-18.18q8-8 18-7.5t18 8.5l135 135q14 14 22.5 30.5T820-600v377q0 43.26-29.82 73.13-29.81 29.87-73 29.87Q674-120 644-149.87q-30-29.87-30-73.13v-219h-65v292q0 12.75-8.62 21.37Q531.75-120 519-120H190q-12.75 0-21.37-8.63Q160-137.25 160-150Zm60-402h269v-228H220v228Zm503-4q18 0 31-13t13-31q0-18-13-31t-31-13q-18 0-31 13t-13 31q0 18 13 31t31 13Z"],
      ["ev_station", "laden laadpaal", "M220-552h269v-228H220v228Zm299 432H190q-12.75 0-21.37-8.63Q160-137.25 160-150v-630q0-24 18-42t42-18h269q24 0 42 18t18 42v288h65q20.71 0 35.36 14.64Q664-462.71 664-442v219q0 22 17.5 36.5T722-172q23 0 43-14.5t20-36.5v-387h-15q-12.75 0-21.37-8.63Q740-627.25 740-640v-75q0-6 4.5-10.5T755-730h5v-35q0-6 4.5-10.5T775-780q6 0 10.5 4.5T790-765v35h40v-35q0-6 4.5-10.5T845-780q6 0 10.5 4.5T860-765v35h5q6 0 10.5 4.5T880-715v75q0 12.75-8.62 21.37Q862.75-610 850-610h-15v386.69Q835-180 801-150t-79.18 30q-44.16 0-75.99-30T614-223v-219h-65v292q0 12.75-8.62 21.37Q531.75-120 519-120Zm-182-94 88-140h-53v-105l-87 140h52v105Z"],
      ["local_parking", "parkeren", "M360-376v196q0 25-17.5 42.5T300-120q-25 0-42.5-17.5T240-180v-600q0-25 17.5-42.5T300-840h228q98 0 165 67t67 165q0 98-67 165t-165 67H360Zm0-120h168q48 0 80-32t32-80q0-48-32-80t-80-32H360v224Z"],
      ["car_repair", "garage onderhoud auto", "M458.5-88.63Q450-97.25 450-110v-90H190q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h580q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H510v90q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Zm-112-423.05q8.5-8.67 8.5-21.5 0-12.82-8.68-21.32-8.67-8.5-21.5-8.5-12.82 0-21.32 8.68-8.5 8.67-8.5 21.5 0 12.82 8.68 21.32 8.67 8.5 21.5 8.5 12.82 0 21.32-8.68Zm310 0q8.5-8.67 8.5-21.5 0-12.82-8.68-21.32-8.67-8.5-21.5-8.5-12.82 0-21.32 8.68-8.5 8.67-8.5 21.5 0 12.82 8.68 21.32 8.67 8.5 21.5 8.5 12.82 0 21.32-8.68Zm-448 183.05Q200-337.25 200-350v-256q0-4.9.5-9.45.5-4.55 2.5-9.55l60-175q6-17.78 21.75-28.89T320-840h320q19.5 0 35.25 11.11T697-800l60 175q2 5 2.5 9.55.5 4.55.5 9.45v256q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37v-58H260v58q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM277-658h407l-41-122H317l-40 122Z"],
      ["tire_repair", "banden", "M733.5-674.5Q730-682 730-690q0-11 6.27-19.5T752.5-725q15.5-11 33.5-18t36-12q3-1 6-.5t4.71 2.21Q835-751 835-742q-5 18-12 36t-18 33.5q-7 9.96-15.5 16.23T770-650q-8 0-15.5-3.5T742-662q-5-5-8.5-12.5ZM140-120q-24.75 0-42.37-17.63Q80-155.25 80-180v-600q0-24.75 17.63-42.38Q115.25-840 140-840h270q24.75 0 42.38 17.62Q470-804.75 470-780v361q14-5 27-8t23.08-3q45.8 0 77.86 32.08Q630-365.83 630-320v85q0 20 17.5 37.5t38 17.5q20.5 0 37.5-17.5t17-37.5v-225h-40v-54q-54-23-87-69.78t-33-105.98q0-79.24 56-134.74Q692-880 770.5-880t134 55.6Q960-768.81 960-689.92 960-631 927-584t-87 70v54h-40v225q0 45-34.5 80t-80 35q-45.5 0-80.5-35t-35-80v-85q0-21.25-14.37-35.63Q541.25-370 520-370q-20 0-35 14.37-15 14.38-15 35.63v140q0 24.75-17.62 42.37Q434.75-120 410-120H140Zm629.88-440Q824-560 862-597.88q38-37.88 38-92T862.12-782q-37.88-38-92-38T678-782.12q-38 37.88-38 92T677.88-598q37.88 38 92 38ZM129-725l60 60q10.58 11 22.29 9.5Q223-657 231-665t9.5-20.17Q242-697.35 231-708l-60-60q-10.58-11-22.29-9.5Q137-776 129-768t-9.5 20.17Q118-735.65 129-725Zm292 0q11-10.58 9.5-22.29Q429-759 421-767t-19.71-10q-11.71-2-22.29 9l-60 60q-11 10.58-9.5 22.29Q311-674 319-666t19.71 10q11.71 2 22.29-9l60-60ZM129-515l60 60q10.58 11 22.29 9.5Q223-447 231-455t9.5-20.17Q242-487.35 231-498l-60-60q-10.58-11-22.29-9.5Q137-566 129-558t-9.5 20.17Q118-525.65 129-515Zm292 0q11-10.58 9.5-22.29Q429-549 421-557t-19.71-10q-11.71-2-22.29 9l-60 60q-11 10.58-9.5 22.29Q311-464 319-456t19.71 10q11.71 2 22.29-9l60-60ZM129-315l60 60q10.58 11 22.29 9.5Q223-247 231-255t9.5-20.17Q242-287.35 231-298l-60-60q-10.58-11-22.29-9.5Q137-366 129-358t-9.5 20.17Q118-325.65 129-315Zm292 0q11-10.58 9.5-22.29Q429-349 421-357t-19.71-10q-11.71-2-22.29 9l-60 60q-11 10.58-9.5 22.29Q311-264 319-256t19.71 10q11.71 2 22.29-9l60-60Z"],
      ["local_car_wash", "wasstraat", "M441.5-786.5Q424-804 424-827.84q0-17.16 8-29.66t40-49.5q5-5 11-5t11 5q32 37 40 49.5t8 29.66q0 23.84-17.5 41.34Q507-769 483-769t-41.5-17.5Zm-211 0Q213-804 213-827.84q0-17.16 8-29.66t40-49.5q5-5 11-5t11 5q32 37 40 49.5t8 29.66q0 23.84-17.5 41.34Q296-769 272-769t-41.5-17.5Zm420 0Q633-804 633-827.84q0-17.16 8-29.66t40-49.5q5-5 11-5t11 5q32 37 40 49.5t8 29.66q0 23.84-17.5 41.34Q716-769 692-769t-41.5-17.5ZM200-124v44q0 16.67-11.74 28.33Q176.53-40 159.76-40 143-40 131.5-51.67 120-63.33 120-80v-304q0-4.67.5-9.33.5-4.67 2.5-9.67l78-236q6-19 21.75-30T258-680h444q19.5 0 35.25 11T759-639l78 236q2 5 2.5 9.67.5 4.66.5 9.33v304q0 16.67-11.74 28.33Q816.53-40 799.76-40 783-40 771-51.96T759-81v-43H200Zm3-330h554l-55-166H258l-55 166Zm82.76 220q23.24 0 38.74-15.75Q340-265.5 340-288q0-23.33-15.75-39.67Q308.5-344 286-344q-23.33 0-39.67 16.26Q230-311.47 230-288.24q0 23.24 16.26 38.74 16.27 15.5 39.5 15.5ZM675-234q23.33 0 39.67-15.75Q731-265.5 731-288q0-23.33-16.26-39.67Q698.47-344 675.24-344q-23.24 0-38.74 16.26-15.5 16.27-15.5 39.5 0 23.24 15.75 38.74Q652.5-234 675-234Z"],
      ["train", "trein ov", "M160-340v-380q0-41 19-71.5t58.5-50q39.5-19.5 100-29T480-880q86 0 146.5 9t99 28.5Q764-823 782-793t18 73v380q0 59-40.5 99.5T660-200l26 26q15 15 7 34.5T663-120q-6 0-11.5-2t-10.5-7l-71-71H390l-71 71q-5 5-10.5 7t-11.5 2q-21 0-29.5-19.5T274-174l26-26q-59 0-99.5-40.5T160-340Zm60-205h234v-155H220v155Zm294 0h226v-155H514v155ZM374-331q16-16 16-39t-16-39q-16-16-39-16t-39 16q-16 16-16 39t16 39q16 16 39 16t39-16Zm290 0q16-16 16-39t-16-39q-16-16-39-16t-39 16q-16 16-16 39t16 39q16 16 39 16t39-16Z"],
      ["directions_bus", "bus ov", "M302-202v39q0 17.92-12.56 30.46T258.94-120q-17.94 0-30.44-12.54T216-163v-68q-29-16-42.5-46T160-341v-397q0-73.66 76.5-107.83T481-880q166 0 242.5 34T800-738v397q0 34-13.5 64T744-231v68q0 17.92-12.56 30.46T700.94-120q-17.94 0-30.44-12.54T658-163v-39H302Zm-82-329h520v-173H220v173Zm145 202.94q16-16.06 16-39T364.94-406q-16.06-16-39-16T287-405.94q-16 16.06-16 39T287.06-328q16.06 16 39 16T365-328.06Zm308 0q16-16.06 16-39T672.94-406q-16.06-16-39-16T595-405.94q-16 16.06-16 39T595.06-328q16.06 16 39 16T673-328.06Z"],
      ["tram", "tram", "M160-260v-394q0-90 70.5-119T449-804l32-66H305q-11 0-18-7t-7-18q0-11 7-18t18-7h350q11 0 18 7t7 18q0 11-7 18t-18 7H541l-30 66q126 2 207.5 30.5T800-654v394q0 59-40.5 99.5T660-120l26 26q15 15 7 34.5T663-40q-6 0-11.5-2T641-49l-71-71H390l-71 71q-5 5-10.5 7T297-40q-21 0-29.5-19.5T274-94l26-26q-59 0-99.5-40.5T160-260Zm362 0q16-16 16-39t-16-39q-16-16-39-16t-39 16q-16 16-16 39t16 39q16 16 39 16t39-16ZM220-474h519v-155H220v155Z"],
      ["subway", "metro", "M80-140v-474q0-82 42.5-144T241-850q56-21 119-25.5t120-4.5q57 0 120.5 4.5T720-850q76 30 118 92t42 144v474q0 25-17.5 42.5T820-80H140q-25 0-42.5-17.5T80-140Zm205-288v-175h390v175H285Zm307 116q-11-11-11-28t11-28q11-11 28-11t28 11q11 11 11 28t-11 28q-11 11-28 11t-28-11Zm-280 0q-11-11-11-28t11-28q11-11 28-11t28 11q11 11 11 28t-11 28q-11 11-28 11t-28-11Zm116 91h104l74 74q4 4 8 5.5t9 1.5q17 0 22.5-15t-5.5-26l-40-40q47 0 83.5-31.5T720-340v-263q0-72-75-94.5T480-720q-106 0-173 22.5T240-603v263q0 60 41 89.5t79 29.5l-40 40q-11 11-5 26t22 15q5 0 9.5-2t7.5-5l74-74Z"],
      ["directions_bike", "fiets", "M195-80q-81 0-138-57T0-275q0-81 57-138t138-57q81 0 138 57t57 138q0 81-57 138T195-80Zm96-99q39-39 39-96t-39-96q-39-39-96-39t-96 39q-39 39-39 96t39 96q39 39 96 39t96-39Zm242-481L422-548l72 78q8 8 12 19t4 22v193q0 13-8.5 21.5T480-206q-13 0-21.5-8.5T450-236v-170L315-525q-11-9-16-22t-5-27q0-14 5.5-26t15.5-22l119-119q11-11 24.5-16t28.5-5q15 0 28.5 5t24.5 16l78 78q26 26 58.5 43t68.5 22q12 2 19.5 12t5.5 22q-2 12-12 19.5t-22 5.5q-46-6-88-27t-75-54l-40-40Zm34.5-115.5Q546-797 546-827t21.5-51.5Q589-900 619-900t51.5 21.5Q692-857 692-827t-21.5 51.5Q649-754 619-754t-51.5-21.5ZM765-80q-81 0-138-57t-57-138q0-81 57-138t138-57q81 0 138 57t57 138q0 81-57 138T765-80Zm96-99q39-39 39-96t-39-96q-39-39-96-39t-96 39q-39 39-39 96t39 96q39 39 96 39t96-39Z"],
      ["electric_bike", "e-bike fiets", "M193-280q-81 0-137.5-57T-1-475q0-81 57-137.5T194-669q71 0 124.5 45.5T383-508h51l-82-232h-43q-13 0-21.5-8.5T279-770q0-13 8.5-21.5T309-800h128q13 0 21.5 8.5T467-770q0 13-8.5 21.5T437-740h-22l26 71h222l-71-191h-75q-13 0-21.5-8.5T487-890q0-13 8.5-21.5T517-920h69q24 0 40.5 11t24.5 33l76 207h38q81 0 137.5 56T959-477q0 81-56.5 139T765-280q-72 0-126-48t-66-120H383q-11 72-64.5 120T193-280Zm131-168v-60h-89q-13 0-21.5 8.5T205-478q0 13 8.5 21.5T235-448h89Zm174-60h76q4-23 15.5-51t31.5-50H462l36 101Zm191-81 33 86q5 11 15.5 16t22.5 1q12-4 17-15.5t1-22.5l-29-85-60 20ZM516-115v51q0 8-7 12.5t-15 .5l-173-88q-5-3-4-8.5t7-5.5h116v-52q0-8 7-12.5t15-.5l177 89q5 3 3.5 8.5T635-115H516Z"],
      ["two_wheeler", "scooter motor", "M157-200q-65 0-111-45.5T0-357q0-66 45.5-111.5T156-514l-47-36H25q-11 0-18-7t-7-18q0-11 7-18t18-7h156l99 60 149-56q5-2 10.5-3t10.5-1h129l-78-100h-59q-13 0-21.5-8.5T412-730q0-13 8.5-21.5T442-760h60q14 0 26.5 6t20.5 17l68 88 107-53q8-4 15 .5t7 12.5v65q0 6-4.5 10.5T731-609h-83l85 110q17-7 34-10.5t35-3.5q66 0 112 45.5T960-356q0 66-46 111t-112 45q-65 0-110.5-45.5T646-356q0-30 10-57t30-49l-35-45-137 209q-5 6-11 10t-14 4h-82q-5 0-10.5-2t-10.5-6l-72-65q0 66-45.5 111.5T157-200Zm0-60q41 0 69-28.5t28-68.5q0-40-28-68.5T157-454q-40 0-68.5 28T60-357q0 41 28.5 69t68.5 28Zm645 0q41 0 69.5-28t28.5-68q0-41-28.5-69.5T802-454q-40 0-68 28.5T706-356q0 40 28 68t68 28Z"],
      ["electric_scooter", "step", "M191-240q-46 0-78.5-32.5T80-351q0-46 32.5-78.5T191-462q38 0 69 21t39 57h240q8-72 57-124.5T717-574l-63-286H526q-13 0-21.5-8.5T496-890q0-13 8.5-21.5T526-920h130q21 0 37.5 13t21.5 34l71 326q2 8-3.5 14.5T769-526q-67 0-117.5 45.5T596-370q-2 19-14 32.5T552-324H299q-8 38-39 61t-69 23Zm499.5-32.5Q658-305 658-351t32.5-78.5Q723-462 769-462t78.5 32.5Q880-397 880-351t-32.5 78.5Q815-240 769-240t-78.5-32.5ZM523-118v53q0 8-7 13t-15 1l-179-92q-5-3-4-8.5t7-5.5h119v-54q0-8 7-13t15-1l180 93q5 3 3.5 8.5T642-118H523Z"],
      ["local_taxi", "taxi", "M200-204v44q0 16.67-11.74 28.33Q176.53-120 159.76-120q-16.76 0-28.26-11.67Q120-143.33 120-160v-304q0-4.67.5-9.33.5-4.67 2.5-9.67l78-236q6-19 21.75-30T258-760h117v-45q0-12.75 8.63-21.38Q392.25-835 405-835h152q12.75 0 21.38 8.62Q587-817.75 587-805v45h115q19.5 0 35.25 11T759-719l78 236q2 5 2.5 9.67.5 4.66.5 9.33v304q0 16.67-11.74 28.33Q816.53-120 799.76-120 783-120 771-131.96T759-161v-43H200Zm3-330h554l-55-166H258l-55 166Zm82.76 220q23.24 0 38.74-15.75Q340-345.5 340-368q0-23.33-15.75-39.67Q308.5-424 286-424q-23.33 0-39.67 16.26Q230-391.47 230-368.24q0 23.24 16.26 38.74 16.27 15.5 39.5 15.5ZM675-314q23.33 0 39.67-15.75Q731-345.5 731-368q0-23.33-16.26-39.67Q698.47-424 675.24-424q-23.24 0-38.74 16.26-15.5 16.27-15.5 39.5 0 23.24 15.75 38.74Q652.5-314 675-314Z"],
      ["flight", "vliegtuig vliegen", "M409-421 137-311q-20 8-38.5-4T80-350v-18q0-11 5-19.5T98-402l311-219v-188q0-29 21-50t50-21q29 0 50 21t21 50v188l311 219q8 6 13 14.5t5 19.5v18q0 23-18.5 35t-38.5 4L551-421v172l109 76q7 5 11 12.5t4 15.5v19q0 17-13.5 27.5T631-93l-151-46-151 46q-17 5-30.5-5.5T285-126v-19q0-8 4-15.5t11-12.5l109-76v-172Z"],
      ["directions_boat", "boot", "M407-89.5Q370-99 333-117q-53 25-92.5 31T150-80q-12 0-21-8.5t-9-21.5q0-12 9-21t21-9q25 0 46.5-1t42.5-5.5q21-4.5 42-12.5t45-22q3-2 7-2t7 2q34 20 69 29.5t71 9.5q36 0 71-9.5t69-29.5q3-2 7-2t7 2q24 13 45 21.5t42 12.5q21 4 42.5 5.5T810-140q13 0 21.5 8.5T840-110q0 13-9 21.5T810-80q-51 0-91-6t-91-31q-38 19-75 28t-73 9q-36 0-73-9.5ZM246-718v171l216-66q8-2 18-2.5t18 2.5l216 67v-172H246Zm234 489q-35 0-74.5-20.5T331-307q-26 26-54.5 43T219-238q-15 5-28-3.5T173-265l-62-210q-4-12 2-22.5t18-14.5l55-16v-190q0-25 17.5-42.5T246-778h132v-73q0-13 8.5-21.5T408-881h144q13 0 21.5 8.5T582-851v73h132q25 0 42.5 17.5T774-718v190l55 16q12 4 18 14.5t2 22.5l-61 210q-5 15-18 23.5t-28 4.5q-30-9-58-26.5T630-307q-35 37-74.5 57.5T480-229Z"],
      ["toll", "tol", "M373-253q-93-93-93-227t93-227q93-93 227-93t227 93q93 93 93 227t-93 227q-93 93-227 93t-227-93Zm-113 74q-99-26-159.5-110.5T40-480q0-106 60.5-190.5T260-781q14-4 24 4.5t10 23.5q0 9-6.5 17T272-725q-78 23-125 91.5T100-480q0 85 47 153.5T272-235q9 3 15.5 10.5T294-207q0 15-10 23.5t-24 4.5Z"],
      ["commute", "woon-werk reizen", "M479-227v34q0 14.02-9.48 23.51-9.48 9.49-23.5 9.49t-23.52-9.49Q413-178.98 413-193v-206q0-4.67.5-9.33.5-4.67 2.5-9.67l46-135q6-18.22 21.75-29.61T519-594h255q19.5 0 35.25 11.39T831-553l46 135q2 5 2.5 9.67.5 4.66.5 9.33v206q0 14.02-9.48 23.51-9.48 9.49-23.5 9.49t-23.52-9.49Q814-178.98 814-193v-34H479Zm-13-212h361l-38-115H504l-38 115Zm54 146q16.58 0 27.79-11T559-332q0-17-11.21-28T520-371q-16.58 0-27.79 11T481-332q0 17 11.21 28T520-293Zm253 0q16.58 0 27.79-11T812-332q0-17-11.21-28T773-371q-16.58 0-27.79 11T734-332q0 17 11.21 28T773-293ZM179-160q-9.92 0-13.46-9.5Q162-179 169-186l52-52q-57 0-99-34.5T80-361v-328q0-66 52-88.5T338-800q143 0 200.5 23t57.5 76v47q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37v-47H140v269h213q12.75 0 21.38 8.62Q383-414.75 383-402v212q0 12.75-8.62 21.37Q365.75-160 353-160H179Zm40-173.21q11-11.21 11-27.79t-11-27.79Q208-400 191-400t-28 11.21q-11 11.21-11 27.79t11 27.79Q174-322 191-322t28-11.21Z"]
    ]],
    ["Eten en boodschappen", [
      ["shopping_cart", "boodschappen supermarkt", "M236-102.21q-21-21.21-21-51T236.21-204q21.21-21 51-21T338-203.79q21 21.21 21 51T337.79-102q-21.21 21-51 21T236-102.21Zm400 0q-21-21.21-21-51T636.21-204q21.21-21 51-21T738-203.79q21 21.21 21 51T737.79-102q-21.21 21-51 21T636-102.21ZM205-801h589.07q22.97 0 34.95 21 11.98 21-.02 42L694-495q-11 19-28.56 30.5T627-453H324l-56 104h461q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H277q-42 0-60.5-28t.5-63l64-118-152-322H81q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32Q68.25-880 81-880h68q9 0 16.2 4.43 7.2 4.44 10.8 12.57l29 62Z"],
      ["shopping_basket", "boodschappen mand", "M206-120q-20 0-36.5-12T148-164L38-562q-4-14 5-26t24-12h202l185-270q5-6 11-9.5t14-3.5q8 0 14 3.5t11 9.5l184 270h206q15 0 24 12t5 26L812-164q-5 20-21.5 32T754-120H206Zm316.5-197.5Q540-335 540-360t-17.5-42.5Q505-420 480-420t-42.5 17.5Q420-385 420-360t17.5 42.5Q455-300 480-300t42.5-17.5ZM342-600h273L479-800 342-600Z"],
      ["grocery", "boodschappen", "M140-160q-24 0-42-18t-18-42v-330q0-13 1.5-21t6.5-19l92-200h-22q-15 0-24.5-9.5T124-824v-22q0-15 9.5-24.5T158-880h261q15 0 24.5 9.5T453-846v22q0 15-9.5 24.5T419-790h-22l96 222q-69 35-105.5 108.5T351-311q0 35 9 78t29 73H140Zm506 80q-100 0-167-67t-67-167q0-100 67-167t167-67q100 0 167 67t67 167q0 100-67 167T646-80Zm0-518q-36 0-60-24t-24-60q0-36 24-60t60-24v168q0-36 24-60t60-24q36 0 60 24t24 60H646Z"],
      ["nutrition", "fruit groente", "M281.5-201.5Q200-283 200-400q0-100 61.5-176.5T420-674q-34-6-60-25.5T316-747q-18-28-27-62.5t-9-70.5q43-2 81 13.5t67 42.5q29 27 45.5 64t15.5 80q14-43 39.5-80t57.5-69q9-9 21-9t21 9q9 9 9 21t-9 21q-25 25-45 54t-34 61q94 24 152.5 99.5T760-400q0 117-81.5 198.5T480-120q-117 0-198.5-81.5Z"],
      ["bakery_dining", "bakker brood", "m829-247-111-40 83-205 85 175q20 40-1 61.5t-56 8.5Zm-246-18 62-383q4-23 17.5-32t36.5 0l66 26q19 8 26.5 22.5T790-595L655-265h-72Zm-268 0L180-595q-8-20-1.5-35.5T205-654l66-26q20-8 34.5-1t19.5 33l62 383h-72Zm-174 18q-35 13-56-8.5T84-317l85-175 83 205-111 40Zm296-18-66-428q-5-33 13-50t51-17h100q33 0 51 17t13 50l-66 428h-96Z"],
      ["egg", "ei", "M281.5-201.5Q200-283 200-400q0-77 25.5-155t66-141.5Q332-760 382-800t98-40q49 0 98.5 40t90 103.5Q709-633 734.5-555T760-400q0 117-81.5 198.5T480-120q-117 0-198.5-81.5ZM505-241q8.5 0 14.25-6t5.75-14q0-8-5.75-14T505-281q-58.33 0-99.17-40.83Q365-362.67 365-421q0-8.5-6-14.25T345-441q-8 0-14 5.75T325-421q0 74.7 52.65 127.35Q430.3-241 505-241Z"],
      ["restaurant", "uiteten restaurant", "M285-600v-250q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v250h65v-250q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v249.73q0 58.27-36.5 99.77Q397-459 345-448v338q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Q285-97.25 285-110v-338q-52-11-88.5-52.5T160-600.27V-850q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v250h65Zm415 200h-85q-12.75 0-21.37-8.63Q585-417.25 585-430v-275q0-69 42.5-122t98.5-53q14 0 24 10.13T760-846v736q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Q700-97.25 700-110v-290Z"],
      ["lunch_dining", "lunch hamburger", "M140-120q-25 0-42.5-17.5T80-180v-98q0-13 8.5-21.5T110-308h740q13 0 21.5 8.5T880-278v98q0 25-17.5 42.5T820-120H140Zm279.5-284Q400-382 346-382t-71.5-22Q257-426 216-426q-34 0-52.5 16.5T110-385q-12 2-21-6t-9-21q0-13 9-22.5t21-14.5q21-9 43-23t63-14q54 0 71.5 22t58.5 22q41 0 60.5-22t73.5-22q54 0 73.5 22t60.5 22q41 0 58.5-22t71.5-22q41 0 63 14t43 23q12 5 21 14.5t9 22.5q0 13-9 21t-21 6q-35-8-53.5-24.5T744-426q-41 0-58.5 22T614-382q-54 0-73.5-22T480-426q-41 0-60.5 22ZM626-825q72 15 128.5 46t91 78.5Q880-653 880-588q0 13-8.5 21.5T850-558H110q-13 0-21.5-8.5T80-588q0-65 34.5-112.5t91-78.5Q262-810 334-825t146-15q74 0 146 15Z"],
      ["local_pizza", "pizza", "M480-840q97 0 187 32t167 89q12 9 18.5 21.95t6.5 26.67q0 8.38-2.5 16.84-2.5 8.45-7.5 16.54L530-156q-9 13.5-22.5 20.25T479.88-129q-14.12 0-27.5-6.5T430-156L111-637q-5.38-8.25-7.69-16.5Q101-661.75 101-670q0-13.85 6.5-26.92Q114-710 126-719q77-57 167-89t187-32Zm-71 258.94q16-16.06 16-39T408.94-659q-16.06-16-39-16T331-658.94q-16 16.06-16 39T331.06-581q16.06 16 39 16T409-581.06Zm110 215q16-16.06 16-39T518.94-444q-16.06-16-39-16T441-443.94q-16 16.06-16 39T441.06-366q16.06 16 39 16T519-366.06Z"],
      ["ramen_dining", "ramen eten", "M316-158q-94-37-165-105.5T80-430q0-12.75 8.63-21.38Q97.25-460 110-460h50v-313q0-11.35 7.5-19.68Q175-801 186-802l666-74q11-2 19.5 5.31T880-852q0 10-6.5 17t-16.5 8l-447 49v87h445q10.83 0 17.92 7.12 7.08 7.11 7.08 18 0 10.88-7.08 17.88-7.09 7-17.92 7H410v181h440q12.75 0 21.38 8.62Q880-442.75 880-430q0 98-71.5 166T643-158v48q0 12.75-8.62 21.37Q625.75-80 613-80H346q-12.75 0-21.37-8.63Q316-97.25 316-110v-48Zm-6-533h50v-81l-50 5.31V-691Zm-100 0h50v-70l-50 5v65Zm100 231h50v-181h-50v181Zm-100 0h50v-181h-50v181Z"],
      ["takeout_dining", "afhaal bezorgen", "m192-565-92-97q-8-9-8-21t9-21q9-9 21.5-9t21.5 9l71 73-2-23q-2-14 2.5-26t14.5-22l118-120q8-8 19.5-13t23.5-5h178q12 0 23.5 5t19.5 13l118 120q10 10 14.5 22t2.5 26l-2 23 71-73q9-9 21.5-9t21.5 9q9 9 9 21t-8 21l-92 97H192Zm464 405H304q-23 0-40.5-16.5T244-216l-24-320h520l-24 320q-2 23-19.5 39.5T656-160Z"],
      ["moped", "bezorging scooter", "M192-234.5Q158-269 158-317h-48q-12.75 0-21.37-8.63Q80-334.25 80-347v-90q0-65 45-110.5T235-593h95q24.75 0 42.38 17.62Q390-557.75 390-533v156h161l147-185v-138h-93q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h93q24.75 0 42.38 17.62Q758-724.75 758-700v138q0 11-3.44 20.03-3.44 9.03-9.56 16.97L598-340q-8.07 10.73-20.53 16.87Q565-317 551-317H390q0 48-33.76 82.5-33.77 34.5-82 34.5Q226-200 192-234.5ZM313.5-277q16.5-17 16.5-40H218q0 23 16.5 40t39.5 17q23 0 39.5-17ZM360-653H230q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h130q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5Zm322 419.24q-34-33.77-34-82Q648-364 681.76-398q33.77-34 82-34Q812-432 846-398.24q34 33.77 34 82Q880-268 846.24-234q-33.77 34-82 34Q716-200 682-233.76Zm121.5-42.74Q820-293 820-316t-16.5-39.5Q787-372 764-372t-39.5 16.5Q708-339 708-316t16.5 39.5Q741-260 764-260t39.5-16.5Z"],
      ["local_cafe", "koffie cafe", "M190-120q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h580q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Zm121-140q-63 0-107-43.5T160-410v-370q0-24.75 17.63-42.38Q195.25-840 220-840h600q24.75 0 42.38 17.62Q880-804.75 880-780v160q0 24.75-17.62 42.37Q844.75-560 820-560h-96v150q0 63-44 106.5T573-260H311Zm413-360h96v-160h-96v160Z"],
      ["coffee", "koffie", "M442-242q-116 0-199-80t-83-195v-263q0-25 17.5-42.5T220-840h529q54 0 92.5 37t38.5 91q0 60-37 106t-94 46h-25v43q0 115-83 195t-199 80ZM220-620h444v-160H220v160Zm504 0h25q33 0 52-28.5t19-63.5q0-29-21-48.5T749-780h-25v160ZM190-120q-13 0-21.5-8.5T160-150q0-13 8.5-21.5T190-180h580q13 0 21.5 8.5T800-150q0 13-8.5 21.5T770-120H190Z"],
      ["local_bar", "bar borrel", "M450-180v-244L134-764q-6-6-9-14.5t-3-16.5q0-19 13-32t32-13h626q19 0 32 13t13 32q0 8-3 16.5t-9 14.5L510-424v244h180q13 0 21.5 8.5T720-150q0 13-8.5 21.5T690-120H270q-13 0-21.5-8.5T240-150q0-13 8.5-21.5T270-180h180ZM281-695h398l83-81H198l83 81Z"],
      ["sports_bar", "bier bar", "M250-180v-292q-52-14-91-53t-39-95q0-53 30.5-94.5T229-772q23-48 68.5-78T400-880q35 0 65.5 12t55.5 33q10-2 19-3.5t20-1.5q66 0 113 47t47 113q0 22-9 44t-23 36h92q25 0 42.5 17.5T840-540v280q0 25-17.5 42.5T780-200H670v20q0 25-17.5 42.5T610-120H310q-25 0-42.5-17.5T250-180Zm-70-440q0 38 31 64t69 26q32 0 58-17.5t53-50.5q23-28 55-50t74-22h140q0-45-26.5-77.5T560-780q-18 0-35.5 5.5L507-769l-19-16q-18-16-41-25.5t-47-9.5q-35 0-67 18t-47 50l-14 30-32 11q-26 9-43 36t-17 55Zm490 360h110v-280H670v280Z"],
      ["wine_bar", "wijn", "M450-180v-185q-99-14-154.5-79.7Q240-510.41 240-600v-210q0-12.75 8.63-21.38Q257.25-840 270-840h420q12.75 0 21.38 8.62Q720-822.75 720-810v210q0 89.59-55.5 155.3Q609-379 510-365v185h100q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H350q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h100ZM300-630h360v-150H300v150Z"],
      ["icecream", "ijs", "M120-555q0-45 27.5-88t80.5-58q16-99 88.5-159T480-920q91 0 163 60t89 159q53 15 80.5 58t27.5 88q0 75-56.5 117T664-408L506-94q-5 8-12 12.5T479-77q-8 0-15.5-4.5T452-94L298-408q-69 12-123.5-30T120-555Zm359 379 128-252-6-6q-28 15-60.5 22t-57.5 7q-32 0-65-7t-58-22l-6 5 125 253Z"],
      ["cake", "taart", "M160-80q-17 0-28.5-11.5T120-120v-219q0-24.75 17.63-42.38Q155.25-399 180-399h600q24.75 0 42.38 17.62Q840-363.75 840-339v219q0 17-11.5 28.5T800-80H160Zm47-379v-122q0-24.75 17.63-42.38Q242.25-641 267-641h183v-64q-20-14-30.5-30.53-10.5-16.54-10.5-39.88 0-14.59 5.5-28.09T430-827l39-41q1-1 11.29-5 1.71 0 10.71 5l39 41q10 10 16 23.5t6 28.09q0 23.34-11 39.88Q530-719 510-705v64h183q24.75 0 42.38 17.62Q753-605.75 753-581v122H207Z"],
      ["liquor", "drank", "M198-140v-141q-35-10-56.5-38.5T120-386v-304q0-13 8.5-21.5T150-720h156q13 0 21.5 8.5T336-690v304q0 35-21.5 65T258-281v141h48q13 0 21.5 8.5T336-110q0 13-8.5 21.5T306-80H150q-13 0-21.5-8.5T120-110q0-13 8.5-21.5T150-140h48Zm-18-359h96v-161h-96v161ZM520-80q-24 0-42-18t-18-42v-408q0-20 11-32t31-21l38-17q24-11 35-27t11-39v-161q0-16 9.5-25.5T621-880h94q16 0 25.5 9.5T750-845v161q0 23 13.5 39t37.5 27l38 17q19 8 30 20.5t11 32.5v408q0 24-18 42t-42 18H520Zm126-696h44v-44h-44v44ZM520-465h300v-83l-42-16q-40-15-64-49t-24-75v-28h-44v28q0 41-22.5 72T563-568l-43 20v83Zm0 325h300v-103H520v103Z"]
    ]],
    ["Zorg en verzorging", [
      ["favorite", "hart zorg liefde", "M458-144q-11-4-19-12l-53-49Q262-320 171-424.5T80-643q0-90 60.5-150.5T290-854q51 0 101 24.5t89 80.5q44-56 91-80.5t99-24.5q89 0 149.5 60.5T880-643q0 114-91 218.5T574-205l-53 49q-8 8-19 12t-22 4q-11 0-22-4Z"],
      ["health_and_safety", "zorg gezondheid", "M440-460v77q0 9 7 16t16 7h35q9 0 15.5-7t6.5-16v-77h78q9 0 15.5-7t6.5-16v-35q0-9-6.5-15.5T598-540h-78v-78q0-9-6.5-15.5T498-640h-35q-9 0-16 6.5t-7 15.5v78h-77q-9 0-16 6.5t-7 15.5v35q0 9 7 16t16 7h77Zm30.5 375q-4.5-1-9.5-3-139-47-220-168.5T160-523v-196q0-19 11-34.5t28-22.5l260-97q11-4 21-4t21 4l260 97q17 7 28 22.5t11 34.5v196q0 145-81 266.5T499-88q-5 2-9.5 3t-9.5 1q-5 0-9.5-1Z"],
      ["medical_services", "zorg dokter", "M140-80q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h180v-100q0-24 18-42t42-18h200q24 0 42 18t18 42v100h180q24 0 42 18t18 42v520q0 24-18 42t-42 18H140Zm240-640h200v-100H380v100Zm70 350v90q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-90h90q12.75 0 21.38-8.68 8.62-8.67 8.62-21.5 0-12.82-8.62-21.32-8.63-8.5-21.38-8.5h-90v-90q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v90h-90q-12.75 0-21.37 8.68-8.63 8.67-8.63 21.5 0 12.82 8.63 21.32 8.62 8.5 21.37 8.5h90Z"],
      ["local_hospital", "ziekenhuis", "M435-435v111q0 18.75 13.18 31.87 13.17 13.13 32 13.13Q499-279 512-292.13q13-13.12 13-31.87v-111h111q18.75 0 31.88-13.18 13.12-13.17 13.12-32Q681-499 667.88-512q-13.13-13-31.88-13H525v-111q0-18.75-13.18-31.88-13.17-13.12-32-13.12Q461-681 448-667.88q-13 13.13-13 31.88v111H324q-18.75 0-31.87 13.18-13.13 13.17-13.13 32Q279-461 292.13-448q13.12 13 31.87 13h111ZM180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Z"],
      ["medication", "medicijnen apotheek", "M440-380v80q0 16.67 11.74 28.33Q463.47-260 480.24-260q16.76 0 28.26-11.67Q520-283.33 520-300v-80h80q16.67 0 28.33-11.74Q640-403.47 640-420.24q0-16.76-11.67-28.26Q616.67-460 600-460h-80v-80q0-16.67-11.74-28.33Q496.53-580 479.76-580q-16.76 0-28.26 11.67Q440-556.67 440-540v80h-80q-16.67 0-28.33 11.74Q320-436.53 320-419.76q0 16.76 11.67 28.26Q343.33-380 360-380h80ZM260-120q-24.75 0-42.37-17.63Q200-155.25 200-180v-479q0-24.75 17.63-42.38Q235.25-719 260-719h440q24.75 0 42.38 17.62Q760-683.75 760-659v479q0 24.75-17.62 42.37Q724.75-120 700-120H260Zm10-660q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h420q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H270Z"],
      ["vaccines", "prik vaccinatie", "M250-290h-60q-24 0-42-18t-18-42v-320h-10q-13 0-21.5-8.5T90-700q0-13 8.5-21.5T120-730h130v-90h-30q-13 0-21.5-8.5T190-850q0-13 8.5-21.5T220-880h120q13 0 21.5 8.5T370-850q0 13-8.5 21.5T340-820h-30v90h130q13 0 21.5 8.5T470-700q0 13-8.5 21.5T440-670h-10v320q0 24-18 42t-42 18h-60v200q0 13-8.5 21.5T280-60q-13 0-21.5-8.5T250-90v-200Zm-60-60h180v-80h-80q-8 0-14-6t-6-14q0-8 6-14t14-6h80v-80h-80q-8 0-14-6t-6-14q0-8 6-14t14-6h80v-80H190v320ZM600-80q-24 0-42-18t-18-42v-266q0-32 8-48.5t21-30.5q19-20 25-31t6-24v-30h-10q-13 0-21.5-8.5T560-600q0-13 9-21.5t21-8.5h200q13 0 21.5 8.5T820-600q0 13-8.5 21.5T790-570h-10v30q0 12 7.5 25t26.5 33q13 14 19.5 29t6.5 47v266q0 24-18 42t-42 18H600Zm0-300h180v-26q0-18-10-32t-22-29q-15-19-21.5-35t-6.5-38v-30h-60v30q0 21-6 37t-21 35q-12 15-22.5 29.5T600-406v26Zm0 240h180v-80H600v80Z"],
      ["dentistry", "tandarts", "M680-875q66 0 113 47t47 113q0 11-1.5 29.5T834-643l-55 403q-5 41-36 63.5T677-154q-21 0-41-9t-34-29L495-348q-2-3-6.5-5t-9.5-2q-2 0-16 9L359-195q-14 21-35 31t-43 10q-35 0-65.5-22.5T180-241l-54-402q-3-24-4.5-42.5T120-715q0-66 47-113t113-47q36 0 57.5 9.5T379-845q20 11 42.5 20.5T480-815q36 0 58.5-9.5T581-845q20-11 42-20.5t57-9.5Z"],
      ["visibility", "bril ogen opticien", "M600.5-379.62q49.5-49.62 49.5-120.5T600.38-620.5Q550.76-670 479.88-670T359.5-620.38Q310-570.76 310-499.88t49.62 120.38q49.62 49.5 120.5 49.5t120.38-49.62Zm-200-41.12q-32.5-32.73-32.5-79.5 0-46.76 32.74-79.26 32.73-32.5 79.5-32.5 46.76 0 79.26 32.74 32.5 32.73 32.5 79.5 0 46.76-32.74 79.26-32.73 32.5-79.5 32.5-46.76 0-79.26-32.74ZM234.5-276Q124-352 57-470q-4-7.13-6-14.65-2-7.52-2-15.43 0-7.92 2-15.38 2-7.47 6-14.54 67-118 177.5-194T480-800q135 0 245.5 76T903-530q4 7.12 6 14.65 2 7.52 2 15.43 0 7.92-2 15.38-2 7.47-6 14.54-67 118-177.5 194T480-200q-135 0-245.5-76Z"],
      ["psychology", "psycholoog", "m446-418 2 30q.74 6.22 4.78 10.11 4.05 3.89 9.94 3.89h32.39q5.89 0 10.02-3.89 4.12-3.89 4.87-10.11l2-30q12-2 22.47-8.46Q544.94-432.92 553-441l30 10q5 2 10 0t7.8-6.85l15.4-26.3q2.8-4.85 2.3-9.85t-5.19-9.17L593-499q5-14 5-29t-5-29l20.31-15.83Q618-577 618.5-582t-2.3-9.85l-15.4-26.3Q598-623 593-625t-10 0l-30 10q-8.33-7.69-19.17-13.85Q523-635 512-638l-2-30q-.74-6.22-4.78-10.11-4.05-3.89-9.94-3.89h-32.39q-5.89 0-10.01 3.89-4.13 3.89-4.88 10.11l-2 30q-11 3-21.83 9.15Q413.33-622.69 405-615l-30-10q-5-2-10 0t-7.8 6.85l-15.4 26.3Q339-587 339.5-582t5.19 9.17L365-557q-5 14-5 29t5 29l-20.31 15.83Q340-479 339.5-474t2.3 9.85l15.4 26.3Q360-433 365-431t10 0l30-10q8.06 8.08 18.53 14.54Q434-420 446-418Zm-16.5-60.38q-20.5-20.38-20.5-49.5t20.38-49.62q20.38-20.5 49.5-20.5t49.62 20.38q20.5 20.38 20.5 49.5t-20.38 49.62q-20.38 20.5-49.5 20.5t-49.62-20.38ZM270-80q-12.75 0-21.37-8.63Q240-97.25 240-110v-142q-57-52-88.5-121.5T120-520q0-150 105-255t255-105q125 0 221.5 73.5T827-615l55 218q4 14-5 25.5T853-360h-93v140q0 24.75-17.62 42.37Q724.75-160 700-160H600v50q0 12.75-8.62 21.37Q582.75-80 570-80H270Z"],
      ["spa", "spa wellness", "M431-89q-135-32-232.5-134T83-499q-1-11 2-19.5T95-533q7-6 16-9.5t19-1.5q177 24 266.5 140T483-130q0 11-4 19t-12 14q-7 5-16 7.5t-20 .5Zm48-297q-22-38-60.5-82.5T337-530q2-64 35-152t78-157q6-9 14-13t16-4q8 0 16.5 4t13.5 13q46 69 78.5 157.5T623-530q-42 17-82.5 61.5T479-386Zm62 294q5-57-2.5-119.5T513-322q35-78 114.5-141T830-544q11-2 19.5 1.5T865-533q7 6 10.5 14.5T877-499q-17 171-112 271T541-92Z"],
      ["content_cut", "kapper knippen", "M481-415 364-298q11 17 13.5 33t2.5 35q0 64-43 107T230-80q-64 0-107-43T80-230q0-64 43-107t107-43q18 0 35.5 5t36.5 15l116-116-118-118q-17 8-34.5 11t-35.5 3q-64 0-107-43T80-730q0-64 43-107t107-43q64 0 107 43t43 107q0 19-2.5 36T367-662l468 468q23 23 10.5 51.5T801-114q-9 0-17.5-3.5T768-128L481-415Zm118-112-66-66 235-235q7-7 15.5-10.5T801-842q32 0 43.5 29T834-762L599-527ZM294-666q26-26 26-64t-26-64q-26-26-64-26t-64 26q-26 26-26 64t26 64q26 26 64 26t64-26Zm202.5 203.5Q502-468 502-476t-5.5-13.5Q491-495 483-495t-13.5 5.5Q464-484 464-476t5.5 13.5Q475-457 483-457t13.5-5.5ZM294-166q26-26 26-64t-26-64q-26-26-64-26t-64 26q-26 26-26 64t26 64q26 26 64 26t64-26Z"],
      ["face", "verzorging gezicht", "M315.5-398.73q-15.5-15.72-15.5-38.5 0-22.77 15.73-38.27 15.72-15.5 38.5-15.5 22.77 0 38.27 15.73 15.5 15.72 15.5 38.5 0 22.77-15.73 38.27-15.72 15.5-38.5 15.5-22.77 0-38.27-15.73Zm253 0q-15.5-15.72-15.5-38.5 0-22.77 15.73-38.27 15.72-15.5 38.5-15.5 22.77 0 38.27 15.73 15.5 15.72 15.5 38.5 0 22.77-15.73 38.27-15.72 15.5-38.5 15.5-22.77 0-38.27-15.73ZM480-140q142.38 0 241.19-98.95T820-480.47q0-25.53-4-50.53t-10-46q-20 5-43.26 7-23.26 2-48.74 2-97.11 0-183.56-40Q444-648 383-722q-34 81-97.5 141.5T140-487v7q0 142.37 98.81 241.19Q337.63-140 480-140Zm0 60q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"],
      ["soap", "zeep verzorging", "M230-80q-63 0-106.5-43.5T80-230v-216q0-28 13.5-53t36.5-40l304-196q11-8 21.5-4.5T474-728q14.81 14.93 17.41 35.47Q494-672 483-654l-59 94h346q12.75 0 21.38 8.62Q800-542.75 800-530q0 12-8.62 21-8.63 9-21.38 9H480v80h370q12.75 0 21.38 8.62Q880-402.75 880-390q0 12-8.62 21-8.63 9-21.38 9H480v80h330q12.75 0 21.38 8.62Q840-262.75 840-250q0 12-8.62 21-8.63 9-21.38 9H480v80h250q12.75 0 21.38 8.62Q760-122.75 760-110q0 12-8.62 21-8.63 9-21.38 9H230Zm357.5-597.6Q570-695.2 570-720.1t17.6-42.4q17.6-17.5 42.5-17.5t42.4 17.6q17.5 17.6 17.5 42.5t-17.6 42.4Q654.8-660 629.9-660t-42.4-17.6Zm77-157.02q-14.5-14.62-14.5-35.5 0-20.88 14.62-35.38 14.62-14.5 35.5-14.5 20.88 0 35.38 14.62 14.5 14.62 14.5 35.5 0 20.88-14.62 35.38-14.62 14.5-35.5 14.5-20.88 0-35.38-14.62Zm126 154.03q-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5t-49.41-20.59Z"],
      ["fitness_center", "sport fitness", "M268-650 147-529q-9 9-21 9t-21-9q-8-8-8.5-20.5T104-571l36-37-35-35q-9-9-9-21t9-21l64-64-21-21q-9-9-9-21t9-21q8-8 20.5-8.5T190-813l22 21 63-63q9-9 21-9t21 9l35 35 37-36q9-8 21-8t21 9q9 9 9 21t-9 21L310-692l382 382 121-121q9-9 21-9t21 9q8 8 8.5 20.5T856-389l-36 37 35 35q9 9 9 21t-9 21l-65 65 21 21q9 9 9 21t-9 21q-9 9-21 9t-21-9l-21-21-63 63q-9 9-21 9t-21-9l-35-35-37 36q-9 8-21 8t-21-9q-9-9-9-21t9-21l121-121-382-382Z"],
      ["self_improvement", "yoga ontspanning", "M261-160q-26 0-43-17t-17-43q0-18 9-34.5t26-23.5l172-68v-138q-60 73-121.5 114T150-322q-12 2-21-7t-9-22q0-12 8.5-21t20.5-11q58-7 107-37t89-81l58-65q10-12 23.5-20t29.5-8h48q16 0 30 8t24 20l58 65q42 49 90 80t105 38q12 2 20.5 11t8.5 21q0 13-9 22t-21 7q-75-7-136.5-48T552-484v138l172 68q17 7 26 23.5t9 34.5q0 26-17 43t-43 17H396v-11q0-26 16-42t42-16h133q8 0 14-6t6-14q0-8-6-14t-14-6H454q-44 0-70 27t-26 71v11h-97Zm167.5-515.5Q407-697 407-727t21.5-51.5Q450-800 480-800t51.5 21.5Q553-757 553-727t-21.5 51.5Q510-654 480-654t-51.5-21.5Z"],
      ["monitor_heart", "hartslag zorg", "M140-160q-24 0-42-18t-18-42v-200q0-13 8.5-21.5T110-450h191l72 144q4 8 11.5 12t15.5 4q8 0 15.5-4t11.5-12l133-266 53 106q4 8 11.5 12t15.5 4h210q13 0 21.5 8.5T880-420v200q0 24-18 42t-42 18H140ZM80-740q0-24 18-42t42-18h680q24 0 42 18t18 42v200q0 13-8.5 21.5T850-510H659l-72-143q-4-8-11.5-11.5T560-668q-8 0-15.5 3.5T533-653L400-388l-53-106q-4-8-11.5-12t-15.5-4H110q-13 0-21.5-8.5T80-540v-200Z"]
    ]],
    ["Kleding en spullen", [
      ["checkroom", "kleding", "M200-220h560L480-443 200-220Zm206-472q-3 8-10 13.5t-17 5.5q-13 0-21.5-8.5T349-703v-6q0-3 2-6 17-38 52-61.5t77-23.5q58 0 99 40.5t41 98.5q0 49-31 86.5T510-523v28l358 281q6 5 9 11t3 13q0 13-8.5 21.5T850-160H110q-13 0-21.5-8.5T80-190q0-7 3-13t9-11l358-281v-55q0-12 8.5-21t20.5-9q34 0 57.5-23.5T560-661q0-33-23.5-56T480-740q-24 0-44 13t-30 35Z"],
      ["apparel", "kleding shirt", "m250-569-63 35q-14 8-29.5 4.5T136-546L67-665q-8-14-4.5-24T79-707l228-133h64q11 0 17.5 6.5T395-816v15q0 38 24 62t62 24q38 0 61.5-24t23.5-62v-15q0-11 6.5-17.5T590-840h64l228 133q13 8 16 18t-4 24l-70 119q-6 13-25 17t-30-3l-62-39v412q0 16-12 27.5T667-120H289q-16 0-27.5-11.5T250-159v-410Z"],
      ["styler", "kleding", "M209-389h71v-21q0-13 8.5-21.5T310-440h340q13 0 21.5 8.5T680-410v21h71q11 0 20-7.5t9-18.5q0-9-5-16t-13-11L483-568 198-442q-8 4-13 11t-5 15q0 11 8.5 19t20.5 8ZM310-80q-13 0-21.5-8.5T280-110v-219h-71q-36 0-62.5-24.5T120-414q0-27 13.5-50.5T172-499l281-120v-42q-37-10-60.5-40.5T369-770q0-46 33-78t79-32q35 0 62.5 19t40.5 49q5 11 .5 22.5T569-773q-11 5-23 0t-17-16q-6-14-19-22.5t-29-8.5q-21 0-36.5 14.5T429-770q0 23 15.5 38.5T483-716q12 0 21 8.5t9 20.5v68l275 120q25 11 38.5 34.5T840-414q0 36-26.5 60.5T751-329h-71v219q0 13-8.5 21.5T650-80H310Z"],
      ["steps", "schoenen", "M216-570H86q4-17 10.5-32t17.5-29l154-206q17-23 45.5-30.5T368-861l28 14q21 11 32.5 30t11.5 42v84l74-19q30-8 58 7.5t38 44.5l65 196 170 170q20 20 27.5 43t7.5 49q0 40-23 70.5T798-87L347-518q-27-25-61-38.5T216-570ZM566-80q-30 0-57-11t-50-31L134-417q-21-19-33-43t-17-50h132q25 0 48.5 9.5T306-474L717-80H566Z"],
      ["diamond", "sieraden", "M358-625h244L497-840h-34L358-625Zm97 475v-425H101l354 425Zm50 0 354-425H505v425Zm153-475h209l-90-182q-8-15-22.5-24t-31.5-9H553l105 215Zm-565 0h209l105-215H237q-17 0-31.5 9T183-807L93-625Z"],
      ["watch", "horloge", "M412-80q-20 0-36.5-12T354-124l-25-91q-5-16-14.5-30.5T289-274q-42-37-65.5-90T200-480q0-62 23-115.5t65-90.5q16-14 26-29t15-30l25-91q5-20 21.5-32t36.5-12h136q20 0 36.5 12t21.5 32l25 91q5 16 15 30.5t26 28.5q42 36 65 89.5T760-480q0 62-23.5 115T671-274q-16 14-25.5 28.5T631-215l-25 91q-5 20-21.5 32T548-80H412Zm224-244q64-64 64-156t-64-156q-64-64-156-64t-156 64q-64 64-64 156t64 156q64 64 156 64t156-64Z"],
      ["shopping_bag", "winkelen tas", "M220-80q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h110v-10q0-63 43.5-106.5T480-880q63 0 106.5 43.5T630-730v10h110q24 0 42 18t18 42v520q0 24-18 42t-42 18H220Zm170-640h180v-10q0-38-26-64t-64-26q-38 0-64 26t-26 64v10Zm231.5 171.5Q630-557 630-570v-90h-60v90q0 13 8.5 21.5T600-540q13 0 21.5-8.5Zm-240 0Q390-557 390-570v-90h-60v90q0 13 8.5 21.5T360-540q13 0 21.5-8.5Z"],
      ["storefront", "winkel", "M179-120q-24 0-42-18t-18-42v-339q-28-24-37-59t2-70l43-135q8-27 28-42t46-15h553q28 0 49 15.5t29 41.5l44 135q11 35 1.5 70T840-519v339q0 24-18 42t-42 18H179Zm391-430q29 0 49-19t16-46l-25-165H510v165q0 26 17 45.5t43 19.5Zm-187 0q28 0 47.5-19t19.5-46v-165H350l-25 165q-4 26 14 45.5t44 19.5Zm-182 0q24 0 41.5-16.5T263-607l26-173H189l-46 146q-10 31 8 57.5t50 26.5Zm557 0q32 0 50.5-26t8.5-58l-46-146H671l26 173q3 24 20.5 40.5T758-550Z"],
      ["local_mall", "winkelen", "M180-80q-24 0-42-18t-18-42v-530q0-24 18-42t42-18h110q0-79 53-134.5T475-920q79 0 137 55.5T670-730h110q24 0 42 18t18 42v530q0 24-18 42t-42 18H180Zm170-650h260q0-55-37.5-92.5T480-860q-55 0-92.5 37.5T350-730Zm130 300q73 0 133-51.5T673-597q0-11-9-19.5t-22-8.5q-11 0-19.5 7.5T612-598q-10 47-47.5 77.5T480-490q-47 0-84.5-30.5T348-598q-2-12-11-19.5t-20-7.5q-12 0-21 8.5t-9 19.5q0 64 59.5 115.5T480-430Z"],
      ["devices", "apparaten", "M471-160H110q-13 0-21.5-8.5T80-190q0-13 8.5-21.5T110-220h361q13 0 21.5 8.5T501-190q0 13-8.5 21.5T471-160ZM180-280q-24 0-42-18t-18-42v-400q0-24 18-42t42-18h600q24 0 42 18t18 42H606q-42 0-73.5 31.5T501-635v325q0 13-8.5 21.5T471-280H180Zm426 120q-18 0-31.5-13.5T561-205v-430q0-18 13.5-31.5T606-680h229q18 0 31.5 13.5T880-635v430q0 18-13.5 31.5T835-160H606Zm115-360q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Z"],
      ["mobile", "telefoon mobiel", "M260-40q-25 0-42.5-17.5T200-100v-760q0-24 18-42t42-18h438q25 0 42.5 17.5T758-860v150q18 3 30 17t12 32v74q0 19-12 33t-30 17v437q0 25-17.5 42.5T698-40H260Zm240-689q9-9 9-21t-9-21q-9-9-21-9t-21 9q-9 9-9 21t9 21q9 9 21 9t21-9Z"],
      ["computer", "computer laptop", "M70-120q-13 0-21.5-8.5T40-150q0-13 8.5-21.5T70-180h820q13 0 21.5 8.5T920-150q0 13-8.5 21.5T890-120H70Zm70-120q-24 0-42-18t-18-42v-480q0-24 18-42t42-18h680q24 0 42 18t18 42v480q0 24-18 42t-42 18H140Z"],
      ["headphones", "koptelefoon muziek", "M268-120h-88q-24 0-42-18t-18-42v-300q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v300q0 24-18 42t-42 18h-88q-25 0-42.5-17.5T632-180v-176q0-25 17.5-42.5T692-416h88v-64q0-125-87.5-212.5T480-780q-125 0-212.5 87.5T180-480v64h88q25 0 42.5 17.5T328-356v176q0 25-17.5 42.5T268-120Z"],
      ["photo_camera", "camera foto", "M480-267q72 0 121-49t49-121q0-73-49-121.5T480-607q-73 0-121.5 48.5T310-437q0 72 48.5 121T480-267Zm0-60q-48 0-79-31.5T370-437q0-48 31-79t79-31q47 0 78.5 31t31.5 79q0 47-31.5 78.5T480-327ZM140-120q-24 0-42-18t-18-42v-513q0-23 18-41.5t42-18.5h147l55-66q8-11 20-16t26-5h184q14 0 26 5t20 16l55 66h147q23 0 41.5 18.5T880-693v513q0 24-18.5 42T820-120H140Z"],
      ["tv", "tv televisie", "M140-200q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H630v50q0 13-8.5 21.5T600-120H360q-13 0-21.5-8.5T330-150v-50H140Z"],
      ["videogame_asset", "games spelletjes", "M140-240q-24 0-42-18t-18-42v-360q0-24 18-42t42-18h680q24 0 42 18t18 42v360q0 24-18 42t-42 18H140Zm150-210v74q0 13 8.5 21.5T320-346q13 0 21.5-8.5T350-376v-74h74q13 0 21.5-8.5T454-480q0-13-8.5-21.5T424-510h-74v-74q0-13-8.5-21.5T320-614q-13 0-21.5 8.5T290-584v74h-74q-13 0-21.5 8.5T186-480q0 13 8.5 21.5T216-450h74Zm334.5 72.5Q638-391 638-409t-13.5-31.5Q611-454 593-454t-31.5 13.5Q548-427 548-409t13.5 31.5Q575-364 593-364t31.5-13.5Zm90-143Q728-534 728-552t-13.5-31.5Q701-597 683-597t-31.5 13.5Q638-570 638-552t13.5 31.5Q665-507 683-507t31.5-13.5Z"],
      ["print", "printer", "M302-120q-24.75 0-42.37-17.63Q242-155.25 242-180v-116H140q-24.75 0-42.37-17.63Q80-331.25 80-356v-186q0-45.05 30.5-75.53Q141-648 186-648h588q45.05 0 75.53 30.47Q880-587.05 880-542v186q0 24.75-17.62 42.37Q844.75-296 820-296H718v116q0 24.75-17.62 42.37Q682.75-120 658-120H302Zm416-558H242v-102q0-24.75 17.63-42.38Q277.25-840 302-840h356q24.75 0 42.38 17.62Q718-804.75 718-780v102Zm21 185q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9ZM302-180h356v-192H302v192Z"]
    ]],
    ["Vrije tijd", [
      ["sunny", "zon vrije tijd", "M458.5-778.63Q450-787.25 450-800v-90q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v90q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM685-685q-9-9-9-21.1 0-12.1 9-20.9l63-64q9.07-9 21.53-9 12.47 0 21.47 9 9 9 9 21t-9 21l-64 64q-9 9-21 9t-21-9Zm115 235q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h90q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5h-90ZM458.5-48.63Q450-57.25 450-70v-90q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v90q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM233-685l-64-63q-9-8.87-9-21.43 0-12.57 9.39-21.57 8.61-9 20.61-9t21 9l64 64q9 9 9 21t-9 21q-9.27 8-21.64 8-12.36 0-20.36-8Zm516 516-64-64q-9-8.8-9-20.9 0-12.1 9-21.1 8.25-8 20.63-8 12.37 0 21.37 8l65 63q9 9 8.63 21.6-.37 12.61-8.53 21.5-8.89 8.9-21.5 8.9-12.6 0-21.6-9ZM70-450q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32Q57.25-510 70-510h90q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H70Zm99 280.61q-9-8.61-9-20.61t9-21l64-64q8.25-8 20.63-8 12.37 0 21.37 8.25 9 9 9 21.37 0 12.38-9 21.38l-63 63q-8.87 9-21.43 9-12.57 0-21.57-9.39ZM310-310q-70-70-70-170t70-170q70-70 170-70t170 70q70 70 70 170t-70 170q-70 70-170 70t-170-70Z"],
      ["beach_access", "strand vakantie", "M772-151 555-368q-10-10-10-23t10-23q10-10 23-10t23 10l217 217q10 10 10 23t-10 23q-10 10-23 10t-23-10Zm-519-51q-12 12-27.5 11T200-205q-70-95-78.5-210.5T166-633q2 33 14.5 73.5T216-475q23 44 55 91t72 92l-90 90Zm131-131q-49-50-85-106.5t-54.5-109Q226-601 226-645t22-68q24-26 69.5-27T418-723q55 18 113 53.5T636-585L384-333Zm380-436q13 10 14 25.5T767-716l-90 90q-44-40-90.5-72t-92-54.5Q449-775 407-787t-76-13q103-55 220-47.5T764-769Z"],
      ["luggage", "koffer vakantie reizen", "M260-120q-24.75 0-42.37-17.63Q200-155.25 200-180v-480q0-24.75 17.63-42.38Q235.25-720 260-720h105v-100q0-24.75 17.63-42.38Q400.25-880 425-880h110q24.75 0 42.38 17.62Q595-844.75 595-820v100h105q24.75 0 42.38 17.62Q760-684.75 760-660v480q0 24.75-17.62 42.37Q724.75-120 700-120q0 17-11.5 28.5T660-80q-17 0-28.5-11.5T620-120H340q0 17-11.5 28.5T300-80q-17 0-28.5-11.5T260-120Zm113.5-471.38Q365-582.75 365-570v300q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-300q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62Zm170 0Q535-582.75 535-570v300q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-300q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62ZM425-720h110v-100H425v100Z"],
      ["travel", "reizen", "M448-548 178-663q-19.89-9.35-24.44-30.17Q149-714 164.74-730.29L178-744q8-8 17.53-10.5 9.53-2.5 19.47-.5l374 65 133-133q21-21 50.5-21t50.5 21q21 21 21 50.5T823-722L690-589l65 374q2 9.67-.5 19.33Q752-186 744-178l-13.71 12.79Q714-149 693-153.5T663-178L548-448 427-326l23 131q2 8.36-.67 16.3-2.66 7.94-8.5 13.79l-14.16 14.21Q415-139 398.12-141.5 381.24-144 373-159l-74-140-140-74q-15-8.24-17.5-25.12-2.5-16.88 9.2-28.55l14.21-14.16q5.85-5.84 13.79-8.5 7.94-2.67 16.3-.67l131 23 122-121Z"],
      ["hotel", "hotel", "M69.82-200Q57-200 48.5-208.63 40-217.25 40-230v-525q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v364h353v-249q0-24.75 17.63-42.38Q488.25-700 513-700h262q59.81 0 102.41 42.59Q920-614.81 920-555v325q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37v-101H100v101q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63ZM194.5-479.5Q164-510 164-555t30.5-75.5Q225-661 270-661t75.5 30.5Q376-600 376-555t-30.5 75.5Q315-449 270-449t-75.5-30.5Z"],
      ["camping", "kamperen", "M80-110v-133q0-10 3-19t9-17l351-475-49-65q-2-3 5-14.5t13-21.5q6-10 6-14.5t-17 7.5q10-8 22-5.5t20 12.5l37 51 38-52q8-10 20-12t22 6q10 8 12 20t-6 22l-48 66 350 475q6 8 9 17t3 19v133q0 13-8.5 21.5T850-80H110q-13 0-21.5-8.5T80-110Zm242-30h316L480-361 322-140Z"],
      ["hiking", "wandelen", "M420-379 351-65q-2 11-11 18t-20 7q-15 0-24.5-11.5T289-77l114-583q5-24 23-37t38-13q20 0 37.5 9t28.5 26l39 64q19 32 52.5 57t78.5 39v-55q0-8 6-14t14-6q8 0 14 6t6 14v510q0 8-6 14t-14 6q-8 0-14-6t-6-14v-394q-51-11-96-39t-80-69l-29 145 76 72q5 5 7 10.5t2 11.5v253q0 13-8.5 21.5T550-40q-13 0-21.5-8.5T520-70v-214l-100-95Zm-150-69-46-9q-12-2-18.5-12.5T201-492l30-157q5-29 31-44.5t57-9.5q12 2 19 13t5 23l-38 195q-2 12-12.5 19t-22.5 5Zm208.5-327.5Q457-797 457-827t21.5-51.5Q500-900 530-900t51.5 21.5Q603-857 603-827t-21.5 51.5Q560-754 530-754t-51.5-21.5Z"],
      ["map", "kaart uitjes", "m592-127-243-86-188 75q-8 3-15 1.5t-13-5.5q-6-4-9.5-10t-3.5-14v-565q0-13 7.5-23t19.5-15l182-64q5-2 10-2.5t10-.5q5 0 10 .5t10 2.5l243 85 187-75q8-3 15-2t13 5q6 4 9.5 10.5T840-795v572q0 11-7.5 19T814-192l-182 65q-5 2-10 2.5t-10 .5q-5 0-10-.5t-10-2.5Zm-14-68v-505l-196-66v505l196 66Z"],
      ["attractions", "pretpark", "m257-116 36-83q-17-12-30.5-23.5T235-248q-8 4-17.5 6t-17.5 2q-32 0-54.5-22.5T123-317q0-20 9.5-37.5T156-380q-7-25-11-50t-4-51q0-27 3.5-51.5T156-582q-14-10-23.5-26.5T123-645q0-32 22.5-54.5T200-722q8 0 17 2t17 6q35-36 76.5-60t92.5-37q5-32 26.5-50.5T480-880q29 0 51 19t26 50q51 13 96 34.5t79 59.5q7-2 14-3.5t14-1.5q32 0 54.5 22.5T837-645q0 22-9.5 38T804-582q8 26 11.5 50t3.5 51q0 26-3.5 50.5T804-381q17 11 25 29t8 35q0 32-22.5 54.5T760-240q-8 0-17.5-2t-16.5-6q-13 14-27 26t-30 23l36 83q5 13-2.5 24.5T680-80q-8 0-14.5-4T656-95l-35-77q-17 6-32 11t-32 10q-5 33-26.5 51T480-82q-29 0-50.5-18T403-151q-17-5-32.5-10T341-173l-37 78q-3 7-9.5 11T280-80q-14 0-21-11.5t-2-24.5Zm58-134 71-155q-14-16-21-34.5t-7-40.5q0-50 37.5-86t87.5-36q50 0 84.5 36t34.5 86q0 22-6.5 40.5T574-405l71 155q11-8 22.5-17.5T689-288q-2-6-4-13.5t-2-15.5q0-32 17.5-55t50.5-21q7-20 10.5-42.5T765-481q0-24-3.5-45.5T752-568q-30-4-49.5-26T683-645q0-9 1.5-16t4.5-15q-32-31-67-51t-79-32q-8 13-24.5 23T480-726q-22 0-38-10t-25-23q-44 12-80.5 32T271-674q4 8 5 14.5t1 14.5q0 32-20.5 52.5T209-568q-7 20-10.5 41.5T195-481q0 23 3.5 45t10.5 42q32 6 50 28t18 49q0 9-1.5 16t-3.5 12q10 11 20.5 20.5T315-250Zm45 27q12 5 26.5 10.5T417-203q11-14 26-23.5t37-9.5q22 0 38.5 9.5T543-203q17-4 30.5-9t24.5-10l-65-151q-12 8-26 11.5t-28 3.5q-14 0-28-4t-26-12l-65 151Z"],
      ["theater_comedy", "theater", "M275-80q-97 0-166-70.5T40-315v-207q0-24.75 17.63-42.38Q75.25-582 100-582h349q24.75 0 42.38 17.62Q509-546.75 509-522v207q0 94-68.25 164.5T275-80Zm-86-306q13.6 0 22.8-9.2 9.2-9.2 9.2-22.8 0-13.6-9.2-22.8-9.2-9.2-22.8-9.2-13.6 0-22.8 9.2-9.2 9.2-9.2 22.8 0 13.6 9.2 22.8 9.2 9.2 22.8 9.2Zm196-9.2q9-9.2 9-22.8 0-13.6-9.2-22.8-9.2-9.2-22.8-9.2-13.6 0-22.8 9.2-9.2 9.2-9.2 22.8 0 13.6 9 22.8 9 9.2 23 9.2t23-9.2ZM920-821v217q0 95-68.25 160T686-379q-23 0-44.5-3.5T599-394q-17-6-28.5-19.85Q559-427.69 559-445v-96q0-35.35-22.81-61.68Q513.39-629 478-629q-12 0-20.5-9t-8.5-21v-162q0-24.75 17.63-42.38Q484.25-881 509-881h351q24.75 0 42.38 17.62Q920-845.75 920-821ZM601-676q13.6 0 22.8-10 9.2-10 9.2-22 0-13.6-9.2-22.8-9.2-9.2-22.8-9.2-13.6 0-22.8 9.2-9.2 9.2-9.2 22.8 0 12 9.2 22t22.8 10Zm172 0q13.6 0 22.8-10 9.2-10 9.2-22 0-13.6-9.2-22.8-9.2-9.2-22.8-9.2-13.6 0-22.8 9.2-9.2 9.2-9.2 22.8 0 12 9.2 22t22.8 10Zm-142.5 85q-26.5 9-42.5 32-6 10 1 19.5t19.86 9.5h154.28q12.86 0 19.86-9.5t1-19.5q-16-23-42.5-32t-55.5-9q-29 0-55.5 9Zm-298 351q26.5-9 42.5-32 6-9.67-1-19.33-7-9.67-19.56-9.67H199.56Q187-301 180-291.33q-7 9.66-1 19.33 16 23 42.5 32t55.5 9q29 0 55.5-9Z"],
      ["movie", "film bioscoop", "m140-800 58 119q8 15 22 24t31 9q32 0 49-27.5t3-56.5l-33-68h89l58 119q8 15 22 24t31 9q32 0 49-27.5t3-56.5l-33-68h89l58 119q8 15 22 24t31 9q32 0 49-27.5t3-56.5l-33-68h112q24 0 42 18t18 42v520q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-520q0-24 18-42t42-18Z"],
      ["music_note", "muziek", "M286.5-163.5Q243-207 243-270t43.5-106.5Q330-420 393-420q28 0 50.5 8t39.5 22v-420q0-13 8.5-21.5T513-840h174q13 0 21.5 8.5T717-810v75q0 13-8.5 21.5T687-705H543v435q0 63-43.5 106.5T393-120q-63 0-106.5-43.5Z"],
      ["stadium", "concert festival", "M158-723v-96q0-8 7-12.5t15-.5l95 48q8 5 8 13t-8 13l-95 48q-8 4-15-.5t-7-12.5Zm540 0v-96q0-8 7-12.5t15-.5l95 48q8 5 8 13t-8 13l-95 48q-8 4-15-.5t-7-12.5Zm-252-36v-96q0-8 7-12.5t15-.5l95 48q8 5 8 13t-8 13l-95 48q-8 4-15-.5t-7-12.5ZM345-86q-102-10-183.5-40T80-200v-360q0-25 31.5-46.5t85.5-38q54-16.5 127-26t156-9.5q83 0 156 9.5t127 26q54 16.5 85.5 38T880-560v360q0 45-82 74.5T614-86q-10 1-17-5.5t-7-16.5v-62q0-46-32-78t-78-32q-46 0-78 32t-32 78v61q0 10-7.5 17T345-86Zm135-414q97 0 172.5-14.5T800-558q-23-24-107.5-43T480-620q-128 0-212.5 19T160-558q72 29 147.5 43.5T480-500Z"],
      ["confirmation_number", "ticket kaartjes", "M140-160q-25 0-42.5-17.5T80-220v-132q0-10 5.5-17.5T100-380q31-11 48.5-39.5T166-480q0-31-17.5-60T100-580q-9-3-14.5-10.5T80-608v-132q0-25 17.5-42.5T140-800h680q25 0 42.5 17.5T880-740v132q0 10-5.5 17.5T860-580q-31 11-48.5 40T794-480q0 32 17.5 60.5T860-380q9 3 14.5 10.5T880-352v132q0 25-17.5 42.5T820-160H140Zm340-123q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Zm0-167q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Zm0-167q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Z"],
      ["museum", "museum", "M80-80v-60h83v-411h-54q-12.35 0-20.68-9Q80-569 80-581q0-8.31 3.67-15.23Q87.33-603.15 94-608l351-248q8-5 16.81-8 8.81-3 18-3t18.19 3q9 3 17 8l351 248q6.67 4.9 10.33 12.25Q880-588.4 880-580q0 12.35-8.32 20.68Q863.35-551 851-551h-53v411h82v60H80Zm295.5-169.63q8.5-8.62 8.5-21.37v-154l71 107q5 7 11 10.5t14 3.5q8 0 14-3t11-10l72-108v154q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-217q0-11.45-7.77-19.23Q621.45-515 610-515h-23.4q-6.46 0-12.51 3.2T564-503l-84 128-83-126q-5-7-11.75-10.5T371-515h-15.14q-13.54 0-22.7 9.2T324-483v212q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63Z"],
      ["palette", "kunst schilderen", "M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-84 32-157t87.5-127q55.5-54 130-85T489-880q79 0 150 26.5T763.5-780q53.5 47 85 111.5T880-527q0 108-63 170.5T650-294h-75q-18 0-31 14t-13 31q0 20 14.5 38t14.5 43q0 26-24.5 57T480-80ZM282-469q15-15 15-35t-15-35q-15-15-35-15t-35 15q-15 15-15 35t15 35q15 15 35 15t35-15Zm126-170q15-15 15-35t-15-35q-15-15-35-15t-35 15q-15 15-15 35t15 35q15 15 35 15t35-15Zm214 0q15-15 15-35t-15-35q-15-15-35-15t-35 15q-15 15-15 35t15 35q15 15 35 15t35-15Zm131 170q15-15 15-35t-15-35q-15-15-35-15t-35 15q-15 15-15 35t15 35q15 15 35 15t35-15Z"],
      ["brush", "kunst", "M215-117q-34 0-67-11.5T90-166q35-12 50-35t15-62q0-44 30.5-74.5T260-368q44 0 74.5 30.5T365-263q0 64-43.5 105T215-117Zm230-237-90-95 376-376q14-14 31-14.5t32 14.5l29 29q15 15 14.5 32.5T823-732L445-354Z"],
      ["menu_book", "boeken lezen", "M512-250q50-25 98-37.5T712-300q38 0 78.5 6t69.5 16v-429q-34-17-72-25t-76-8q-54 0-104.5 16.5T512-677v427Zm-44.5 77.5Q461-174 456-178q-47-29-100-45t-108-16q-37 0-72 9t-70 22q-23 11-44.5-3T40-251v-463q0-15 7-27.5T68-761q42-20 87.5-29.5T248-800q63 0 122.5 17T482-731q51-35 109.5-52T712-800q47 0 92 9.5t87 29.5q14 7 21.5 19.5T920-714v463q0 28-22.5 42.5t-44.5.5q-34-14-69-22.5t-72-8.5q-54 0-106 16t-98 45q-5 4-11.5 5.5T482-171q-8 0-14.5-1.5ZM560-608q0-6 4-11.5t9-7.5q30-11 61.5-17t65.5-6q22 0 43 2.5t41 7.5q6 2 11 7.5t5 12.5q0 11-7.5 17t-18.5 3q-17-5-35.5-7.5T700-610q-29 0-56 5.5T591-588q-14 5-22.5-.5T560-608Zm0 220q0-6 4-12t9-8q30-11 61.5-16.5T700-430q22 0 43 2.5t41 7.5q6 2 11 7.5t5 12.5q0 11-7.5 17t-18.5 3q-17-5-35.5-7.5T700-390q-29 0-56 5t-53 16q-14 5-22.5 0t-8.5-19Zm0-110q0-6 4-11.5t9-7.5q30-11 61.5-17t65.5-6q22 0 43 2.5t41 7.5q6 2 11 7.5t5 12.5q0 11-7.5 17t-18.5 3q-17-5-35.5-7.5T700-500q-29 0-56 5.5T591-478q-14 5-22.5-.5T560-498Z"],
      ["auto_stories", "boeken", "M467-172.5q-6-1.5-11-5.5-44-29-93.5-45.5T260-240q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740v506q51-33 107-49.5T700-300q36 0 78.5 7t81.5 29v-505q10 4 19.5 8t18.5 9q10 6 16 15.5t6 20.5v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-53 0-102.5 16.5T504-178q-5 4-11 5.5t-13 1.5q-7 0-13-1.5ZM565-349q-8 6-16.5 2.5T540-360v-314q0-3 1-5.5t3-4.5l230-230q7-7 16.5-3.5T800-904v344q0 3-1.5 6t-3.5 5L565-349Z"],
      ["sports_soccer", "voetbal sport", "M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480.5q0-82.5 31.5-155t86-127Q252-817 325-848.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127t31.5 155q0 82.5-31.5 155.5t-86 127.5q-54.5 54.5-127 86T480-80Zm205-493 69-24 18-64q-34-53-84-90.5T575-809l-65 43v70l175 123Zm-409 0 174-123v-70l-64-43q-63 20-113 57.5T189-661l22 64 65 24Zm-54 320 60-7 39-65-62-191-71-24-48 39q0 72 16 131.5T222-253Zm312.5 108q27.5-5 57.5-13l33-72-32-55H368l-32 55 33 72q26 8 55 13t56 5q27 0 54.5-5ZM374-345h208l61-183-163-117-166 117 60 183Zm365 92q49-57 65-116.5T820-501l-48-33-70 18-62 191 38 65 61 7Z"],
      ["sports_tennis", "tennis", "M520-392q-89 0-139.5 13T297-333L144-180q-9 9-21 8.5t-21-9.5q-9-9-9-21.5t9-21.5l152-152q33-33 47-82.5T315-597q0-57 25-112t76-106q88-88 193-100t173 56q68 68 56 174T738-491q-51 51-106 75t-112 24Zm-107-99q49 49 133 36.5T697-534q67-67 80-149.5T741-815q-49-49-132.5-36.5T458-772q-67 67-80.5 149.5T413-491ZM634-82q-42-42-42-102t42-102q42-42 102-42t102 42q42 42 42 102T838-82q-42 42-102 42T634-82Z"],
      ["pool", "zwemmen", "M480-162q-38 0-66.5 21T343-120q-42 0-71-21t-67-21q-28 0-49 12.5T112-128q-11 5-21.5-2.5T80-152q0-14 9-24.5t22-15.5q21-9 40-20t54-11q46 0 75 21.5t67 21.5q38 0 62.5-21.5T480-223q46 0 75 21.5t67 21.5q38 0 63-21.5t71-21.5q35 0 54 11t39 20q13 5 22 15.5t9 24.5q0 14-10.5 21.5T848-128q-23-9-43-21.5T756-162q-38 0-65 21t-69 21q-42 0-73-21t-69-21Zm0-188q-38 0-64.5 21T347-308q-42 0-73-21t-69-21q-29 0-50.5 13T110-315q-11 5-20.5-3T80-338q0-13 9-22.5t21-14.5q21-8 40.5-19.5T205-406q46 0 73 19t65 19q38 0 64.5-19t72.5-19q46 0 73 19t65 19q38 0 65-19t73-19q35 0 54.5 11.5T851-375q12 5 20.5 14.5T880-338q0 12-9 20t-20 3q-23-9-44.5-22T756-350q-38 0-65 21t-69 21q-42 0-73-21t-69-21ZM288-516l135-135-54-54q-27-27-54-39t-64-16q-17-2-28.5-13.5T211-802q0-17 11.5-28t28.5-9q54 5 93 23t76 55l253 253q-11 9-25.5 13t-29.5 4q-38 0-65.5-21T480-533q-45 0-72 21t-65 21q-18 0-32.5-7T288-516Zm447.5-293.5Q763-782 763-742t-27.5 67.5Q708-647 668-647t-67.5-27.5Q573-702 573-742t27.5-67.5Q628-837 668-837t67.5 27.5Z"],
      ["downhill_skiing", "skien wintersport", "M741-40q-24 0-48-4t-47-11L99-254q-8-3-11.5-10.5T87-280q3-8 10.5-11.5t15.5-.5l270 98 70-181-159-166q-23-26-18-59t34-50l155-90q14-8 30-8.5t30 4.5q14 5 25.5 16t16.5 26l13 43q17 54 49.5 87t79.5 49l15-46q2-8 9-11.5t15-1.5q8 2 12 9.5t2 15.5l-33 102q-68-14-119-54t-78-108l-132 76 112 131q5 6 7 14.5t-1 16.5l-79 205 143 52 94-292q10 3 19 5.5t18 4.5l-94 296 41 14q19 7 39 10.5t42 3.5q24 0 46-3.5T830-95q8-3 16-.5T856-85q3 9-1.5 17T841-57q-24 8-49 12.5T741-40ZM616.5-735.5Q595-757 595-787t21.5-51.5Q638-860 668-860t51.5 21.5Q741-817 741-787t-21.5 51.5Q698-714 668-714t-51.5-21.5Z"],
      ["celebration", "feest", "m101-140 149-416q4-10 11.5-15t16.5-5q5 0 10.5 2t10.5 7l270 266q5 5 7 10.5t2 11.5q0 9-5 16.5T558-251L140-101q-9 3-17.5 1t-14.5-8q-6-6-8-14.5t1-17.5Zm824-546q-7 7-17 7t-17-7l-2-2q-19-19-44-19.5T800-688L574-462q-7 7-17 7t-17-7q-7-7-7-17t7-17l223-223q32-32 81-32.5t81 31.5q7 7 7 17t-7 17ZM383-811q7-7 17-7t17 7l9 9q35 35 34.5 87.5T425-627l-10 10q-7 7-17 7t-17-7q-7-7-7-17t7-17l13-13q23-23 21.5-52.5T394-766l-11-11q-7-7-7-17t7-17Zm169-73q7-7 17-7t17 7l46 46q31 32 32 80.5T633-677L496-540q-7 7-17 7t-17-7q-7-7-7-17t7-17l135-135q19-19 18.5-48.5T596-806l-44-44q-7-7-7-17t7-17Zm300 505q-7 7-17 7t-17-7l-35-35q-23-23-48-23t-48 23l-33 33q-7 7-17 7t-17-7q-7-7-7-17t7-17l30-30q35-35 84-36t84 34l34 34q7 7 7 17t-7 17Z"],
      ["redeem", "cadeau", "M140-277v97h680v-97H140Zm0-443h125q-5-9-8-22.5t-3-24.5q0-47 33-80t79-33q31 0 57 15.5t41 39.5l16 26 17-26q16-25 41-40t54-15q48 0 81 32.5t33 80.5q0 11-2.5 22t-7.5 25h124q24 0 42 18t18 42v480q0 24-18 42t-42 18H140q-24 0-42-18t-18-42v-480q0-24 18-42t42-18Zm0 336h680v-276H571l83 115q8 10 5.5 22T647-503q-10 8-22 6t-20-13L480-683 355-510q-8 11-19.5 13t-22.5-6q-10-8-12.5-20t5.5-22l83-115H140v276Zm264.5-345.5Q420-745 420-767t-15.5-37.5Q389-820 367-820t-37.5 15.5Q314-789 314-767t15.5 37.5Q345-714 367-714t37.5-15.5ZM592-714q23 0 38.5-15.5T646-767q0-22-15.5-37.5T592-820q-21 0-36.5 15.5T540-767q0 22 15.5 37.5T592-714Z"],
      ["casino", "spel loterij", "M335.5-264.62q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm0-360q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm180 180q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm180 180q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm0-360q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62ZM180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Z"],
      ["extension", "puzzel hobby", "M191-120q-29 0-50-21t-21-51v-121q0-8 5-13t13-7q45-9 75.5-43t30.5-82q0-48-30-82.5T139-583q-8-2-13-7t-5-13v-126q0-30 20.5-50.5T192-800h136q7-49 44-82t87-33q49 0 86 33t45 82h139q30 0 50.5 20.5T800-729v147q38 18 60.5 49.5T883-458q0 43-22.5 75T800-334v142q0 30-20.5 51T729-120H191Z"],
      ["pets", "huisdier dier", "M169.86-485Q132-485 106-511.14t-26-64Q80-613 106.14-639t64-26Q208-665 234-638.86t26 64Q260-537 233.86-511t-64 26ZM291-681.14q-26-26.14-26-64T291.14-809q26.14-26 64-26T419-808.86q26 26.14 26 64T418.86-681q-26.14 26-64 26T291-681.14Zm250 0q-26-26.14-26-64T541.14-809q26.14-26 64-26T669-808.86q26 26.14 26 64T668.86-681q-26.14 26-64 26T541-681.14ZM789.86-485Q752-485 726-511.14t-26-64Q700-613 726.14-639t64-26Q828-665 854-638.86t26 64Q880-537 853.86-511t-64 26ZM266-75q-42 0-69-31.53-27-31.52-27-74.47 0-42 25.5-74.5T250-318q22-22 41-46.5t36-50.5q29-44 65-82t88-38q52 0 88.5 38t65.5 83q17 26 35.5 50t40.5 46q29 30 54.5 62.5T790-181q0 42.95-27 74.47Q736-75 694-75q-54 0-107-9t-107-9q-54 0-107 9t-107 9Z"],
      ["cruelty_free", "konijn huisdier", "M380-80q-75 0-127.5-52.5T200-260q0-32 14.5-60.5T263-383q15-15 24-25t19-22q-51-78-78.5-163.5T200-760q0-58 21-89t59-31q42 0 87 41t79 109q10 20 18.5 41.5T480-641q7-26 15.5-47.5T514-730q34-68 79-109t87-41q38 0 59 31t21 89q0 81-27.5 166.5T654-430q10 12 19 22t24 25q34 34 48.5 62.5T760-260q0 75-52.5 127.5T580-80q-45 0-72.5-10L480-100l-27.5 10Q425-80 380-80Zm0-60q17 0 40-5.5t49-16.5q-11-5-20-17t-9-21q0-8 11.5-14t28.5-6q17 0 28.5 6t11.5 14q0 9-9 21t-20 17q26 11 49 16.5t40 5.5q50 0 85-35t35-85q0-22-12-43t-35-41q-11-10-24.5-24T604-396q-32-42-55-53t-69-11q-46 0-69 11t-55 53q-11 14-24.5 28T307-344q-23 20-35 41t-12 43q0 50 35 85t85 35Zm40-150q-8 0-14-9t-6-21q0-12 6-21t14-9q8 0 14 9t6 21q0 12-6 21t-14 9Zm120 0q-8 0-14-9t-6-21q0-12 6-21t14-9q8 0 14 9t6 21q0 12-6 21t-14 9ZM347-477q21-20 41.5-29.5T439-519q-5-51-17-99.5T391-705q-23-47-53-78.5T275-826q-8 15-11.5 32t-3.5 34q0 72 22.5 144.5T347-477Zm266 0q42-66 64.5-138.5T700-760q0-17-3.5-34T685-826q-33 11-63 42.5T569-705q-19 38-31 86.5T521-519q30 3 50.5 12.5T613-477Z"]
    ]],
    ["Abonnementen en communicatie", [
      ["wifi", "internet wifi", "M417-154q-27-27-27-63t27-63q27-27 63-27t63 27q27 27 27 63t-27 63q-27 27-63 27t-63-27Zm209-378.5Q694-505 757-451q14 12 15 30.5T759-388q-14 14-32 13t-33-13q-53-44-106.5-63T480-470q-54 0-107.5 19T266-388q-15 12-33 13t-32-13q-14-14-13-32.5t15-30.5q63-54 131-81.5T480-560q78 0 146 27.5Zm95.5-219Q835-703 926-622q14 13 15.5 31.5T929-558q-14 14-33.5 13.5T861-558q-83-70-178-111t-203-41q-108 0-203 41T99-558q-15 13-34 13.5T32-558q-14-14-13-32.5T34-622q91-81 204.5-129.5T480-800q128 0 241.5 48.5Z"],
      ["router", "internet", "M180-120q-24 0-42-18t-18-42v-204q0-24 18-42t42-18h436v-146q0-13 8.5-21.5T646-620q13 0 21.5 8.5T676-590v146h104q24 0 42 18t18 42v204q0 24-18 42t-42 18H180Zm132-132q12-12 12-30t-12-30q-12-12-30-12t-30 12q-12 12-12 30t12 30q12 12 30 12t30-12Zm148 0q12-12 12-30t-12-30q-12-12-30-12t-30 12q-12 12-12 30t12 30q12 12 30 12t30-12Zm148 0q12-12 12-30t-12-30q-12-12-30-12t-30 12q-12 12-12 30t12 30q12 12 30 12t30-12Zm38-448q-15 0-29.5 4T589-684q-11 6-23 5t-20-9q-9-9-9-20.5t10-18.5q21-16 46-24.5t53-8.5q29 0 54 9t46 25q9 7 9 18.5t-8 19.5q-8 8-20.5 9t-23.5-5q-12-8-26.5-12t-30.5-4Zm-80.5-107Q529-794 503-773q-10 8-22.5 8t-21.5-9q-9-9-8.5-22t10.5-21q34-26 81.5-44.5T646-880q56 0 103.5 18.5T831-817q10 8 10.5 21t-8.5 22q-9 9-21.5 8.5T788-774q-26-20-62-33t-80-13q-44 0-80.5 13Z"],
      ["call", "telefoon bellen", "M795-120q-116 0-236.5-56T335-335Q232-438 176-558.5T120-795q0-19 13-32t32-13h140q14 0 24 10t14 25l27 126q2 14-.5 25.5T359-634L259-533q26 44 55 82t64 72q37 38 78 69.5t86 55.5l95-98q10-11 23-15t26-2l119 26q15 4 25 16t10 27v135q0 19-13 32t-32 13Z"],
      ["sim_card", "simkaart mobiel abonnement", "M325.5-201.68q8.5-8.67 8.5-21.5 0-12.82-8.68-21.32-8.67-8.5-21.5-8.5-12.82 0-21.32 8.68-8.5 8.67-8.5 21.5 0 12.82 8.68 21.32 8.67 8.5 21.5 8.5 12.82 0 21.32-8.68Zm0-155.95q8.5-8.62 8.5-21.37v-106q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v106q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63Zm174 156q8.5-8.62 8.5-21.37v-110q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v110q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63Zm0-262.05q8.5-8.67 8.5-21.5 0-12.82-8.68-21.32-8.67-8.5-21.5-8.5-12.82 0-21.32 8.68-8.5 8.67-8.5 21.5 0 12.82 8.68 21.32 8.67 8.5 21.5 8.5 12.82 0 21.32-8.68Zm182 262q8.5-8.67 8.5-21.5 0-12.82-8.68-21.32-8.67-8.5-21.5-8.5-12.82 0-21.32 8.68-8.5 8.67-8.5 21.5 0 12.82 8.68 21.32 8.67 8.5 21.5 8.5 12.82 0 21.32-8.68Zm0-155.95q8.5-8.62 8.5-21.37v-106q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v106q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63ZM220-80q-24 0-42-18t-18-42v-476q0-12.44 5-23.72T178-659l203-203q8-8 19.28-13 11.28-5 23.72-5h316q24 0 42 18t18 42v680q0 24-18 42t-42 18H220Z"],
      ["subscriptions", "abonnementen", "M140-80q-24 0-42-18t-18-42v-440q0-24 18-42t42-18h680q24 0 42 18t18 42v440q0 24-18 42t-42 18H140Zm290-147 179-121q7-5 7-12t-7-12L430-492q-8-5-15.5-1t-7.5 13v241q0 9 7.5 13t15.5-1ZM179-700q-13 0-21.5-8.5T149-730q0-13 8.5-21.5T179-760h602q13 0 21.5 8.5T811-730q0 13-8.5 21.5T781-700H179Zm131-120q-13 0-21.5-8.5T280-850q0-13 8.5-21.5T310-880h340q13 0 21.5 8.5T680-850q0 13-8.5 21.5T650-820H310Z"],
      ["live_tv", "streaming tv", "m429-379 181-116q14-9 14-25t-14-25L429-661q-15-10-30.5-1T383-635v230q0 18 15.5 27t30.5-1ZM140-200q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H630v50q0 13-8.5 21.5T600-120H360q-13 0-21.5-8.5T330-150v-50H140Z"],
      ["cloud", "cloud opslag", "M251-160q-88 0-149.5-61.5T40-371q0-78 50-137t127-71q20-97 94-158.5T482-799q112 0 189 81.5T748-522v24q72-2 122 46.5T920-329q0 69-50 119t-119 50H251Z"],
      ["newspaper", "krant", "M140-120q-24.75 0-42.37-17.63Q80-155.25 80-180v-642q0-5.25 4.5-7.13Q89-831 93-827l54 54 55-56q4.64-5 10.82-5 6.18 0 11.18 5l56 56 56-56q4.64-5 10.82-5 6.18 0 11.18 5l55 56 56-56q4.64-5 10.82-5 6.18 0 11.18 5l56 56 55-56q4.64-5 10.82-5 6.18 0 11.18 5l56 56 56-56q4.64-5 10.82-5 6.18 0 11.18 5l55 56 54-54q4-4 8.5-2.13 4.5 1.88 4.5 7.13v642q0 24.75-17.62 42.37Q844.75-120 820-120H140Zm0-60h310v-280H140v280Zm370 0h310v-110H510v110Zm0-170h310v-110H510v110ZM140-520h680v-120H140v120Z"],
      ["mail", "post brief", "M140-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H140Zm348.5-309.5q3.5-1.5 7.5-3.5l314-205q5-3 7.5-8t2.5-11q0-13-11.5-20.5t-23.5.5L480-522 176-717q-12-8-24-1t-12 20q0 6 3 11.5t7 8.5l314 205q4 2 7.5 3.5t8.5 1.5q5 0 8.5-1.5Z"],
      ["smart_toy", "ai", "M147-376q-45 0-76-31.21T40-483q0-44.58 31.21-75.79Q102.42-590 147-590v-123q0-24 18-42t42-18h166q0-45 31-76t76-31q45 0 76 31.21T587-773h166q24 0 42 18t18 42v123q45 0 76 31.21T920-483q0 44.58-31.21 75.79Q857.58-376 813-376v196q0 24-18 42t-42 18H207q-24 0-42-18t-18-42v-196Zm224.5-111.74q11.5-11.73 11.5-28.5 0-16.76-11.74-28.26-11.73-11.5-28.5-11.5-16.76 0-28.26 11.74-11.5 11.73-11.5 28.5 0 16.76 11.74 28.26 11.73 11.5 28.5 11.5 16.76 0 28.26-11.74Zm274 0q11.5-11.73 11.5-28.5 0-16.76-11.74-28.26-11.73-11.5-28.5-11.5-16.76 0-28.26 11.74-11.5 11.73-11.5 28.5 0 16.76 11.74 28.26 11.73 11.5 28.5 11.5 16.76 0 28.26-11.74ZM342-285h276q12.75 0 21.38-8.68 8.62-8.67 8.62-21.5 0-12.82-8.62-21.32-8.63-8.5-21.38-8.5H342q-12.75 0-21.37 8.68-8.63 8.67-8.63 21.5 0 12.82 8.63 21.32 8.62 8.5 21.37 8.5Z"],
      ["apps", "apps software", "M179-179q-19-19-19-47t19-47q19-19 47-19t47 19q19 19 19 47t-19 47q-19 19-47 19t-47-19Zm254 0q-19-19-19-47t19-47q19-19 47-19t47 19q19 19 19 47t-19 47q-19 19-47 19t-47-19Zm254 0q-19-19-19-47t19-47q19-19 47-19t47 19q19 19 19 47t-19 47q-19 19-47 19t-47-19ZM179-433q-19-19-19-47t19-47q19-19 47-19t47 19q19 19 19 47t-19 47q-19 19-47 19t-47-19Zm254 0q-19-19-19-47t19-47q19-19 47-19t47 19q19 19 19 47t-19 47q-19 19-47 19t-47-19Zm254 0q-19-19-19-47t19-47q19-19 47-19t47 19q19 19 19 47t-19 47q-19 19-47 19t-47-19ZM179-687q-19-19-19-47t19-47q19-19 47-19t47 19q19 19 19 47t-19 47q-19 19-47 19t-47-19Zm254 0q-19-19-19-47t19-47q19-19 47-19t47 19q19 19 19 47t-19 47q-19 19-47 19t-47-19Zm254 0q-19-19-19-47t19-47q19-19 47-19t47 19q19 19 19 47t-19 47q-19 19-47 19t-47-19Z"]
    ]],
    ["Geld", [
      ["savings", "spaarpot sparen", "M230-120q-21 0-39.49-13.96Q172.02-147.93 166-168q-25-86-41.54-148.46-16.54-62.46-26.37-109.68-9.82-47.22-13.95-83.79Q80-546.49 80-580q0-92 64-156t156-64h200q27-36 68.5-58t91.5-22q25 0 42.5 17.5T720-820q0 6-1.5 12t-3.5 11q-4 11-7.5 22t-5.5 24l91 91h57q12.75 0 21.38 8.62Q880-642.75 880-630v227q0 10.24-5.5 18.12Q869-377 859-374l-91.93 30.3L713-163q-6.03 19.61-21.84 31.31Q675.34-120 655-120H540q-24.75 0-42.37-17.63Q480-155.25 480-180v-20h-80v20q0 24.75-17.62 42.37Q364.75-120 340-120H230Zm438.5-411.5Q680-543 680-560t-11.5-28.5Q657-600 640-600t-28.5 11.5Q600-577 600-560t11.5 28.5Q623-520 640-520t28.5-11.5ZM490-620q12.75 0 21.38-8.68 8.62-8.67 8.62-21.5 0-12.82-8.62-21.32-8.63-8.5-21.38-8.5H350q-12.75 0-21.37 8.68-8.63 8.67-8.63 21.5 0 12.82 8.63 21.32 8.62 8.5 21.37 8.5h140Z"],
      ["account_balance_wallet", "portemonnee", "M180-120q-23 0-41.5-18T120-180v-600q0-23 18.5-41.5T180-840h600q24 0 42 18.5t18 41.5v54H538q-58 0-96 38t-38 95v227q0 57 38 95t96 38h302v53q0 24-18 42t-42 18H180Zm358-173q-34 0-54-20t-20-53v-227q0-34 20-53.5t54-19.5h269q34 0 54 19.5t20 53.5v227q0 33-20 53t-54 20H538Zm158.5-142.5Q716-455 716-481q0-25-19.5-44T652-544q-25 0-44.5 19T588-481q0 26 19.5 45.5T652-416q25 0 44.5-19.5Z"],
      ["wallet", "portemonnee", "M240-160q-66 0-113-47T80-320v-320q0-66 47-113t113-47h480q66 0 113 47t47 113v320q0 66-47 113t-113 47H240Zm0-470h480q29 0 54.5 9t45.5 26v-45q0-42-29-71t-71-29H240q-42 0-71 29t-29 71v45q20-17 45.5-26t54.5-9Zm-97 136 477 115q7 2 14.5.5T647-385l160-134q-13-23-36-37t-51-14H240q-35 0-62 21.5T143-494Z"],
      ["payments", "geld betalen", "M100-160q-24.75 0-42.37-17.63Q40-195.25 40-220v-430q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v430h670q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H100Zm120-120q-24.75 0-42.37-17.63Q160-315.25 160-340v-400q0-24.75 17.63-42.38Q195.25-800 220-800h640q24.75 0 42.38 17.62Q920-764.75 920-740v400q0 24.75-17.62 42.37Q884.75-280 860-280H220Zm100-60q0-42-29-71t-71-29v100h100Zm440 0h100v-100q-42 0-71 29t-29 71Zm-220-80q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM220-640q42 0 71-29t29-71H220v100Zm640 0v-100H760q0 42 29 71t71 29Z"],
      ["euro", "euro geld", "M600-120q-115 0-212.5-67.5T255-370H150q-13 0-21.5-8.5T120-400q0-13 8.5-21.5T150-430h93q-4-28-3.5-50t3.5-50h-93q-13 0-21.5-8.5T120-560q0-13 8.5-21.5T150-590h105q35-115 132.5-182.5T600-840q60 0 114.5 18.5T816-768q10 8 11 20t-8 21q-9 9-22 9.5t-24-7.5q-38-27-82-41t-91-14q-94 0-171.5 52.5T319-590h251q13 0 21.5 8.5T600-560q0 13-8.5 21.5T570-530H304q-5 27-5 50t5 50h266q13 0 21.5 8.5T600-400q0 13-8.5 21.5T570-370H319q32 85 109.5 137.5T600-180q45 0 89.5-13.5T773-235q11-8 24-7.5t22 9.5q9 9 8 21t-11 20q-43 32-99 52t-117 20Z"],
      ["credit_card", "creditcard pas", "M140-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H140Zm0-342h680v-129H140v129Z"],
      ["request_quote", "factuur", "M450-241v25q0 6 4.5 10.5T465-201h30q6 0 10.5-4.5T510-216v-25h60q12.75 0 21.38-8.63Q600-258.25 600-271v-130q0-12.75-8.62-21.38Q582.75-431 570-431H420v-70h150q12.75 0 21.38-8.68 8.62-8.67 8.62-21.5 0-12.82-8.62-21.32-8.63-8.5-21.38-8.5h-60v-25q0-6-4.5-10.5T495-601h-30q-6 0-10.5 4.5T450-586v25h-60q-12.75 0-21.37 8.62Q360-543.75 360-531v130q0 12.75 8.63 21.37Q377.25-371 390-371h150v70H390q-12.75 0-21.37 8.68-8.63 8.67-8.63 21.5 0 12.82 8.63 21.32 8.62 8.5 21.37 8.5h60ZM220-80q-24 0-42-18t-18-42v-680q0-24 18-42t42-18h361l219 219v521q0 24-18 42t-42 18H220Zm334-740v156q0 12.75 8.63 21.37Q571.25-634 584-634h156L554-820Z"],
      ["receipt_long", "bon factuur", "M222-80q-43.75 0-74.37-30.63Q117-141.25 117-185v-95q0-12.75 8.63-21.38Q134.25-310 147-310h97v-552q0-5.25 4.5-7.13Q253-871 257-867l36 36q4.64 5 10.82 5 6.18 0 11.18-5l38-38q4.64-5 10.82-5 6.18 0 11.18 5l37 38q4.64 5 10.82 5 6.18 0 11.18-5l38-38q4.64-5 10.82-5 6.18 0 11.18 5l38 38q4.64 5 10.82 5 6.18 0 11.18-5l38-38q4.64-5 10.82-5 6.18 0 11.18 5l38 38q4.64 5 10.82 5 6.18 0 11.18-5l38-38q4.64-5 10.82-5 6.18 0 11.18 5l38 38q4.64 5 10.82 5 6.18 0 11.18-5l36-36q4-4 8.5-2.13 4.5 1.88 4.5 7.13v677q0 43.75-30.62 74.37Q781.75-80 738-80H222Zm514.5-60q19.5 0 31.5-12.5t12-32.5v-611H307v536h360q12.75 0 21.38 8.62Q697-242.75 697-230v45q0 20 10 32.5t29.5 12.5ZM390-702h180q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H390q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5Zm0 134h180q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H390q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5Zm303-74q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Zm0 129q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Z"],
      ["trending_up", "beleggen groei", "M102-252q-9-9-9-21.5t9-21.5l228-227q16.93-17 41.97-17Q397-539 414-522l125 125 241-241h-97q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h167q12.75 0 21.38 8.62Q880-680.75 880-668v167q0 12-8.27 21t-20.5 9Q839-471 830-480t-9-21v-93L580-354q-16.93 17-41.97 17Q513-337 496-354L371-478 145-252q-9 9-21.5 9t-21.5-9Z"],
      ["monitoring", "beleggen", "M128.5-128.63Q120-137.25 120-150v-46q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v46q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Zm165 0Q285-137.25 285-150v-206q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v206q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Zm165 0Q450-137.25 450-150v-146q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v146q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Zm165 0Q615-137.25 615-150v-246q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v246q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Zm165 0Q780-137.25 780-150v-366q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v366q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM559.5-499q-11.5 0-22.46-4.7-10.97-4.69-20.04-13.3L400-634 172-407q-9.07 9-21.53 8.5-12.47-.5-21.34-9.5-8.13-9-8.63-21t8.5-21l229-227q9.07-8.87 20.04-12.93Q389-694 400-694t22.34 4.07Q433.68-685.87 442-677l118 118 229-229q9-9 21-9t20.87 9q8.13 9 8.63 21t-8.5 21L602-517q-8 9-19.5 13.5t-23 4.5Z"],
      ["percent", "rente", "M289.9-540q-53.9 0-91.9-38.1-38-38.1-38-92t38.1-91.9q38.1-38 92-38t91.9 38.1q38 38.1 38 92T381.9-578q-38.1 38-92 38Zm-.02-60q29.12 0 49.62-20.38 20.5-20.38 20.5-49.5t-20.38-49.62q-20.38-20.5-49.5-20.5t-49.62 20.38q-20.5 20.38-20.5 49.5t20.38 49.62q20.38 20.5 49.5 20.5ZM669.9-160q-53.9 0-91.9-38.1-38-38.1-38-92t38.1-91.9q38.1-38 92-38t91.9 38.1q38 38.1 38 92T761.9-198q-38.1 38-92 38Zm49.6-80.38q20.5-20.38 20.5-49.5t-20.38-49.62q-20.38-20.5-49.5-20.5t-49.62 20.38q-20.5 20.38-20.5 49.5t20.38 49.62q20.38 20.5 49.5 20.5t49.62-20.38ZM172-202q0-12 9-21l556-556q9-9 21-9t21 9q9 9 9 21t-9 21L223-181q-9 9-21 9t-21-9q-9-9-9-21Z"],
      ["work", "werk salaris", "M140-120q-24 0-42-18t-18-42v-480q0-24 18-42t42-18h180v-100q0-24 18-42t42-18h200q24 0 42 18t18 42v100h180q24 0 42 18t18 42v480q0 24-18 42t-42 18H140Zm240-600h200v-100H380v100Z"],
      ["business_center", "werk zakelijk", "M451-371v-60h60v60h-60Zm-71-349h200v-100H380v100ZM140-120q-24 0-42-18t-18-42v-191h311v30q0 12.75 8.64 21.37 8.64 8.63 21.41 8.63h120.18q12.77 0 21.27-8.63 8.5-8.62 8.5-21.37v-30h309v191q0 24-18 42t-42 18H140ZM80-431v-229q0-24 18-42t42-18h180v-100q0-24 18-42t42-18h200q24 0 42 18t18 42v100h180q24 0 42 18t18 42v229H571v-30q0-12.75-8.64-21.38-8.64-8.62-21.41-8.62H420.77q-12.77 0-21.27 8.62-8.5 8.63-8.5 21.38v30H80Z"],
      ["volunteer_activism", "goede doelen geven", "M549-53q8 2 17 2t17-2l297-91q0-54-30.5-80.5T762-251H587q-45 0-69.5-4.5T477-265l-61-21q-6-2-8.5-7.5T407-305q2-6 7.5-8.5t11.5-.5l59 19q24 8 44 11t46 3h73q8 0 13-5t5-13q0-23-16-45.5T604-378l-245-92q-5-2-10.5-3t-10.5-1h-83v337l294 84ZM40-140q0 25 17.5 42.5T100-80h34q25 0 42.5-17.5T194-140v-274q0-25-17.5-42.5T134-474h-34q-25 0-42.5 17.5T40-414v274Zm584-344.5q-11-4.5-20-12.5L482-616q-30-29-50-64.5T412-758q0-51 35.5-86.5T534-880q34 0 62 17.5t50 43.5q22-26 50-43.5t62-17.5q51 0 86.5 35.5T880-758q0 42-20 77.5T810-616L688-497q-9 8-20 12.5t-22 4.5q-11 0-22-4.5Z"],
      ["handshake", "afspraak", "M484-120q-17 0-29-12t-12-29q0-7 3-14.5t9-13.5l175-175q5-5 5-10.5t-5-10.5q-5-5-10.5-5t-10.5 5L434-210q-6 6-13 9t-15 3q-17 0-28.5-11.5T366-238q0-10 3-16.5t8-11.5l175-175q5-5 5-10.5t-5-10.5q-5-5-10.5-5t-10.5 5L356-288q-6 6-13 9t-16 3q-16 0-28-12t-12-28q0-8 3-15t9-13l175-175q5-5 5-10.5t-5-10.5q-5-5-10.5-5t-10.5 5L279-365q-5 5-12 8t-17 3q-17 0-28.5-11T210-393q0-8 3-15t9-13l204-204q8-8 19.5-7.5T465-624l107 107q11 11 24.5 18.5T629-491q32 0 54-20.5t22-55.5q0-14-5.5-27.5T681-621L540-762q-14-14-16-33t12-32q11-10 24-14.5t27-4.5q23 0 46.5 11t42.5 30l169 170q18 18 26.5 40t8.5 51q0 20-9 40.5T845-466L512-132q-8 8-14 10t-14 2ZM122-442q-23-20-34.5-46T76-542q0-26 9.5-49.5T115-635l169-170q17-17 37.5-26t43.5-9q25 0 48.5 9t40.5 26l205 205q7 7 11.5 15t4.5 18q0 19-13.5 32.5T629-521q-11 0-20-5t-17-13L486-645q-17-17-42-17t-42 17L195-438q-14 14-35 12t-38-16Z"],
      ["gavel", "notaris juridisch", "M190-180h420q13 0 21.5 8.5T640-150q0 13-8.5 21.5T610-120H190q-13 0-21.5-8.5T160-150q0-13 8.5-21.5T190-180Zm150-194L202-512q-17-17-17.5-41.5T201-596l29-30 224 222-30 30q-17 17-42 17t-42-17Zm296-212L414-810l30-29q18-17 42.5-16.5T528-838l138 138q17 17 17 42t-17 42l-30 30Zm181 405L302-696l42-42 515 515q9 9 9 21t-9 21q-9 9-21 9t-21-9Z"],
      ["description", "document", "M349-250h262q13 0 21.5-8.5T641-280q0-13-8.5-21.5T611-310H349q-13 0-21.5 8.5T319-280q0 13 8.5 21.5T349-250Zm0-170h262q13 0 21.5-8.5T641-450q0-13-8.5-21.5T611-480H349q-13 0-21.5 8.5T319-450q0 13 8.5 21.5T349-420ZM220-80q-24 0-42-18t-18-42v-680q0-24 18-42t42-18h336q12 0 23.5 5t19.5 13l183 183q8 8 13 19.5t5 23.5v496q0 24-18 42t-42 18H220Zm331-584q0 13 8.5 21.5T581-634h159L551-820v156Z"],
      ["umbrella", "noodfonds buffer", "m510-284 117-336-55 12-62-40v364Zm-60 0v-364l-62 41-56-14 118 337Zm13 199q-8-5-12-15L258-652q-6-17 6-30t29-9l81 19 76-46v-116q0-35 26.5-60.5T540-920q38 0 64 25.5t26 60.5q0 13-8.5 21.5T600-804q-13 0-21.5-8.5T570-834q0-13-8.5-21t-21.5-8q-12 0-21 9t-9 20v116l76 46 81-19q17-4 29 9t6 30L509-101q-4 11-12 16t-17 5q-9 0-17-5Z"],
      ["emergency", "nood", "M426-190v-196l-170 98q-20 11-41 6t-32-25q-11-20-6-41.5t25-32.5l170-99-169-98q-20-11-25.5-32.5T183-652q11-20 32-25t41 6l170 98v-197q0-23 15.5-38.5T480-824q23 0 38.5 15.5T534-770v197l170-98q20-11 41-6t32 25q11 20 5.5 41.5T757-578l-169 98 170 99q20 11 25 32.5t-6 41.5q-11 20-32 25t-41-6l-170-98v196q0 23-15.5 38.5T480-136q-23 0-38.5-15.5T426-190Z"],
      ["target", "doel", "M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM721-239q99-99 99-241t-99-241q-99-99-241-99t-241 99q-99 99-99 241t99 241q99 99 241 99t241-99Zm-411-71q-70-70-70-170t70-170q70-70 170-70t170 70q70 70 70 170t-70 170q-70 70-170 70t-170-70Zm297.5-42.5Q660-405 660-480t-52.5-127.5Q555-660 480-660t-127.5 52.5Q300-555 300-480t52.5 127.5Q405-300 480-300t127.5-52.5Zm-184-71Q400-447 400-480t23.5-56.5Q447-560 480-560t56.5 23.5Q560-513 560-480t-23.5 56.5Q513-400 480-400t-56.5-23.5Z"],
      ["flag", "doel vlag", "M260-429v279q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37v-620q0-12.75 8.63-21.38Q217.25-800 230-800h289q10.5 0 18.75 6.5T548-776l14 62h208q12.75 0 21.38 8.62Q800-696.75 800-684v310q0 12.75-8.62 21.37Q782.75-344 770-344H568q-10.5 0-18.75-6T539-367l-14-62H260Z"],
      ["star", "ster favoriet", "M480-269 294-157q-8 5-17 4.5t-16-5.5q-7-5-10.5-13t-1.5-18l49-212-164-143q-8-7-9.5-15.5t.5-16.5q2-8 9-13.5t17-6.5l217-19 84-200q4-9 12-13.5t16-4.5q8 0 16 4.5t12 13.5l84 200 217 19q10 1 17 6.5t9 13.5q2 8 .5 16.5T826-544L662-401l49 212q2 10-1.5 18T699-158q-7 5-16 5.5t-17-4.5L480-269Z"],
      ["undo", "teruggave", "M289-200q-13 0-21.5-8.5T259-230q0-13 8.5-21.5T289-260h280q70 0 120.5-46.5T740-422q0-69-50.5-115.5T569-584H274l93 93q9 9 9 21t-9 21q-9 9-21 9t-21-9L181-593q-5-5-7-10t-2-11q0-6 2-11t7-10l144-144q9-9 21-9t21 9q9 9 9 21t-9 21l-93 93h294q95 0 163.5 64T800-422q0 94-68.5 158T568-200H289Z"],
      ["currency_exchange", "wisselen", "M487-293q40 0 66.5-19.5T580-364q0-33-25-55.5T463-470q-60-25-90-54t-30-78q0-44 30-75t80-38v-24q0-11 8-19t19-8h1q11 0 19 8t8 19v24q32 3 57 17.5t42 40.5q6 8 2 18t-14 15q-10 5-20 2t-17-11q-14-18-33-27t-43-9q-39 0-61.5 18T398-602q0 32 26 51t84 43q69 29 98 61t29 83q0 25-9 46t-25.5 36Q584-267 560-257.5T506-245v25q0 11-8 19t-19 8q-11 0-19.5-8.5T451-221v-26q-38-11-66.5-32.5T336-336q-5-9-1-17.5t15-12.5q11-4 20.5 0t14.5 14q16 28 42.5 43.5T487-293Zm-7 253q-112 0-216-66T100-257v107q0 13-8.5 21.5T70-120q-13 0-21.5-8.5T40-150v-180q0-13 8.5-21.5T70-360h180q13 0 21.5 8.5T280-330q0 13-8.5 21.5T250-300H143q51 77 145.5 138.5T480-100q150 0 258.5-101T859-449q1-13 9.5-22t21.5-9q12 0 21 8.5t8 20.5q-6 86-42.5 161T781-159.5Q722-104 644.5-72T480-40Zm0-820q-150 0-258.5 101T101-511q-1 13-9.5 22T70-480q-12 0-21-8.5T41-509q6-86 42.5-161T179-800.5Q238-856 315.5-888T480-920q112 0 216 66t164 151v-107q0-13 8.5-21.5T890-840q13 0 21.5 8.5T920-810v180q0 13-8.5 21.5T890-600H710q-13 0-21.5-8.5T680-630q0-13 8.5-21.5T710-660h107q-51-77-145-138.5T480-860Z"],
      ["price_change", "prijs", "M140-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H140Zm267-219H267q-12.75 0-21.37 8.68-8.63 8.67-8.63 21.5 0 12.82 8.63 21.32 8.62 8.5 21.37 8.5h57v15q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-15h48q16 0 25.5-12t9.5-27v-114.74q0-16.26-9.5-27.76T432-512H297v-69h140q12.75 0 21.38-8.68 8.62-8.67 8.62-21.5 0-12.82-8.62-21.32-8.63-8.5-21.38-8.5h-53v-15q0-12.75-8.62-21.38Q366.75-686 354-686q-13 0-21.5 8.5T324-656v15h-48q-16 0-27.5 12T237-600.88v113.76q0 16.12 11.5 25.62T276-452h131v73Zm248.25 64.75 42-42q3.75-3.75 1.88-8.25t-7.11-4.5h-83.78q-5.24 0-7.24 4.5t1.75 8.25l42 42Q647-312 650-312t5.25-2.25ZM607.98-581h83.78q5.24 0 7.24-4.5t-1.75-8.25l-42-42Q653-638 650-638t-5.25 2.25l-42 42q-3.75 3.75-1.88 8.25t7.11 4.5Z"]
    ]],
    ["Gezin", [
      ["family_restroom", "gezin familie", "M720.08-727q-30.08 0-51.58-21.42t-21.5-51.5q0-30.08 21.42-51.58t51.5-21.5q30.08 0 51.58 21.42t21.5 51.5q0 30.08-21.42 51.58t-51.5 21.5ZM660-110v-306q0-30-15-54t-44-35l41-120q8-25 29.5-40t48.5-15q27 0 48.5 15t29.5 40l88 255q5 14-3.5 27T858-330h-68v220q0 12.75-8.62 21.37Q772.75-80 760-80h-70q-12.75 0-21.37-8.63Q660-97.25 660-110ZM452.5-517.5Q435-535 435-560t17.5-42.5Q470-620 495-620t42.5 17.5Q555-585 555-560t-17.5 42.5Q520-500 495-500t-42.5-17.5ZM220.08-727q-30.08 0-51.58-21.42t-21.5-51.5q0-30.08 21.42-51.58t51.5-21.5q30.08 0 51.58 21.42t21.5 51.5q0 30.08-21.42 51.58t-51.5 21.5ZM150-110v-260h-40q-12.75 0-21.37-8.63Q80-387.25 80-400v-220q0-24.75 17.63-42.38Q115.25-680 140-680h160q24.75 0 42.38 17.62Q360-644.75 360-620v220q0 12.75-8.62 21.37Q342.75-370 330-370h-40v260q0 12.75-8.62 21.37Q272.75-80 260-80h-80q-12.75 0-21.37-8.63Q150-97.25 150-110Zm290 0v-140h-20q-12.75 0-21.37-8.63Q390-267.25 390-280v-136q0-18.33 12.83-31.17Q415.67-460 434-460h122q18.33 0 31.17 12.83Q600-434.33 600-416v136q0 12.75-8.62 21.37Q582.75-250 570-250h-20v140q0 12.75-8.62 21.37Q532.75-80 520-80h-50q-12.75 0-21.37-8.63Q440-97.25 440-110Z"],
      ["child_care", "kinderopvang baby", "M616-515q13-13 13-32t-13-32q-13-13-32-13t-32 13q-13 13-13 32t13 32q13 13 32 13t32-13Zm-209 0q13-13 13-32t-13-32q-13-13-32-13t-32 13q-13 13-13 32t13 32q13 13 32 13t32-13Zm174 200q47-29 73-80H306q26 51 73 80t101 29q54 0 101-29ZM340.5-148.5Q275-177 226-226t-77.5-114.5Q120-406 120-480t28.5-139.5Q177-685 226-734t114.5-77.5Q406-840 480-840t139.5 28.5Q685-783 734-734t77.5 114.5Q840-554 840-480t-28.5 139.5Q783-275 734-226t-114.5 77.5Q554-120 480-120t-139.5-28.5ZM495-638q29 0 44-8.5t15-24.5q0-9-6.5-14.5T530-691q-7 0-15 1.5t-20 1.5q-25 0-41.5-16.5T437-746q0-10 1.5-20.5T442-784q-14 2-26 4.5t-26 7.5q-2 5-2.5 12.5T387-746q0 46 31 77t77 31Z"],
      ["child_friendly", "kinderwagen baby", "M321.5-96.5Q305-113 305-136t16.5-39.5Q338-192 361-192t39.5 16.5Q417-159 417-136t-16.5 39.5Q384-80 361-80t-39.5-16.5Zm423 0Q728-113 728-136t16.5-39.5Q761-192 784-192t39.5 16.5Q840-159 840-136t-16.5 39.5Q807-80 784-80t-39.5-16.5ZM536-647 382-832q37-19 79-28.5t79-9.5q41 0 80 8.5t74 25.5q13 8 14.5 22t-9.5 24L536-647Zm-426-67q-13 0-21.5-8.5T80-744q0-56 36-96t87-40q29 0 54.5 12.5T320-810l423 506q15 18 4.5 41T712-240H498q-81 0-136.5-55.5T306-432v-302l-29-33q-27-32-43-42.5T203-820q-31 0-47 24t-16 52q0 13-8.5 21.5T110-714Z"],
      ["toys", "speelgoed", "M276-160q-45 0-79.5-33.5T159-275q-37-23-57.5-58.5T81-411q0-52 30.5-93.5T192-557l-81-85-19 20q-9 10-21.5 10T49-622q-9-9-9-21t9-22l81-84q9-9 21.5-9t21.5 9q9 10 9 22t-9 21l-19 21 72 77 39-117q11-33 38.5-54t61.5-21h232q34 0 62 21t38 54l50 166q57 5 95 46.5T880-411q0 42-20.5 77.5T802-275q-3 48-37.5 81.5T685-160q-42 0-73.5-29T572-260H389q-8 42-39.5 71T276-160Zm-2-401h175v-179h-84q-15 0-26 9.5T323-707l-49 146Zm235 0h175l-45-146q-5-14-16-23.5t-26-9.5h-88v179ZM319-237q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm409 0q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Z"],
      ["school", "school studie", "M860-313v-252L508-375q-14 8-29 7.5t-29-8.5L88-574q-8-5-11.5-11.5T73-600q0-8 3.5-14.5T88-626l362-198q7-4 14-6t15-2q8 0 15 2t14 6l396 215q8 4 12 11.5t4 15.5v269q0 13-8.5 21.5T890-283q-13 0-21.5-8.5T860-313ZM450-136 220-262q-14-8-22.5-22t-8.5-31v-174l261 143q14 8 29 8t29-8l261-143v174q0 17-8.5 31T738-262L508-136q-7 4-14 6t-15 2q-8 0-15-2t-14-6Z"],
      ["backpack", "school", "M220-80q-24.75 0-42.37-17.63Q160-115.25 160-140v-510q0-55 34-95.5t86-50.5v-54q0-12.75 8.63-21.38Q297.25-880 310-880h40q12.75 0 21.38 8.62Q380-862.75 380-850v50h200v-50q0-12.75 8.63-21.38Q597.25-880 610-880h40q12.75 0 21.38 8.62Q680-862.75 680-850v54q52 10 86 50.5t34 95.5v510q0 24.75-17.62 42.37Q764.75-80 740-80H220Zm400-330v50q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-80q0-12.75-8.62-21.38Q662.75-470 650-470H310q-12.75 0-21.37 8.68-8.63 8.67-8.63 21.5 0 12.82 8.63 21.32 8.62 8.5 21.37 8.5h310Z"],
      ["group", "mensen groep", "M38-254q0-35 18-63.5t50-42.5q73-32 131.5-46T358-420q62 0 120 14t131 46q32 14 50.5 42.5T678-254v34q0 25-17.5 42.5T618-160H98q-25 0-42.5-17.5T38-220v-34Zm686 94q5-15 9.5-29.5T738-220v-34q0-63-29-101.5T622-420q69 8 130 22t99 34q33 19 52 47t19 63v34q0 25-17.5 42.5T862-160H724ZM250-523q-42-42-42-108t42-108q42-42 108-42t108 42q42 42 42 108t-42 108q-42 42-108 42t-108-42Zm426 0q-42 42-108 42-11 0-24.5-1.5T519-488q24-25 36.5-61.5T568-631q0-45-12.5-79.5T519-774q11-3 24.5-5t24.5-2q66 0 108 42t42 108q0 66-42 108Z"],
      ["person", "persoon", "M372-523q-42-42-42-108t42-108q42-42 108-42t108 42q42 42 42 108t-42 108q-42 42-108 42t-108-42ZM160-220v-34q0-38 19-65t49-41q67-30 128.5-45T480-420q62 0 123 15.5T731-360q31 14 50 41t19 65v34q0 25-17.5 42.5T740-160H220q-25 0-42.5-17.5T160-220Z"],
      ["wc", "wc", "M212-110v-270h-20q-12.75 0-21.37-8.63Q162-397.25 162-410v-198q0-29 21.5-50.5t50.24-21.5h104.52q28.74 0 50.24 21.5Q410-637 410-608v198q0 12.75-8.62 21.37Q392.75-380 380-380h-20v270q0 12.75-8.62 21.37Q342.75-80 330-80h-88q-12.75 0-21.37-8.63Q212-97.25 212-110Zm22.5-645.42q-21.5-21.42-21.5-51.5t21.42-51.58q21.42-21.5 51.5-21.5t51.58 21.42q21.5 21.42 21.5 51.5t-21.42 51.58q-21.42 21.5-51.5 21.5t-51.58-21.42ZM630-110v-210h-65q-14.55 0-23.27-12-8.73-12-4.73-26l75-273q7.22-23.59 26.61-36.3Q658-680 684-680t45.39 12.7Q748.78-654.59 756-631l75 273q4 14-4.73 26-8.72 12-23.27 12h-65v210q0 12.75-8.62 21.37Q720.75-80 708-80h-48q-12.75 0-21.37-8.63Q630-97.25 630-110Zm2.5-645.42q-21.5-21.42-21.5-51.5t21.42-51.58q21.42-21.5 51.5-21.5t51.58 21.42q21.5 21.42 21.5 51.5t-21.42 51.58q-21.42 21.5-51.5 21.5t-51.58-21.42Z"],
      ["church", "kerk", "M80-140v-210q0-17.9 9.5-32.45Q99-397 116-405l129-57v-94q0-17.49 9-31.56T278-610l172-88v-82h-50q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h50v-50q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v50h50q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5h-50v82l172 88q15 8.37 24 22.44 9 14.07 9 31.56v94l129 57q17 8 26.5 22.55T880-350v210q0 24.75-17.62 42.37Q844.75-80 820-80H590q-12.75 0-21.37-8.63Q560-97.25 560-110v-100q0-32-24-56t-56-24q-32 0-56 24t-24 56v100q0 12.75-8.62 21.37Q382.75-80 370-80H140q-24.75 0-42.37-17.63Q80-115.25 80-140Zm439-301.06q16-16.06 16-39T518.94-519q-16.06-16-39-16T441-518.94q-16 16.06-16 39T441.06-441q16.06 16 39 16T519-441.06Z"]
    ]],
    ["Overig", [
      ["more_horiz", "overig", "M207.86-432Q188-432 174-446.14t-14-34Q160-500 174.14-514t34-14Q228-528 242-513.86t14 34Q256-460 241.86-446t-34 14Zm272 0Q460-432 446-446.14t-14-34Q432-500 446.14-514t34-14Q500-528 514-513.86t14 34Q528-460 513.86-446t-34 14Zm272 0Q732-432 718-446.14t-14-34Q704-500 718.14-514t34-14Q772-528 786-513.86t14 34Q800-460 785.86-446t-34 14Z"],
      ["category", "categorie overig", "m289-572 167-267q5-7 11-10.5t14-3.5q8 0 14 3.5t11 10.5l167 267q5 8 4.5 16t-4.5 15q-4 7-10.6 11t-15.4 4H315q-8.8 0-15.4-4T289-541q-4-7-4.5-15t4.5-16ZM706-80q-72.5 0-123.25-50.75T532-254q0-72.5 50.75-123.25T706-428q72.5 0 123.25 50.75T880-254q0 72.5-50.75 123.25T706-80Zm-586-55v-244q0-12.75 8.63-21.38Q137.25-409 150-409h244q12.75 0 21.38 8.62Q424-391.75 424-379v244q0 12.75-8.62 21.37Q406.75-105 394-105H150q-12.75 0-21.37-8.63Q120-122.25 120-135Z"],
      ["label", "label", "M140-160q-24.75 0-42.37-17.63Q80-195.25 80-220v-520q0-24.75 17.63-42.38Q115.25-800 140-800h471q14.25 0 27 6.37 12.75 6.38 21 17.63l195 260q12 15.68 12 35.84Q866-460 854-444L660-184q-8.25 11.25-21 17.62-12.75 6.38-27 6.38H140Z"],
      ["bookmark", "bladwijzer", "m480-240-196 84q-30 13-57-5t-27-50v-574q0-24 18-42t42-18h440q24 0 42 18t18 42v574q0 32-27 50t-57 5l-196-84Z"],
      ["inventory_2", "doos opslag", "M180-80q-24.75 0-42.37-17.63Q120-115.25 120-140v-483q-17-6-28.5-21.39T80-680v-140q0-24.75 17.63-42.38Q115.25-880 140-880h680q24.75 0 42.38 17.62Q880-844.75 880-820v140q0 20.22-11.5 35.61T840-623v483q0 24.75-17.62 42.37Q804.75-80 780-80H180Zm-40-600h680v-140H140v140Zm250 260h180q12.75 0 21.38-8.68 8.62-8.67 8.62-21.5 0-12.82-8.62-21.32-8.63-8.5-21.38-8.5H390q-12.75 0-21.37 8.68-8.63 8.67-8.63 21.5 0 12.82 8.63 21.32 8.62 8.5 21.37 8.5Z"],
      ["local_shipping", "verzending", "M140.5-195.42Q106-229.83 106-279H70q-12.75 0-21.37-8.63Q40-296.25 40-309v-431q0-24 18-42t42-18h519q24.75 0 42.38 17.62Q679-764.75 679-740v107h75q14.25 0 27 6.37 12.75 6.38 21 17.63l112 149q3 3.75 4.5 8.25T920-442v133q0 12.75-8.62 21.37Q902.75-279 890-279h-41q0 49-34.38 83.5t-83.5 34.5q-49.12 0-83.62-34.42Q613-229.83 613-279H342q0 49-34.38 83.5t-83.5 34.5q-49.12 0-83.62-34.42ZM265-238q17-17 17-41t-17-41q-17-17-41-17t-41 17q-17 17-17 41t17 41q17 17 41 17t41-17Zm507 0q17-17 17-41t-17-41q-17-17-41-17t-41 17q-17 17-17 41t17 41q17 17 41 17t41-17Zm-93-187h186L754-573h-75v148Z"],
      ["public", "wereld", "M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM437-141v-82q-35 0-59-26t-24-61v-44L149-559q-5 20-7 39.5t-2 39.5q0 130 84.5 227T437-141Zm294-108q44-48 66.5-107.5T820-480q0-106-58-192.5T607-799v18q0 35-24 61t-59 26h-87v87q0 17-13.5 28T393-568h-83v88h258q17 0 28 13t11 30v127h43q29 0 51 17t30 44Z"],
      ["eco", "duurzaam", "M444-80q-42 0-78.5-8T298-112q32-119 87.5-230.5T535-529q-112 54-194.5 150T228-161q-4-4-7.5-7t-7.5-7q-45-45-69-103t-24-122q0-69 26-133t75-113q70-72 175-97t303-17q20 1 36.5 8.5T765-731q13 13 21 29.5t9 36.5q10 194-17 302t-99 180q-48 50-109 76.5T444-80Z"],
      ["help", "vraag onbekend", "M511-258.03q11-11.03 11-27T510.97-312q-11.03-11-27-11T457-311.97q-11 11.03-11 27T457.03-258q11.03 11 27 11T511-258.03ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm2.5-580Q513-660 536-641.5q23 18.5 23 47.2 0 26.3-15.65 45.73Q527.7-529.14 508-512q-23 19-40 42.38-17 23.39-17 52.62 0 11 8.4 17.5T479-393q12 0 19.88-8 7.87-8 10.12-20 3-21 16-38t30.23-30.78Q580-510 596-537q16-27 16-58.61 0-50.39-37.5-83.89T485.55-713Q450-713 417-698t-54 44q-7 10-6.5 21.5t9.47 18.5q11.41 8 23.65 5 12.23-3 20.38-14 12.75-17.9 31.88-27.45Q461-660 482.77-660Z"]
    ]]
  ];
  var CATEGORY_ICONS = MATERIAL_GROUPS.flatMap(([, icons]) => icons.map(([name]) => name));

  // src/lib/server/maps.ts
  function get(id) {
    return db.prepare("SELECT id, parent_id, tree, opening_cents, behavior FROM categories WHERE id = ?").get(id);
  }
  var MapError = class extends Error {
  };
  var hasChildren = (id) => !!db.prepare("SELECT 1 FROM categories WHERE parent_id = ? AND archived = 0 LIMIT 1").get(id);
  var isRoot = (r) => !!r && r.parent_id == null;
  var isGroupRow = (r) => !!r && r.tree === "uitgaven" && isRoot(get(r.parent_id ?? -1));
  function checkBudgetParent(parent, tree) {
    if (!parent || parent.tree !== tree) throw new MapError("Kies in welke groep het budget komt.");
    if (tree === "uitgaven" ? !isGroupRow(parent) : !isRoot(parent)) throw new MapError("Een budget staat altijd direct in een groep.");
  }
  var nextSort = (parentId) => db.prepare("SELECT COALESCE(MAX(sort), -1) + 1 AS s FROM categories WHERE parent_id = ?").get(parentId).s;
  function createMap(parentId, name, kind = null) {
    const parent = get(parentId);
    name = name.trim();
    if (!name) throw new MapError("Geef het nieuwe budget een naam.");
    checkBudgetParent(parent, parent?.tree ?? "");
    const behavior = kind === "spaarpot" || kind === "doelpot" ? "pot" : "budget";
    return Number(
      db.prepare("INSERT INTO categories (parent_id, tree, name, behavior, sort, start_month) VALUES (?, ?, ?, ?, ?, ?)").run(parent.id, parent.tree, name, behavior, nextSort(parent.id), currentMonth()).lastInsertRowid
    );
  }
  function createGroup(name) {
    name = name.trim();
    if (!name) throw new MapError("Geef de nieuwe groep een naam.");
    const root = loadTree().roots.uitgaven;
    return Number(
      db.prepare("INSERT INTO categories (parent_id, tree, name, sort) VALUES (?, 'uitgaven', ?, ?)").run(root.id, name, nextSort(root.id)).lastInsertRowid
    );
  }
  function placeMap(id, parentId, beforeId) {
    const self = get(id);
    const parent = get(parentId);
    if (!self || self.parent_id == null) throw new MapError("Dit budget kan niet verplaatst worden.");
    if (isGroupRow(self)) {
      if (parentId !== self.parent_id) throw new MapError("Een groep staat altijd op het hoogste niveau.");
    } else checkBudgetParent(parent, self.tree);
    const siblings = db.prepare("SELECT id FROM categories WHERE parent_id = ? AND archived = 0 AND id != ? ORDER BY sort, name").all(parentId, id).map(
      (r) => r.id
    );
    const at = beforeId != null ? siblings.indexOf(beforeId) : -1;
    siblings.splice(at < 0 ? siblings.length : at, 0, id);
    tx(() => {
      db.prepare("UPDATE categories SET parent_id = ? WHERE id = ?").run(parentId, id);
      siblings.forEach((s, k) => db.prepare("UPDATE categories SET sort = ? WHERE id = ?").run(k, s));
    });
  }
  function updateMap(id, input) {
    const node = get(id);
    if (!node || node.parent_id == null) throw new MapError("Budget niet gevonden.");
    const name = input.name.trim();
    if (!name) throw new MapError("Een budget heeft een naam nodig.");
    const group = isGroupRow(node);
    const kind = group || node.tree !== "uitgaven" ? "" : input.kind;
    const behavior = group ? null : kind === "spaarpot" || kind === "doelpot" ? "pot" : "budget";
    const f = input.funding;
    const funding = behavior === "pot" && (f === "spaar" || f === "betaal") ? f : null;
    const icon = CATEGORY_ICONS.includes(input.icon) ? input.icon : null;
    const goal = kind === "doelpot" ? input.goalCents || null : null;
    if (kind === "doelpot" && !goal) throw new MapError("Een doel heeft een doelbedrag nodig.");
    const rawDate = input.goalDate;
    const goalDate = goal && /^\d{4}(-\d{2}(-\d{2})?)?$/.test(rawDate) ? rawDate : null;
    let parentId = node.parent_id;
    let sort = null;
    const wanted = input.parentId;
    if (!group && wanted && wanted !== node.parent_id) {
      checkBudgetParent(get(wanted), node.tree);
      parentId = wanted;
      sort = nextSort(wanted);
    }
    const restart = behavior !== node.behavior;
    db.prepare(
      `UPDATE categories SET name = ?, behavior = ?, funding = ?, icon = ?, goal_cents = ?, goal_date = ?, parent_id = ?, sort = COALESCE(?, sort),
		 start_month = CASE WHEN ? THEN ? ELSE start_month END WHERE id = ?`
    ).run(name, behavior, funding, icon, goal, goalDate, parentId, sort, restart ? 1 : 0, currentMonth(), node.id);
  }
  function deleteMap(id) {
    const node = get(id);
    if (!node || node.parent_id == null) throw new MapError("Dit budget kan niet weg.");
    if (hasChildren(id)) throw new MapError("Deze groep heeft nog budgetten. Verplaats of verwijder die eerst.");
    tx(() => {
      db.prepare("DELETE FROM splits WHERE category_id = ?").run(id);
      db.prepare("DELETE FROM rules WHERE category_id = ?").run(id);
      db.prepare("DELETE FROM budgets WHERE category_id = ?").run(id);
      db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    });
    return node.parent_id;
  }

  // src/routes/api/v1/budgetten/+server.ts
  function GET3() {
    return json(groupChoices());
  }
  async function POST5({ request }) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== "string") error(400, "Geef een naam op.");
    try {
      const id = body.group ? createGroup(body.name) : createMap(Number(body.parent_id), body.name, typeof body.kind === "string" ? body.kind : null);
      return json({ id });
    } catch (e) {
      if (e instanceof MapError) return json({ error: e.message }, { status: 400 });
      throw e;
    }
  }

  // src/routes/api/v1/budgetten/[id]/+server.ts
  var server_exports7 = {};
  __export(server_exports7, {
    DELETE: () => DELETE,
    GET: () => GET4,
    PUT: () => PUT
  });
  function GET4({ params, url }) {
    const data = budget(Number(params.id), url.searchParams.get("maand"));
    if (!data) error(404, "Budget niet gevonden.");
    return json(data);
  }
  async function PUT({ params, request }) {
    const b = await request.json().catch(() => null);
    if (!b || typeof b.name !== "string") error(400, "Geef een naam op.");
    try {
      updateMap(Number(params.id), {
        name: b.name,
        icon: typeof b.icon === "string" ? b.icon : "",
        kind: typeof b.kind === "string" ? b.kind : "",
        funding: typeof b.funding === "string" ? b.funding : "",
        goalCents: Number.isInteger(b.goal_cents) ? b.goal_cents : null,
        goalDate: typeof b.goal_date === "string" ? b.goal_date : "",
        parentId: Number.isInteger(b.parent_id) ? b.parent_id : null
      });
      return json({ ok: true });
    } catch (e) {
      if (e instanceof MapError) return json({ error: e.message }, { status: 400 });
      throw e;
    }
  }
  function DELETE({ params }) {
    try {
      deleteMap(Number(params.id));
      return json({ ok: true });
    } catch (e) {
      if (e instanceof MapError) return json({ error: e.message }, { status: 400 });
      throw e;
    }
  }

  // src/routes/api/v1/budgetten/[id]/bedrag/+server.ts
  var server_exports8 = {};
  __export(server_exports8, {
    PUT: () => PUT2
  });
  async function PUT2({ params, request }) {
    const b = await request.json().catch(() => null);
    const id = Number(params.id);
    if (!b || typeof b.month !== "string" || !/^\d{4}-\d{2}$/.test(b.month)) error(400, "Ongeldige maand.");
    const scope = b.scope === "alleen" ? "alleen" : "vanaf";
    const amount2 = b.amount_cents == null ? null : b.amount_cents;
    if (amount2 !== null && (!Number.isInteger(amount2) || amount2 < 0)) error(400, "Vul een geldig bedrag in.");
    if (amount2 === null && scope !== "alleen") error(400, "Vul een bedrag in.");
    if (!isBudgetId(loadTree(), id)) return json({ error: "Een groep heeft geen eigen budget; het totaal komt van de budgetten eronder." }, { status: 400 });
    setBudget(id, b.month, amount2, scope);
    return json({ ok: true });
  }

  // src/routes/api/v1/budgetten/[id]/plaats/+server.ts
  var server_exports9 = {};
  __export(server_exports9, {
    POST: () => POST6
  });
  async function POST6({ params, request }) {
    const b = await request.json().catch(() => null);
    if (!b || !Number.isInteger(b.parent_id)) error(400, "Geef de groep op.");
    try {
      placeMap(Number(params.id), b.parent_id, Number.isInteger(b.before_id) ? b.before_id : null);
      return json({ ok: true });
    } catch (e) {
      if (e instanceof MapError) return json({ error: e.message }, { status: 400 });
      throw e;
    }
  }

  // src/routes/api/v1/budgetten/volgorde/+server.ts
  var server_exports10 = {};
  __export(server_exports10, {
    GET: () => GET5
  });
  function GET5() {
    return json(ordering());
  }

  // src/routes/api/v1/importeren/+server.ts
  var server_exports11 = {};
  __export(server_exports11, {
    GET: () => GET6,
    POST: () => POST7
  });

  // node_modules/fast-xml-parser/src/util.js
  var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
  var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
  var regexName = new RegExp("^" + nameRegexp + "$");
  function getAllMatches(string, regex) {
    const matches2 = [];
    let match2 = regex.exec(string);
    while (match2) {
      const allmatches = [];
      allmatches.startIndex = regex.lastIndex - match2[0].length;
      const len = match2.length;
      for (let index = 0; index < len; index++) {
        allmatches.push(match2[index]);
      }
      matches2.push(allmatches);
      match2 = regex.exec(string);
    }
    return matches2;
  }
  var isName = function(string) {
    const match2 = regexName.exec(string);
    return !(match2 === null || typeof match2 === "undefined");
  };
  function isExist(v) {
    return typeof v !== "undefined";
  }
  var DANGEROUS_PROPERTY_NAMES = [
    // '__proto__',
    // 'constructor',
    // 'prototype',
    "hasOwnProperty",
    "toString",
    "valueOf",
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__"
  ];
  var criticalProperties = ["__proto__", "constructor", "prototype"];

  // node_modules/fast-xml-parser/src/validator.js
  var defaultOptions = {
    allowBooleanAttributes: false,
    //A tag can have attributes without any value
    unpairedTags: []
  };
  function validate(xmlData, options) {
    options = Object.assign({}, defaultOptions, options);
    const tags = [];
    let tagFound = false;
    let reachedRoot = false;
    if (xmlData[0] === "\uFEFF") {
      xmlData = xmlData.substr(1);
    }
    for (let i = 0; i < xmlData.length; i++) {
      if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
        i += 2;
        i = readPI(xmlData, i);
        if (i.err) return i;
      } else if (xmlData[i] === "<") {
        let tagStartPos = i;
        i++;
        if (xmlData[i] === "!") {
          i = readCommentAndCDATA(xmlData, i);
          continue;
        } else {
          let closingTag = false;
          if (xmlData[i] === "/") {
            closingTag = true;
            i++;
          }
          let tagName = "";
          for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
            tagName += xmlData[i];
          }
          tagName = tagName.trim();
          if (tagName[tagName.length - 1] === "/") {
            tagName = tagName.substring(0, tagName.length - 1);
            i--;
          }
          if (!validateTagName(tagName)) {
            let msg;
            if (tagName.trim().length === 0) {
              msg = "Invalid space after '<'.";
            } else {
              msg = "Tag '" + tagName + "' is an invalid name.";
            }
            return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
          }
          const result = readAttributeStr(xmlData, i);
          if (result === false) {
            return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
          }
          let attrStr = result.value;
          i = result.index;
          if (attrStr[attrStr.length - 1] === "/") {
            const attrStrStart = i - attrStr.length;
            attrStr = attrStr.substring(0, attrStr.length - 1);
            const isValid = validateAttributeString(attrStr, options);
            if (isValid === true) {
              tagFound = true;
            } else {
              return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
            }
          } else if (closingTag) {
            if (!result.tagClosed) {
              return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
            } else if (attrStr.trim().length > 0) {
              return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
            } else if (tags.length === 0) {
              return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
            } else {
              const otg = tags.pop();
              if (tagName !== otg.tagName) {
                let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                return getErrorObject(
                  "InvalidTag",
                  "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                  getLineNumberForPosition(xmlData, tagStartPos)
                );
              }
              if (tags.length == 0) {
                reachedRoot = true;
              }
            }
          } else {
            const isValid = validateAttributeString(attrStr, options);
            if (isValid !== true) {
              return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
            }
            if (reachedRoot === true) {
              return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
            } else if (options.unpairedTags.indexOf(tagName) !== -1) {
            } else {
              tags.push({ tagName, tagStartPos });
            }
            tagFound = true;
          }
          for (i++; i < xmlData.length; i++) {
            if (xmlData[i] === "<") {
              if (xmlData[i + 1] === "!") {
                i++;
                i = readCommentAndCDATA(xmlData, i);
                continue;
              } else if (xmlData[i + 1] === "?") {
                i = readPI(xmlData, ++i);
                if (i.err) return i;
              } else {
                break;
              }
            } else if (xmlData[i] === "&") {
              const afterAmp = validateAmpersand(xmlData, i);
              if (afterAmp == -1)
                return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
              i = afterAmp;
            } else {
              if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
              }
            }
          }
          if (xmlData[i] === "<") {
            i--;
          }
        }
      } else {
        if (isWhiteSpace(xmlData[i])) {
          continue;
        }
        return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
      }
    }
    if (!tagFound) {
      return getErrorObject("InvalidXml", "Start tag expected.", 1);
    } else if (tags.length == 1) {
      return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
    } else if (tags.length > 0) {
      return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
    }
    return true;
  }
  function isWhiteSpace(char) {
    return char === " " || char === "	" || char === "\n" || char === "\r";
  }
  function readPI(xmlData, i) {
    const start = i;
    for (; i < xmlData.length; i++) {
      if (xmlData[i] == "?" || xmlData[i] == " ") {
        const tagname = xmlData.substr(start, i - start);
        if (i > 5 && tagname === "xml") {
          return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
        } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
          i++;
          break;
        } else {
          continue;
        }
      }
    }
    return i;
  }
  function readCommentAndCDATA(xmlData, i) {
    if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
      for (i += 3; i < xmlData.length; i++) {
        if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
          i += 2;
          break;
        }
      }
    } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
      let angleBracketsCount = 1;
      for (i += 8; i < xmlData.length; i++) {
        if (xmlData[i] === "<") {
          angleBracketsCount++;
        } else if (xmlData[i] === ">") {
          angleBracketsCount--;
          if (angleBracketsCount === 0) {
            break;
          }
        }
      }
    } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
      for (i += 8; i < xmlData.length; i++) {
        if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
          i += 2;
          break;
        }
      }
    }
    return i;
  }
  var doubleQuote = '"';
  var singleQuote = "'";
  function readAttributeStr(xmlData, i) {
    let attrStr = "";
    let startChar = "";
    let tagClosed = false;
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
        if (startChar === "") {
          startChar = xmlData[i];
        } else if (startChar !== xmlData[i]) {
        } else {
          startChar = "";
        }
      } else if (xmlData[i] === ">") {
        if (startChar === "") {
          tagClosed = true;
          break;
        }
      }
      attrStr += xmlData[i];
    }
    if (startChar !== "") {
      return false;
    }
    return {
      value: attrStr,
      index: i,
      tagClosed
    };
  }
  function scanAttributeTokens(attrStr) {
    const tokens = [];
    const len = attrStr.length;
    let i = 0;
    while (i < len) {
      const tokenStart = i;
      while (i < len && isWhiteSpace(attrStr[i])) i++;
      if (i >= len) break;
      if (attrStr[i] === "=") {
        i = tokenStart + 1;
        continue;
      }
      const leadingWs = attrStr.slice(tokenStart, i);
      const nameStart = i;
      while (i < len && !isWhiteSpace(attrStr[i]) && attrStr[i] !== "=") i++;
      const name = attrStr.slice(nameStart, i);
      let equalsGroup;
      let j = i;
      while (j < len && isWhiteSpace(attrStr[j])) j++;
      if (j < len && attrStr[j] === "=") {
        equalsGroup = attrStr.slice(i, j + 1);
        i = j + 1;
      }
      let quoteChar;
      let value2;
      let k = i;
      while (k < len && isWhiteSpace(attrStr[k])) k++;
      if (k < len && (attrStr[k] === '"' || attrStr[k] === "'")) {
        const valueStart = k + 1;
        const closeIdx = attrStr.indexOf(attrStr[k], valueStart);
        if (closeIdx !== -1) {
          quoteChar = attrStr[k];
          value2 = attrStr.slice(valueStart, closeIdx);
          i = closeIdx + 1;
        }
      }
      const token = { startIndex: tokenStart };
      token[1] = leadingWs;
      token[2] = name;
      token[3] = equalsGroup;
      token[4] = quoteChar !== void 0 ? true : void 0;
      token[5] = quoteChar;
      token[6] = value2;
      tokens.push(token);
    }
    return tokens;
  }
  function validateAttributeString(attrStr, options) {
    const matches2 = scanAttributeTokens(attrStr);
    const attrNames = {};
    for (let i = 0; i < matches2.length; i++) {
      if (matches2[i][1].length === 0) {
        return getErrorObject("InvalidAttr", "Attribute '" + matches2[i][2] + "' has no space in starting.", getPositionFromMatch(matches2[i]));
      } else if (matches2[i][3] !== void 0 && matches2[i][4] === void 0) {
        return getErrorObject("InvalidAttr", "Attribute '" + matches2[i][2] + "' is without value.", getPositionFromMatch(matches2[i]));
      } else if (matches2[i][3] === void 0 && !options.allowBooleanAttributes) {
        return getErrorObject("InvalidAttr", "boolean attribute '" + matches2[i][2] + "' is not allowed.", getPositionFromMatch(matches2[i]));
      }
      const attrName = matches2[i][2];
      if (!validateAttrName(attrName)) {
        return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches2[i]));
      }
      if (!Object.prototype.hasOwnProperty.call(attrNames, attrName)) {
        attrNames[attrName] = 1;
      } else {
        return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches2[i]));
      }
    }
    return true;
  }
  function validateNumberAmpersand(xmlData, i) {
    let re = /\d/;
    if (xmlData[i] === "x") {
      i++;
      re = /[\da-fA-F]/;
    }
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === ";")
        return i;
      if (!xmlData[i].match(re))
        break;
    }
    return -1;
  }
  function validateAmpersand(xmlData, i) {
    i++;
    if (xmlData[i] === ";")
      return -1;
    if (xmlData[i] === "#") {
      i++;
      return validateNumberAmpersand(xmlData, i);
    }
    let count = 0;
    for (; i < xmlData.length; i++, count++) {
      if (xmlData[i].match(/\w/) && count < 20)
        continue;
      if (xmlData[i] === ";")
        break;
      return -1;
    }
    return i;
  }
  function getErrorObject(code, message, lineNumber) {
    return {
      err: {
        code,
        msg: message,
        line: lineNumber.line || lineNumber,
        col: lineNumber.col
      }
    };
  }
  function validateAttrName(attrName) {
    return isName(attrName);
  }
  function validateTagName(tagname) {
    return isName(tagname);
  }
  function getLineNumberForPosition(xmlData, index) {
    const lines = xmlData.substring(0, index).split(/\r?\n/);
    return {
      line: lines.length,
      // column number is last line's length + 1, because column numbering starts at 1:
      col: lines[lines.length - 1].length + 1
    };
  }
  function getPositionFromMatch(match2) {
    return match2.startIndex + match2[1].length;
  }

  // node_modules/@nodable/entities/src/entities.js
  var CURRENCY = {
    cent: "\xA2",
    pound: "\xA3",
    curren: "\xA4",
    yen: "\xA5",
    euro: "\u20AC",
    dollar: "$",
    fnof: "\u0192",
    inr: "\u20B9",
    af: "\u060B",
    birr: "\u1265\u122D",
    peso: "\u20B1",
    rub: "\u20BD",
    won: "\u20A9",
    yuan: "\xA5",
    cedil: "\xB8"
  };
  var XML = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"'
  };
  var COMMON_HTML = {
    nbsp: "\xA0",
    copy: "\xA9",
    reg: "\xAE",
    trade: "\u2122",
    mdash: "\u2014",
    ndash: "\u2013",
    hellip: "\u2026",
    laquo: "\xAB",
    raquo: "\xBB",
    lsquo: "\u2018",
    rsquo: "\u2019",
    ldquo: "\u201C",
    rdquo: "\u201D",
    bull: "\u2022",
    para: "\xB6",
    sect: "\xA7",
    deg: "\xB0",
    frac12: "\xBD",
    frac14: "\xBC",
    frac34: "\xBE"
  };

  // node_modules/@nodable/entities/src/EntityDecoder.js
  var ENTITY_ACTION = Object.freeze({
    /** Resolve and expand the entity normally. */
    ALLOW: "allow",
    /** Silently skip this entity — it will not be registered. */
    BLOCK: "block",
    /** Throw an error, aborting entity registration entirely. */
    THROW: "throw"
  });
  var SPECIAL_CHARS = new Set("!?\\\\/[]$%{}^&*()<>|+");
  function validateEntityName(name) {
    if (name[0] === "#") {
      throw new Error(`[EntityReplacer] Invalid character '#' in entity name: "${name}"`);
    }
    for (const ch of name) {
      if (SPECIAL_CHARS.has(ch)) {
        throw new Error(`[EntityReplacer] Invalid character '${ch}' in entity name: "${name}"`);
      }
    }
    return name;
  }
  function mergeEntityMaps(...maps) {
    const out = /* @__PURE__ */ Object.create(null);
    for (const map of maps) {
      if (!map) continue;
      for (const key of Object.keys(map)) {
        const raw = map[key];
        if (typeof raw === "string") {
          out[key] = raw;
        } else if (raw && typeof raw === "object" && raw.val !== void 0) {
          const val = raw.val;
          if (typeof val === "string") {
            out[key] = val;
          }
        }
      }
    }
    return out;
  }
  var LIMIT_TIER_EXTERNAL = "external";
  var LIMIT_TIER_BASE = "base";
  var LIMIT_TIER_ALL = "all";
  function parseLimitTiers(raw) {
    if (!raw || raw === LIMIT_TIER_EXTERNAL) return /* @__PURE__ */ new Set([LIMIT_TIER_EXTERNAL]);
    if (raw === LIMIT_TIER_ALL) return /* @__PURE__ */ new Set([LIMIT_TIER_ALL]);
    if (raw === LIMIT_TIER_BASE) return /* @__PURE__ */ new Set([LIMIT_TIER_BASE]);
    if (Array.isArray(raw)) return new Set(raw);
    return /* @__PURE__ */ new Set([LIMIT_TIER_EXTERNAL]);
  }
  var NCR_LEVEL = Object.freeze({ allow: 0, leave: 1, remove: 2, throw: 3 });
  var XML10_ALLOWED_C0 = /* @__PURE__ */ new Set([9, 10, 13]);
  function parseNCRConfig(ncr) {
    if (!ncr) {
      return { xmlVersion: 1, onLevel: NCR_LEVEL.allow, nullLevel: NCR_LEVEL.remove };
    }
    const xmlVersion = ncr.xmlVersion === 1.1 ? 1.1 : 1;
    const onLevel = NCR_LEVEL[ncr.onNCR] ?? NCR_LEVEL.allow;
    const nullLevel = NCR_LEVEL[ncr.nullNCR] ?? NCR_LEVEL.remove;
    const clampedNull = Math.max(nullLevel, NCR_LEVEL.remove);
    return { xmlVersion, onLevel, nullLevel: clampedNull };
  }
  var EntityDecoder = class {
    /**
     * @param {object} [options]
     * @param {object|null}  [options.namedEntities]        — extra named entities merged into base map
     * @param {object}  [options.limit]                 — security limits
     * @param {number}       [options.limit.maxTotalExpansions=0]  — 0 = unlimited
     * @param {number}       [options.limit.maxExpandedLength=0]   — 0 = unlimited
     * @param {'external'|'base'|'all'|string[]} [options.limit.applyLimitsTo='external']
     *   Which entity tiers count against the security limits:
     *   - 'external' (default) — only input/runtime + persistent external entities
     *   - 'base'               — only DEFAULT_XML_ENTITIES + namedEntities
     *   - 'all'                — every entity regardless of tier
     *   - string[]             — explicit combination, e.g. ['external', 'base']
     * @param {((resolved: string, original: string) => string)|null} [options.postCheck=null]
     * @param {string[]} [options.remove=[]] — entity names (e.g. ['nbsp', '#13']) to delete (replace with empty string)
     * @param {string[]} [options.leave=[]]  — entity names to keep as literal (unchanged in output)
     * @param {object}   [options.ncr]       — Numeric Character Reference controls
     * @param {1.0|1.1}  [options.ncr.xmlVersion=1.0]
     *   XML version governing which codepoint ranges are restricted:
     *   - 1.0 — C0 controls U+0001–U+001F (except U+0009/000A/000D) are prohibited
     *   - 1.1 — C0 controls are allowed when written as NCRs; C1 (U+007F–U+009F) decoded as-is
     * @param {'allow'|'leave'|'remove'|'throw'} [options.ncr.onNCR='allow']
     *   Base action for numeric references. Severity order: allow < leave < remove < throw.
     *   For codepoint ranges that carry a minimum level (surrogates → remove, XML 1.0 C0 → remove),
     *   the effective action is max(onNCR, rangeMinimum).
     * @param {'remove'|'throw'} [options.ncr.nullNCR='remove']
     *   Action for U+0000 (null). 'allow' and 'leave' are clamped to 'remove' since null is never safe.
     * @param {((name: string, value: string) => 'allow'|'block'|'throw')|null} [options.onExternalEntity=null]
     *   Hook called when an external entity is registered via `setExternalEntities()` or
     *   `addExternalEntity()`. Return `ENTITY_ACTION.ALLOW` to accept the entity,
     *   `ENTITY_ACTION.BLOCK` to silently skip it, or `ENTITY_ACTION.THROW` to abort with an error.
     * @param {((name: string, value: string) => 'allow'|'block'|'throw')|null} [options.onInputEntity=null]
     *   Hook called when an input entity is registered via `addInputEntities()`. Return
     *   `ENTITY_ACTION.ALLOW` to accept, `ENTITY_ACTION.BLOCK` to silently skip, or
     *   `ENTITY_ACTION.THROW` to abort with an error.
     */
    constructor(options = {}) {
      this._limit = options.limit || {};
      this._maxTotalExpansions = this._limit.maxTotalExpansions || 0;
      this._maxExpandedLength = this._limit.maxExpandedLength || 0;
      this._postCheck = typeof options.postCheck === "function" ? options.postCheck : (r) => r;
      this._limitTiers = parseLimitTiers(this._limit.applyLimitsTo ?? LIMIT_TIER_EXTERNAL);
      this._numericAllowed = options.numericAllowed ?? true;
      this._baseMap = mergeEntityMaps(XML, options.namedEntities || null);
      this._externalMap = /* @__PURE__ */ Object.create(null);
      this._inputMap = /* @__PURE__ */ Object.create(null);
      this._totalExpansions = 0;
      this._expandedLength = 0;
      this._removeSet = new Set(options.remove && Array.isArray(options.remove) ? options.remove : []);
      this._leaveSet = new Set(options.leave && Array.isArray(options.leave) ? options.leave : []);
      const ncrCfg = parseNCRConfig(options.ncr);
      this._ncrXmlVersion = ncrCfg.xmlVersion;
      this._ncrOnLevel = ncrCfg.onLevel;
      this._ncrNullLevel = ncrCfg.nullLevel;
      this._onExternalEntity = typeof options.onExternalEntity === "function" ? options.onExternalEntity : null;
      this._onInputEntity = typeof options.onInputEntity === "function" ? options.onInputEntity : null;
    }
    // -------------------------------------------------------------------------
    // Private: registration hook dispatch
    // -------------------------------------------------------------------------
    /**
     * Invoke a registration hook for a single entity name/value pair.
     * Returns true when the entity should be accepted, false when it should be
     * silently skipped (BLOCK), and throws when the hook returns THROW.
     *
     * @param {((name: string, value: string) => 'allow'|'block'|'throw')|null} hook
     * @param {string} name
     * @param {string} value
     * @param {string} context  — used in error messages ('external' | 'input')
     * @returns {boolean}  true = accept, false = skip
     */
    _applyRegistrationHook(hook, name, value2, context) {
      if (!hook) return true;
      const action = hook(name, value2);
      if (action === ENTITY_ACTION.BLOCK) return false;
      if (action === ENTITY_ACTION.THROW) {
        throw new Error(
          `[EntityDecoder] Registration of ${context} entity "&${name};" was rejected by hook`
        );
      }
      return true;
    }
    // -------------------------------------------------------------------------
    // Persistent external entity registration
    // -------------------------------------------------------------------------
    /**
     * Replace the full set of persistent external entities.
     * All keys are validated — throws on invalid characters.
     * If `onExternalEntity` is set, it is called once per entry; entries that
     * return `ENTITY_ACTION.BLOCK` are silently omitted, `ENTITY_ACTION.THROW`
     * aborts the whole call.
     * @param {Record<string, string | { regex?: RegExp, val: string }>} map
     */
    setExternalEntities(map) {
      if (map) {
        for (const key of Object.keys(map)) {
          validateEntityName(key);
        }
      }
      if (!this._onExternalEntity) {
        this._externalMap = mergeEntityMaps(map);
        return;
      }
      const flat = mergeEntityMaps(map);
      const filtered = /* @__PURE__ */ Object.create(null);
      for (const [name, value2] of Object.entries(flat)) {
        if (this._applyRegistrationHook(this._onExternalEntity, name, value2, "external")) {
          filtered[name] = value2;
        }
      }
      this._externalMap = filtered;
    }
    /**
     * Add a single persistent external entity.
     * If `onExternalEntity` is set it is called before the entity is stored;
     * `ENTITY_ACTION.BLOCK` silently skips storage, `ENTITY_ACTION.THROW` raises.
     * @param {string} key
     * @param {string} value
     */
    addExternalEntity(key, value2) {
      validateEntityName(key);
      if (typeof value2 === "string" && value2.indexOf("&") === -1) {
        if (this._applyRegistrationHook(this._onExternalEntity, key, value2, "external")) {
          this._externalMap[key] = value2;
        }
      }
    }
    // -------------------------------------------------------------------------
    // Input / runtime entity registration (per document)
    // -------------------------------------------------------------------------
    /**
     * Inject DOCTYPE entities for the current document.
     * Also resets per-document expansion counters.
     * If `onInputEntity` is set it is called once per entry; entries returning
     * `ENTITY_ACTION.BLOCK` are silently omitted, `ENTITY_ACTION.THROW` aborts.
     * @param {Record<string, string | { regx?: RegExp, regex?: RegExp, val: string }>} map
     */
    addInputEntities(map) {
      this._totalExpansions = 0;
      this._expandedLength = 0;
      if (!this._onInputEntity) {
        this._inputMap = mergeEntityMaps(map);
        return;
      }
      const flat = mergeEntityMaps(map);
      const filtered = /* @__PURE__ */ Object.create(null);
      for (const [name, value2] of Object.entries(flat)) {
        if (this._applyRegistrationHook(this._onInputEntity, name, value2, "input")) {
          filtered[name] = value2;
        }
      }
      this._inputMap = filtered;
    }
    // -------------------------------------------------------------------------
    // Per-document reset
    // -------------------------------------------------------------------------
    /**
     * Wipe input/runtime entities and reset counters.
     * Call this before processing each new document.
     * @returns {this}
     */
    reset() {
      this._inputMap = /* @__PURE__ */ Object.create(null);
      this._totalExpansions = 0;
      this._expandedLength = 0;
      return this;
    }
    // -------------------------------------------------------------------------
    // XML version (can be set after construction, e.g. once parser reads <?xml?>)
    // -------------------------------------------------------------------------
    /**
     * Update the XML version used for NCR classification.
     * Call this as soon as the document's `<?xml version="...">` declaration is parsed.
     * @param {1.0|1.1|number} version
     */
    setXmlVersion(version) {
      this._ncrXmlVersion = version === 1.1 ? 1.1 : 1;
    }
    // -------------------------------------------------------------------------
    // Primary API
    // -------------------------------------------------------------------------
    /**
     * Replace all entity references in `str` in a single pass.
     *
     * @param {string} str
     * @returns {string}
     */
    decode(str) {
      if (typeof str !== "string" || str.length === 0) return str;
      if (str.indexOf("&") === -1) return str;
      const original = str;
      const chunks = [];
      const len = str.length;
      let last = 0;
      let i = 0;
      const limitExpansions = this._maxTotalExpansions > 0;
      const limitLength = this._maxExpandedLength > 0;
      const checkLimits = limitExpansions || limitLength;
      while (i < len) {
        if (str.charCodeAt(i) !== 38) {
          i++;
          continue;
        }
        let j = i + 1;
        while (j < len && str.charCodeAt(j) !== 59 && j - i <= 32) j++;
        if (j >= len || str.charCodeAt(j) !== 59) {
          i++;
          continue;
        }
        const token = str.slice(i + 1, j);
        if (token.length === 0) {
          i++;
          continue;
        }
        let replacement;
        let tier;
        if (this._removeSet.has(token)) {
          replacement = "";
          if (tier === void 0) {
            tier = LIMIT_TIER_EXTERNAL;
          }
        } else if (this._leaveSet.has(token)) {
          i++;
          continue;
        } else if (token.charCodeAt(0) === 35) {
          const ncrResult = this._resolveNCR(token);
          if (ncrResult === void 0) {
            i++;
            continue;
          }
          replacement = ncrResult;
          tier = LIMIT_TIER_BASE;
        } else {
          const resolved = this._resolveName(token);
          replacement = resolved?.value;
          tier = resolved?.tier;
        }
        if (replacement === void 0) {
          i++;
          continue;
        }
        if (i > last) chunks.push(str.slice(last, i));
        chunks.push(replacement);
        last = j + 1;
        i = last;
        if (checkLimits && this._tierCounts(tier)) {
          if (limitExpansions) {
            this._totalExpansions++;
            if (this._totalExpansions > this._maxTotalExpansions) {
              throw new Error(
                `[EntityReplacer] Entity expansion count limit exceeded: ${this._totalExpansions} > ${this._maxTotalExpansions}`
              );
            }
          }
          if (limitLength) {
            const delta = replacement.length - (token.length + 2);
            if (delta > 0) {
              this._expandedLength += delta;
              if (this._expandedLength > this._maxExpandedLength) {
                throw new Error(
                  `[EntityReplacer] Expanded content length limit exceeded: ${this._expandedLength} > ${this._maxExpandedLength}`
                );
              }
            }
          }
        }
      }
      if (last < len) chunks.push(str.slice(last));
      const result = chunks.length === 0 ? str : chunks.join("");
      return this._postCheck(result, original);
    }
    // -------------------------------------------------------------------------
    // Private: limit tier check
    // -------------------------------------------------------------------------
    /**
     * Returns true if a resolved entity of the given tier should count
     * against the expansion/length limits.
     * @param {string} tier  — LIMIT_TIER_EXTERNAL | LIMIT_TIER_BASE
     * @returns {boolean}
     */
    _tierCounts(tier) {
      if (this._limitTiers.has(LIMIT_TIER_ALL)) return true;
      return this._limitTiers.has(tier);
    }
    // -------------------------------------------------------------------------
    // Private: entity resolution
    // -------------------------------------------------------------------------
    /**
     * Resolve a named entity token (without & and ;).
     * Priority: inputMap > externalMap > baseMap
     * Returns the resolved value tagged with its limit tier.
     *
     * @param {string} name
     * @returns {{ value: string, tier: string }|undefined}
     */
    _resolveName(name) {
      if (name in this._inputMap) return { value: this._inputMap[name], tier: LIMIT_TIER_EXTERNAL };
      if (name in this._externalMap) return { value: this._externalMap[name], tier: LIMIT_TIER_EXTERNAL };
      if (name in this._baseMap) return { value: this._baseMap[name], tier: LIMIT_TIER_BASE };
      return void 0;
    }
    /**
     * Classify a codepoint and return the minimum action level that must be applied.
     * Returns -1 when no minimum is imposed (normal allow path).
     *
     * Ranges checked (in priority order):
     *   1. U+0000            — null, governed by nullNCR (always ≥ remove)
     *   2. U+D800–U+DFFF     — surrogates, always prohibited (min: remove)
     *   3. U+0001–U+001F \ {0x09,0x0A,0x0D}  — XML 1.0 restricted C0 (min: remove)
     *      (skipped in XML 1.1 — C0 controls are allowed when written as NCRs)
     *
     * @param {number} cp  — codepoint
     * @returns {number}   — minimum NCR_LEVEL value, or -1 for no restriction
     */
    _classifyNCR(cp) {
      if (cp === 0) return this._ncrNullLevel;
      if (cp >= 55296 && cp <= 57343) return NCR_LEVEL.remove;
      if (this._ncrXmlVersion === 1) {
        if (cp >= 1 && cp <= 31 && !XML10_ALLOWED_C0.has(cp)) return NCR_LEVEL.remove;
      }
      return -1;
    }
    /**
     * Execute a resolved NCR action.
     *
     * @param {number} action   — NCR_LEVEL value
     * @param {string} token    — raw token (e.g. '#38') for error messages
     * @param {number} cp       — codepoint, used only for error messages
     * @returns {string|undefined}
     *   - decoded character string  → 'allow'
     *   - ''                        → 'remove'
     *   - undefined                 → 'leave' (caller must skip past '&' only)
     *   - throws Error              → 'throw'
     */
    _applyNCRAction(action, token, cp) {
      switch (action) {
        case NCR_LEVEL.allow:
          return String.fromCodePoint(cp);
        case NCR_LEVEL.remove:
          return "";
        case NCR_LEVEL.leave:
          return void 0;
        // signal: keep literal
        case NCR_LEVEL.throw:
          throw new Error(
            `[EntityDecoder] Prohibited numeric character reference &${token}; (U+${cp.toString(16).toUpperCase().padStart(4, "0")})`
          );
        default:
          return String.fromCodePoint(cp);
      }
    }
    /**
     * Full NCR resolution pipeline for a numeric token.
     *
     * Steps:
     *   1. Parse the codepoint (decimal or hex).
     *   2. Validate the raw codepoint range (NaN, <0, >0x10FFFF).
     *   3. If numericAllowed is false and no minimum restriction applies → leave as-is.
     *   4. Classify the codepoint to find the minimum required action level.
     *   5. Resolve effective action = max(onNCR, minimum).
     *   6. Apply and return.
     *
     * @param {string} token  — e.g. '#38', '#x26', '#X26'
     * @returns {string|undefined}
     *   - string (incl. '')  — replacement ('' = remove)
     *   - undefined          — leave original &token; as-is
     */
    _resolveNCR(token) {
      const second = token.charCodeAt(1);
      let cp;
      if (second === 120 || second === 88) {
        cp = parseInt(token.slice(2), 16);
      } else {
        cp = parseInt(token.slice(1), 10);
      }
      if (Number.isNaN(cp) || cp < 0 || cp > 1114111) return void 0;
      const minimum = this._classifyNCR(cp);
      if (!this._numericAllowed && minimum < NCR_LEVEL.remove) return void 0;
      const effective = minimum === -1 ? this._ncrOnLevel : Math.max(this._ncrOnLevel, minimum);
      return this._applyNCRAction(effective, token, cp);
    }
  };

  // node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
  var defaultOnDangerousProperty = (name) => {
    if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
      return "__" + name;
    }
    return name;
  };
  var defaultOptions2 = {
    preserveOrder: false,
    attributeNamePrefix: "@_",
    attributesGroupName: false,
    textNodeName: "#text",
    ignoreAttributes: true,
    removeNSPrefix: false,
    // remove NS from tag name or attribute name if true
    allowBooleanAttributes: false,
    //a tag can have attributes without any value
    //ignoreRootElement : false,
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: true,
    //Trim string values of tag and attributes
    cdataPropName: false,
    numberParseOptions: {
      hex: true,
      leadingZeros: true,
      eNotation: true,
      unicode: false
    },
    tagValueProcessor: function(tagName, val) {
      return val;
    },
    attributeValueProcessor: function(attrName, val) {
      return val;
    },
    stopNodes: [],
    //nested tags will not be parsed even for errors
    alwaysCreateTextNode: false,
    isArray: () => false,
    commentPropName: false,
    unpairedTags: [],
    processEntities: true,
    htmlEntities: false,
    entityDecoder: null,
    ignoreDeclaration: false,
    ignorePiTags: false,
    transformTagName: false,
    transformAttributeName: false,
    updateTag: function(tagName, jPath, attrs) {
      return tagName;
    },
    // skipEmptyListItem: false
    captureMetaData: false,
    maxNestedTags: 100,
    strictReservedNames: true,
    jPath: true,
    // if true, pass jPath string to callbacks; if false, pass matcher instance
    onDangerousProperty: defaultOnDangerousProperty
  };
  function validatePropertyName(propertyName, optionName) {
    if (typeof propertyName !== "string") {
      return;
    }
    const normalized = propertyName.toLowerCase();
    if (DANGEROUS_PROPERTY_NAMES.some((dangerous) => normalized === dangerous.toLowerCase())) {
      throw new Error(
        `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
      );
    }
    if (criticalProperties.some((dangerous) => normalized === dangerous.toLowerCase())) {
      throw new Error(
        `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
      );
    }
  }
  function normalizeProcessEntities(value2, htmlEntities) {
    if (typeof value2 === "boolean") {
      return {
        enabled: value2,
        // true or false
        maxEntitySize: 1e4,
        maxExpansionDepth: 1e4,
        maxTotalExpansions: Infinity,
        maxExpandedLength: 1e5,
        maxEntityCount: 1e3,
        allowedTags: null,
        tagFilter: null,
        appliesTo: "all"
      };
    }
    if (typeof value2 === "object" && value2 !== null) {
      return {
        enabled: value2.enabled !== false,
        maxEntitySize: Math.max(1, value2.maxEntitySize ?? 1e4),
        maxExpansionDepth: Math.max(1, value2.maxExpansionDepth ?? 1e4),
        maxTotalExpansions: Math.max(1, value2.maxTotalExpansions ?? Infinity),
        maxExpandedLength: Math.max(1, value2.maxExpandedLength ?? 1e5),
        maxEntityCount: Math.max(1, value2.maxEntityCount ?? 1e3),
        allowedTags: value2.allowedTags ?? null,
        tagFilter: value2.tagFilter ?? null,
        appliesTo: value2.appliesTo ?? "all"
      };
    }
    return normalizeProcessEntities(true);
  }
  var buildOptions = function(options) {
    const built = Object.assign({}, defaultOptions2, options);
    const propertyNameOptions = [
      { value: built.attributeNamePrefix, name: "attributeNamePrefix" },
      { value: built.attributesGroupName, name: "attributesGroupName" },
      { value: built.textNodeName, name: "textNodeName" },
      { value: built.cdataPropName, name: "cdataPropName" },
      { value: built.commentPropName, name: "commentPropName" }
    ];
    for (const { value: value2, name } of propertyNameOptions) {
      if (value2) {
        validatePropertyName(value2, name);
      }
    }
    if (built.onDangerousProperty === null) {
      built.onDangerousProperty = defaultOnDangerousProperty;
    }
    built.processEntities = normalizeProcessEntities(built.processEntities, built.htmlEntities);
    built.unpairedTagsSet = new Set(built.unpairedTags);
    if (built.stopNodes && Array.isArray(built.stopNodes)) {
      built.stopNodes = built.stopNodes.map((node) => {
        if (typeof node === "string" && node.startsWith("*.")) {
          return ".." + node.substring(2);
        }
        return node;
      });
    }
    return built;
  };

  // node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
  var METADATA_SYMBOL;
  if (typeof Symbol !== "function") {
    METADATA_SYMBOL = "@@xmlMetadata";
  } else {
    METADATA_SYMBOL = /* @__PURE__ */ Symbol("XML Node Metadata");
  }
  var XmlNode = class {
    constructor(tagname) {
      this.tagname = tagname;
      this.child = [];
      this[":@"] = /* @__PURE__ */ Object.create(null);
    }
    add(key, val) {
      if (key === "__proto__") key = "#__proto__";
      this.child.push({ [key]: val });
    }
    addChild(node, startIndex) {
      if (node.tagname === "__proto__") node.tagname = "#__proto__";
      if (node[":@"] && Object.keys(node[":@"]).length > 0) {
        this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
      } else {
        this.child.push({ [node.tagname]: node.child });
      }
      this.addStartIndex(startIndex);
    }
    addStartIndex(startIndex) {
      if (startIndex !== void 0) {
        this.child[this.child.length - 1][METADATA_SYMBOL] = { startIndex };
      }
    }
    addEndIndex(endIndex) {
      const lastChild = this.child[this.child.length - 1];
      if (lastChild !== void 0 && lastChild[METADATA_SYMBOL] !== void 0 && lastChild[METADATA_SYMBOL].endIndex === void 0) {
        lastChild[METADATA_SYMBOL].endIndex = endIndex;
      }
    }
    /** symbol used for metadata */
    static getMetaDataSymbol() {
      return METADATA_SYMBOL;
    }
  };

  // node_modules/xml-naming/src/index.js
  var nameStartChar10 = ":A-Za-z_\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u0486\u0488-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD";
  var nameChar10 = nameStartChar10 + "\\-\\.\\d\xB7\u0300-\u036F\u203F-\u2040";
  var nameStartChar11 = ":A-Za-z_\xC0-\u02FF\u0370-\u037D\u037F-\u0486\u0488-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}";
  var nameChar11 = nameStartChar11 + "\\-\\.\\d\xB7\u0300-\u036F\u0487\u203F-\u2040";
  var buildRegexes = (startChar, char, flags = "") => {
    const ncStart = startChar.replace(":", "");
    const ncChar = char.replace(":", "");
    const ncNamePat = `[${ncStart}][${ncChar}]*`;
    return {
      name: new RegExp(`^[${startChar}][${char}]*$`, flags),
      ncName: new RegExp(`^${ncNamePat}$`, flags),
      qName: new RegExp(`^${ncNamePat}(?::${ncNamePat})?$`, flags),
      nmToken: new RegExp(`^[${char}]+$`, flags),
      nmTokens: new RegExp(`^[${char}]+(?:\\s+[${char}]+)*$`, flags)
    };
  };
  var regexes10 = buildRegexes(nameStartChar10, nameChar10);
  var regexes11 = buildRegexes(nameStartChar11, nameChar11, "u");
  var nameStartCharAscii = ":A-Za-z_";
  var nameCharAscii = nameStartCharAscii + "\\-\\.\\d";
  var regexesAscii = buildRegexes(nameStartCharAscii, nameCharAscii);
  var getRegexes = (xmlVersion = "1.0", asciiOnly = false) => {
    if (asciiOnly) return regexesAscii;
    return xmlVersion === "1.1" ? regexes11 : regexes10;
  };
  var qName = (str, { xmlVersion = "1.0", asciiOnly = false } = {}) => getRegexes(xmlVersion, asciiOnly).qName.test(str);

  // node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
  var DocTypeReader = class {
    constructor(options, xmlVersion) {
      this.suppressValidationErr = !options;
      this.options = options;
      this.xmlVersion = xmlVersion || 1;
    }
    setXmlVersion(xmlVersion = 1) {
      this.xmlVersion = xmlVersion;
    }
    readDocType(xmlData, i) {
      const entities = /* @__PURE__ */ Object.create(null);
      let entityCount = 0;
      if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
        i = i + 9;
        let angleBracketsCount = 1;
        let hasBody = false, comment = false;
        let quoteChar = null;
        let exp = "";
        for (; i < xmlData.length; i++) {
          if (quoteChar !== null) {
            if (xmlData[i] === quoteChar) quoteChar = null;
            exp += xmlData[i];
            continue;
          }
          if (!hasBody && !comment && (xmlData[i] === '"' || xmlData[i] === "'")) {
            quoteChar = xmlData[i];
            exp += xmlData[i];
            continue;
          }
          if (xmlData[i] === "<" && !comment) {
            if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
              i += 7;
              let entityName, val;
              [entityName, val, i] = this.readEntityExp(xmlData, i + 1, this.suppressValidationErr);
              if (val.indexOf("&") === -1) {
                if (this.options.enabled !== false && this.options.maxEntityCount != null && entityCount >= this.options.maxEntityCount) {
                  throw new Error(
                    `Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`
                  );
                }
                entities[entityName] = val;
                entityCount++;
              }
            } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
              i += 8;
              const { index } = this.readElementExp(xmlData, i + 1);
              i = index;
            } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
              i += 8;
            } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
              i += 9;
              const { index } = this.readNotationExp(xmlData, i + 1, this.suppressValidationErr);
              i = index;
            } else if (hasSeq(xmlData, "!--", i)) comment = true;
            else throw new Error(`Invalid DOCTYPE`);
            angleBracketsCount++;
            exp = "";
          } else if (xmlData[i] === ">") {
            if (comment) {
              if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
                comment = false;
                angleBracketsCount--;
              }
            } else {
              angleBracketsCount--;
            }
            if (angleBracketsCount === 0) {
              break;
            }
          } else if (xmlData[i] === "[") {
            hasBody = true;
          } else {
            exp += xmlData[i];
          }
        }
        if (quoteChar !== null || angleBracketsCount !== 0) {
          throw new Error(`Unclosed DOCTYPE`);
        }
      } else {
        throw new Error(`Invalid Tag instead of DOCTYPE`);
      }
      return { entities, i };
    }
    readEntityExp(xmlData, i) {
      i = skipWhitespace(xmlData, i);
      const startIndex = i;
      while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
        i++;
      }
      let entityName = xmlData.substring(startIndex, i);
      validateEntityName2(entityName, { xmlVersion: this.xmlVersion });
      i = skipWhitespace(xmlData, i);
      if (!this.suppressValidationErr) {
        if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
          throw new Error("External entities are not supported");
        } else if (xmlData[i] === "%") {
          throw new Error("Parameter entities are not supported");
        }
      }
      let entityValue = "";
      [i, entityValue] = this.readIdentifierVal(xmlData, i, "entity");
      if (this.options.enabled !== false && this.options.maxEntitySize != null && entityValue.length > this.options.maxEntitySize) {
        throw new Error(
          `Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`
        );
      }
      i--;
      return [entityName, entityValue, i];
    }
    readNotationExp(xmlData, i) {
      i = skipWhitespace(xmlData, i);
      const startIndex = i;
      while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        i++;
      }
      let notationName = xmlData.substring(startIndex, i);
      !this.suppressValidationErr && validateEntityName2(notationName, { xmlVersion: this.xmlVersion });
      i = skipWhitespace(xmlData, i);
      const identifierType = xmlData.substring(i, i + 6).toUpperCase();
      if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
        throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
      }
      i += identifierType.length;
      i = skipWhitespace(xmlData, i);
      let publicIdentifier = null;
      let systemIdentifier = null;
      if (identifierType === "PUBLIC") {
        [i, publicIdentifier] = this.readIdentifierVal(xmlData, i, "publicIdentifier");
        i = skipWhitespace(xmlData, i);
        if (xmlData[i] === '"' || xmlData[i] === "'") {
          [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
        }
      } else if (identifierType === "SYSTEM") {
        [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
        if (!this.suppressValidationErr && !systemIdentifier) {
          throw new Error("Missing mandatory system identifier for SYSTEM notation");
        }
      }
      return { notationName, publicIdentifier, systemIdentifier, index: --i };
    }
    readIdentifierVal(xmlData, i, type) {
      let identifierVal = "";
      const startChar = xmlData[i];
      if (startChar !== '"' && startChar !== "'") {
        throw new Error(`Expected quoted string, found "${startChar}"`);
      }
      i++;
      const startIndex = i;
      while (i < xmlData.length && xmlData[i] !== startChar) {
        i++;
      }
      identifierVal = xmlData.substring(startIndex, i);
      if (xmlData[i] !== startChar) {
        throw new Error(`Unterminated ${type} value`);
      }
      i++;
      return [i, identifierVal];
    }
    readElementExp(xmlData, i) {
      i = skipWhitespace(xmlData, i);
      const startIndex = i;
      while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        i++;
      }
      let elementName = xmlData.substring(startIndex, i);
      if (!this.suppressValidationErr && !qName(elementName, { xmlVersion: this.xmlVersion })) {
        throw new Error(`Invalid element name: "${elementName}"`);
      }
      i = skipWhitespace(xmlData, i);
      let contentModel = "";
      if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) i += 4;
      else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) i += 2;
      else if (xmlData[i] === "(") {
        i++;
        const startIndex2 = i;
        while (i < xmlData.length && xmlData[i] !== ")") {
          i++;
        }
        contentModel = xmlData.substring(startIndex2, i);
        if (xmlData[i] !== ")") {
          throw new Error("Unterminated content model");
        }
      } else if (!this.suppressValidationErr) {
        throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
      }
      return {
        elementName,
        contentModel: contentModel.trim(),
        index: i
      };
    }
    readAttlistExp(xmlData, i) {
      i = skipWhitespace(xmlData, i);
      let startIndex = i;
      while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        i++;
      }
      let elementName = xmlData.substring(startIndex, i);
      validateEntityName2(elementName, { xmlVersion: this.xmlVersion });
      i = skipWhitespace(xmlData, i);
      startIndex = i;
      while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        i++;
      }
      let attributeName = xmlData.substring(startIndex, i);
      if (!validateEntityName2(attributeName, { xmlVersion: this.xmlVersion })) {
        throw new Error(`Invalid attribute name: "${attributeName}"`);
      }
      i = skipWhitespace(xmlData, i);
      let attributeType = "";
      if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
        attributeType = "NOTATION";
        i += 8;
        i = skipWhitespace(xmlData, i);
        if (xmlData[i] !== "(") {
          throw new Error(`Expected '(', found "${xmlData[i]}"`);
        }
        i++;
        let allowedNotations = [];
        while (i < xmlData.length && xmlData[i] !== ")") {
          const startIndex2 = i;
          while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
            i++;
          }
          let notation = xmlData.substring(startIndex2, i);
          notation = notation.trim();
          if (!validateEntityName2(notation, { xmlVersion: this.xmlVersion })) {
            throw new Error(`Invalid notation name: "${notation}"`);
          }
          allowedNotations.push(notation);
          if (xmlData[i] === "|") {
            i++;
            i = skipWhitespace(xmlData, i);
          }
        }
        if (xmlData[i] !== ")") {
          throw new Error("Unterminated list of notations");
        }
        i++;
        attributeType += " (" + allowedNotations.join("|") + ")";
      } else {
        const startIndex2 = i;
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          i++;
        }
        attributeType += xmlData.substring(startIndex2, i);
        const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
        if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) {
          throw new Error(`Invalid attribute type: "${attributeType}"`);
        }
      }
      i = skipWhitespace(xmlData, i);
      let defaultValue = "";
      if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
        defaultValue = "#REQUIRED";
        i += 8;
      } else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
        defaultValue = "#IMPLIED";
        i += 7;
      } else {
        [i, defaultValue] = this.readIdentifierVal(xmlData, i, "ATTLIST");
      }
      return {
        elementName,
        attributeName,
        attributeType,
        defaultValue,
        index: i
      };
    }
  };
  var skipWhitespace = (data, index) => {
    while (index < data.length && /\s/.test(data[index])) {
      index++;
    }
    return index;
  };
  function hasSeq(data, seq, i) {
    for (let j = 0; j < seq.length; j++) {
      if (seq[j] !== data[i + j + 1]) return false;
    }
    return true;
  }
  function validateEntityName2(name, xmlVersion) {
    if (qName(name, { xmlVersion }))
      return name;
    else
      throw new Error(`Invalid entity name ${name}`);
  }

  // node_modules/anynum/digitTable.js
  var SCRIPT_ZEROS = [
    // Basic Latin (ASCII) — included for completeness / pass-through
    48,
    // 0-9
    // Arabic scripts
    1632,
    // Arabic-Indic ٠١٢٣٤٥٦٧٨٩
    1776,
    // Extended Arabic-Indic (Urdu/Persian/Sindhi) ۰۱۲۳
    // Indic scripts
    2406,
    // Devanagari ०१२३४५६७८९
    2534,
    // Bengali ০১২৩৪৫৬৭৮৯
    2662,
    // Gurmukhi ੦੧੨੩੪੫੬੭੮੯
    2790,
    // Gujarati ૦૧૨૩૪૫૬૭૮૯
    2918,
    // Odia ୦୧୨୩୪୫୬୭୮୯
    3046,
    // Tamil ௦௧௨௩௪௫௬௭௮௯
    3174,
    // Telugu ౦౧౨౩౪౫౬౭౮౯
    3302,
    // Kannada ೦೧೨೩೪೫೬೭೮೯
    3430,
    // Malayalam ൦൧൨൩൪൫൬൭൮൯
    3558,
    // Sinhala Archaic ෦෧෨෩෪෫෬෭෮෯
    // Southeast Asian scripts
    3664,
    // Thai ๐๑๒๓๔๕๖๗๘๙
    3792,
    // Lao ໐໑໒໓໔໕໖໗໘໙
    3872,
    // Tibetan ༠༡༢༣༤༥༦༧༨༩
    4160,
    // Myanmar ၀၁၂၃၄၅၆၇၈၉
    4240,
    // Myanmar Shan ႐႑႒႓႔႕႖႗႘႙
    6112,
    // Khmer ០១២៣៤៥៦៧៨៩
    6160,
    // Mongolian ᠐᠑᠒᠓᠔᠕᠖᠗᠘᠙
    6470,
    // Limbu ᥆᥇᥈᥉᥊᥋᥌᥍᥎᥏
    6608,
    // New Tai Lue ᧐᧑᧒᧓᧔᧕᧖᧗᧘᧙
    6784,
    // Tai Tham Hora ᪀᪁᪂᪃᪄᪅᪆᪇᪈᪉
    6800,
    // Tai Tham Tham ᪐᪑᪒᪓᪔᪕᪖᪗᪘᪙
    6992,
    // Balinese ᭐᭑᭒᭓᭔᭕᭖᭗᭘᭙
    7088,
    // Sundanese ᮰᮱᮲᮳᮴᮵᮶᮷᮸᮹
    7232,
    // Lepcha ᱀᱁᱂᱃᱄᱅᱆᱇᱈᱉
    7248,
    // Ol Chiki ᱐᱑᱒᱓᱔᱕᱖᱗᱘᱙
    // Fullwidth (CJK context)
    65296,
    // Fullwidth ０１２３４５６７８９
    // Mathematical digit variants (Unicode math block)
    120782,
    // Mathematical Bold
    120792,
    // Mathematical Double-Struck
    120802,
    // Mathematical Sans-Serif
    120812,
    // Mathematical Sans-Serif Bold
    120822,
    // Mathematical Monospace
    // Other scripts
    66720,
    // Osmanya 𐒠𐒡𐒢𐒣𐒤𐒥𐒦𐒧𐒨𐒩
    68912,
    // Hanifi Rohingya 𐴰𐴱𐴲𐴳𐴴𐴵𐴶𐴷𐴸𐴹
    69734,
    // Brahmi 𑁦𑁧𑁨𑁩𑁪𑁫𑁬𑁭𑁮𑁯
    69872,
    // Sora Sompeng 𑃰𑃱𑃲𑃳𑃴𑃵𑃶𑃷𑃸𑃹
    69942,
    // Chakma 𑄶𑄷𑄸𑄹𑄺𑄻𑄼𑄽𑄾𑄿
    70096,
    // Sharada 𑇐𑇑𑇒𑇓𑇔𑇕𑇖𑇗𑇘𑇙
    70384,
    // Khudawadi 𑋰𑋱𑋲𑋳𑋴𑋵𑋶𑋷𑋸𑋹
    70736,
    // Newa 𑑐𑑑𑑒𑑓𑑔𑑕𑑖𑑗𑑘𑑙
    70864,
    // Tirhuta 𑓐𑓑𑓒𑓓𑓔𑓕𑓖𑓗𑓘𑓙
    71248,
    // Modi 𑙐𑙑𑙒𑙓𑙔𑙕𑙖𑙗𑙘𑙙
    71360,
    // Takri 𑛀𑛁𑛂𑛃𑛄𑛅𑛆𑛇𑛈𑛉
    71472,
    // Ahom 𑜰𑜱𑜲𑜳𑜴𑜵𑜶𑜷𑜸𑜹
    71904,
    // Warang Citi 𑣠𑣡𑣢𑣣𑣤𑣥𑣦𑣧𑣨𑣩
    72016,
    // Dives Akuru 𑥐𑥑𑥒𑥓𑥔𑥕𑥖𑥗𑥘𑥙
    72688,
    // Khitan Small Script 𑯰𑯱𑯲𑯳𑯴𑯵𑯶𑯷𑯸𑯹
    72784,
    // Bhaiksuki 𑱐𑱑𑱒𑱓𑱔𑱕𑱖𑱗𑱘𑱙
    73040,
    // Masaram Gondi 𑵐𑵑𑵒𑵓𑵔𑵕𑵖𑵗𑵘𑵙
    73120,
    // Gunjala Gondi 𑶠𑶡𑶢𑶣𑶤𑶥𑶦𑶧𑶨𑶩
    73552,
    // Kawi 𑽐𑽑𑽒𑽓𑽔𑽕𑽖𑽗𑽘𑽙
    92768,
    // Mro 𖩠𖩡𖩢𖩣𖩤𖩥𖩦𖩧𖩨𖩩
    92864,
    // Tangsa 𖫀𖫁𖫂𖫃𖫄𖫅𖫆𖫇𖫈𖫉
    93008,
    // Pahawh Hmong 𖭐𖭑𖭒𖭓𖭔𖭕𖭖𖭗𖭘𖭙
    123200,
    // Nyiakeng Puachue Hmong 𞅀𞅁𞅂𞅃𞅄𞅅𞅆𞅇𞅈𞅉
    123632,
    // Wancho 𞋰𞋱𞋲𞋳𞋴𞋵𞋶𞋷𞋸𞋹
    124144,
    // Nag Mundari 𞓰𞓱𞓲𞓳𞓴𞓵𞓶𞓷𞓸𞓹
    125264,
    // Adlam 𞥐𞥑𞥒𞥓𞥔𞥕𞥖𞥗𞥘𞥙
    130032
    // Segmented digit symbols 🯰🯱🯲🯳🯴🯵🯶🯷🯸🯹
  ];
  var NOT_DIGIT = 255;
  var HIGH_MAP = /* @__PURE__ */ new Map();
  var LOW_MAX = 65535;
  var LOW_MIN = 1632;
  var TABLE_OFFSET = LOW_MIN;
  var TABLE_SIZE = LOW_MAX - LOW_MIN + 1;
  var TABLE = new Uint8Array(TABLE_SIZE).fill(NOT_DIGIT);
  for (const zero of SCRIPT_ZEROS) {
    for (let d = 0; d < 10; d++) {
      const cp = zero + d;
      if (cp <= LOW_MAX) {
        TABLE[cp - TABLE_OFFSET] = d;
      } else {
        HIGH_MAP.set(cp, d);
      }
    }
  }

  // node_modules/anynum/anynum.js
  var CHAR_0 = 48;
  var CHAR_9 = 57;
  var CHAR_MINUS = 45;
  var MINUS_SET = /* @__PURE__ */ new Set([8722, 65293, 65123]);
  function anynum(str) {
    if (typeof str !== "string") return str;
    const len = str.length;
    if (len === 0) return str;
    let firstHit = -1;
    for (let i = 0; i < len; i++) {
      const cc = str.charCodeAt(i);
      if (cc >= CHAR_0 && cc <= CHAR_9 || cc === CHAR_MINUS) continue;
      if (cc < TABLE_OFFSET) {
        if (MINUS_SET.has(cc)) {
          firstHit = i;
          break;
        }
        continue;
      }
      if (cc >= 55296 && cc <= 56319) {
        if (i + 1 < len) {
          const low = str.charCodeAt(i + 1);
          if (low >= 56320 && low <= 57343) {
            const cp = 65536 + (cc - 55296 << 10) + (low - 56320);
            if (HIGH_MAP.has(cp)) {
              firstHit = i;
              break;
            }
          }
        }
        continue;
      }
      if (TABLE[cc - TABLE_OFFSET] !== NOT_DIGIT || MINUS_SET.has(cc)) {
        firstHit = i;
        break;
      }
    }
    if (firstHit === -1) return str;
    const chars = [];
    if (firstHit > 0) chars.push(str.slice(0, firstHit));
    for (let i = firstHit; i < len; i++) {
      const cc = str.charCodeAt(i);
      if (cc >= CHAR_0 && cc <= CHAR_9 || cc === CHAR_MINUS) {
        chars.push(str[i]);
        continue;
      }
      if (cc < TABLE_OFFSET) {
        chars.push(MINUS_SET.has(cc) ? "-" : str[i]);
        continue;
      }
      if (cc >= 55296 && cc <= 56319) {
        if (i + 1 < len) {
          const low = str.charCodeAt(i + 1);
          if (low >= 56320 && low <= 57343) {
            const cp = 65536 + (cc - 55296 << 10) + (low - 56320);
            const d2 = HIGH_MAP.get(cp);
            if (d2 !== void 0) {
              chars.push(String.fromCharCode(d2 + 48));
              i++;
              continue;
            }
          }
        }
        chars.push(str[i]);
        continue;
      }
      if (MINUS_SET.has(cc)) {
        chars.push("-");
        continue;
      }
      const d = TABLE[cc - TABLE_OFFSET];
      chars.push(d !== NOT_DIGIT ? String.fromCharCode(d + 48) : str[i]);
    }
    return chars.join("");
  }
  var anynum_default = anynum;

  // node_modules/strnum/strnum.js
  var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
  var binRegex = /^0b[01]+$/;
  var octRegex = /^0o[0-7]+$/;
  var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
  var consider = {
    hex: true,
    binary: false,
    octal: false,
    leadingZeros: true,
    decimalPoint: ".",
    eNotation: true,
    //skipLike: /regex/,
    infinity: "original",
    // "null", "infinity" (Infinity type), "string" ("Infinity" (the string literal))
    unicode: false
  };
  function toNumber(str, options = {}) {
    options = Object.assign({}, consider, options);
    if (!str || typeof str !== "string") return str;
    let trimmedStr = str.trim();
    if (trimmedStr.length === 0) return str;
    else if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
    else if (trimmedStr === "0") return 0;
    if (options.unicode) {
      trimmedStr = anynum_default(trimmedStr);
      if (trimmedStr === "0") return 0;
    }
    if (options.hex && hexRegex.test(trimmedStr)) {
      return parse_int(trimmedStr, 16);
    } else if (options.binary && binRegex.test(trimmedStr)) {
      return parse_int(trimmedStr, 2);
    } else if (options.octal && octRegex.test(trimmedStr)) {
      return parse_int(trimmedStr, 8);
    } else if (!isFinite(trimmedStr)) {
      const num = Number(trimmedStr);
      if (Number.isNaN(num)) return str;
      return handleInfinity(str, num, options);
    } else if (trimmedStr.includes("e") || trimmedStr.includes("E")) {
      return resolveEnotation(str, trimmedStr, options);
    } else {
      const match2 = numRegex.exec(trimmedStr);
      if (match2) {
        const sign = match2[1] || "";
        const leadingZeros = match2[2];
        let numTrimmedByZeros = trimZeros(match2[3]);
        const decimalAdjacentToLeadingZeros = sign ? (
          // 0., -00., 000.
          trimmedStr[leadingZeros.length + 1] === "."
        ) : trimmedStr[leadingZeros.length] === ".";
        if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) {
          return str;
        } else {
          const num = Number(trimmedStr);
          const parsedStr = String(num);
          if (num === 0) return num;
          if (parsedStr.search(/[eE]/) !== -1) {
            if (options.eNotation) return num;
            else return str;
          } else if (trimmedStr.indexOf(".") !== -1) {
            if (parsedStr === "0") return num;
            else if (parsedStr === numTrimmedByZeros) return num;
            else if (parsedStr === `${sign}${numTrimmedByZeros}`) return num;
            else return str;
          }
          let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
          if (leadingZeros) {
            return n === parsedStr || sign + n === parsedStr ? num : str;
          } else {
            return n === parsedStr || n === sign + parsedStr ? num : str;
          }
        }
      } else {
        return str;
      }
    }
  }
  var eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
  function resolveEnotation(str, trimmedStr, options) {
    if (!options.eNotation) return str;
    const notation = trimmedStr.match(eNotationRegx);
    if (notation) {
      let sign = notation[1] || "";
      const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
      const leadingZeros = notation[2];
      const eAdjacentToLeadingZeros = sign ? (
        // 0E.
        trimmedStr[leadingZeros.length + 1] === eChar
      ) : trimmedStr[leadingZeros.length] === eChar;
      if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str;
      else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) {
        return Number(trimmedStr);
      } else if (leadingZeros.length > 0) {
        if (options.leadingZeros && !eAdjacentToLeadingZeros) {
          return Number(trimmedStr);
        } else return str;
      } else {
        return Number(trimmedStr);
      }
    } else {
      return str;
    }
  }
  function trimZeros(numStr) {
    if (numStr && numStr.indexOf(".") !== -1) {
      let end = numStr.length;
      while (end > 0 && numStr.charCodeAt(end - 1) === 48) end--;
      numStr = numStr.slice(0, end);
      if (numStr === ".") numStr = "0";
      else if (numStr[0] === ".") numStr = "0" + numStr;
      else if (numStr[numStr.length - 1] === ".") numStr = numStr.substring(0, numStr.length - 1);
      return numStr;
    }
    return numStr;
  }
  function parse_int(numStr, base) {
    const str = numStr.trim();
    if (base === 2 || base === 8) numStr = str.substring(2);
    if (parseInt) return parseInt(numStr, base);
    else if (Number.parseInt) return Number.parseInt(numStr, base);
    else if (window && window.parseInt) return window.parseInt(numStr, base);
    else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
  }
  function handleInfinity(str, num, options) {
    const isPositive = num === Infinity;
    switch (options.infinity.toLowerCase()) {
      case "null":
        return null;
      case "infinity":
        return num;
      // Return Infinity or -Infinity
      case "string":
        return isPositive ? "Infinity" : "-Infinity";
      case "original":
      default:
        return str;
    }
  }

  // node_modules/fast-xml-parser/src/ignoreAttributes.js
  function getIgnoreAttributesFn(ignoreAttributes) {
    if (typeof ignoreAttributes === "function") {
      return ignoreAttributes;
    }
    if (Array.isArray(ignoreAttributes)) {
      return (attrName) => {
        for (const pattern of ignoreAttributes) {
          if (typeof pattern === "string" && attrName === pattern) {
            return true;
          }
          if (pattern instanceof RegExp && pattern.test(attrName)) {
            return true;
          }
        }
      };
    }
    return () => false;
  }

  // node_modules/path-expression-matcher/src/Expression.js
  var Expression = class {
    /**
     * Create a new Expression
     * @param {string} pattern - Pattern string (e.g., "root.users.user", "..user[id]")
     * @param {Object} options - Configuration options
     * @param {string} options.separator - Path separator (default: '.')
     */
    constructor(pattern, options = {}, data) {
      this.pattern = pattern;
      this.separator = options.separator || ".";
      this.segments = this._parse(pattern);
      this.data = data;
      this._hasDeepWildcard = this.segments.some((seg) => seg.type === "deep-wildcard");
      this._hasAttributeCondition = this.segments.some((seg) => seg.attrName !== void 0);
      this._hasPositionSelector = this.segments.some((seg) => seg.position !== void 0);
    }
    /**
     * Parse pattern string into segments
     * @private
     * @param {string} pattern - Pattern to parse
     * @returns {Array} Array of segment objects
     */
    _parse(pattern) {
      const segments = [];
      let i = 0;
      let currentPart = "";
      while (i < pattern.length) {
        if (pattern[i] === this.separator) {
          if (i + 1 < pattern.length && pattern[i + 1] === this.separator) {
            if (currentPart.trim()) {
              segments.push(this._parseSegment(currentPart.trim()));
              currentPart = "";
            }
            segments.push({ type: "deep-wildcard" });
            i += 2;
          } else {
            if (currentPart.trim()) {
              segments.push(this._parseSegment(currentPart.trim()));
            }
            currentPart = "";
            i++;
          }
        } else {
          currentPart += pattern[i];
          i++;
        }
      }
      if (currentPart.trim()) {
        segments.push(this._parseSegment(currentPart.trim()));
      }
      return segments;
    }
    /**
     * Parse a single segment
     * @private
     * @param {string} part - Segment string (e.g., "user", "ns::user", "user[id]", "ns::user:first")
     * @returns {Object} Segment object
     */
    _parseSegment(part) {
      const segment = { type: "tag" };
      let bracketContent = null;
      let withoutBrackets = part;
      const bracketMatch = part.match(/^([^\[]+)(\[[^\]]*\])(.*)$/);
      if (bracketMatch) {
        withoutBrackets = bracketMatch[1] + bracketMatch[3];
        if (bracketMatch[2]) {
          const content = bracketMatch[2].slice(1, -1);
          if (content) {
            bracketContent = content;
          }
        }
      }
      let namespace = void 0;
      let tagAndPosition = withoutBrackets;
      if (withoutBrackets.includes("::")) {
        const nsIndex = withoutBrackets.indexOf("::");
        namespace = withoutBrackets.substring(0, nsIndex).trim();
        tagAndPosition = withoutBrackets.substring(nsIndex + 2).trim();
        if (!namespace) {
          throw new Error(`Invalid namespace in pattern: ${part}`);
        }
      }
      let tag = void 0;
      let positionMatch = null;
      if (tagAndPosition.includes(":")) {
        const colonIndex = tagAndPosition.lastIndexOf(":");
        const tagPart = tagAndPosition.substring(0, colonIndex).trim();
        const posPart = tagAndPosition.substring(colonIndex + 1).trim();
        const isPositionKeyword = ["first", "last", "odd", "even"].includes(posPart) || /^nth\(\d+\)$/.test(posPart);
        if (isPositionKeyword) {
          tag = tagPart;
          positionMatch = posPart;
        } else {
          tag = tagAndPosition;
        }
      } else {
        tag = tagAndPosition;
      }
      if (!tag) {
        throw new Error(`Invalid segment pattern: ${part}`);
      }
      segment.tag = tag;
      if (namespace) {
        segment.namespace = namespace;
      }
      if (bracketContent) {
        if (bracketContent.includes("=")) {
          const eqIndex = bracketContent.indexOf("=");
          segment.attrName = bracketContent.substring(0, eqIndex).trim();
          segment.attrValue = bracketContent.substring(eqIndex + 1).trim();
        } else {
          segment.attrName = bracketContent.trim();
        }
      }
      if (positionMatch) {
        const nthMatch = positionMatch.match(/^nth\((\d+)\)$/);
        if (nthMatch) {
          segment.position = "nth";
          segment.positionValue = parseInt(nthMatch[1], 10);
        } else {
          segment.position = positionMatch;
        }
      }
      return segment;
    }
    /**
     * Get the number of segments
     * @returns {number}
     */
    get length() {
      return this.segments.length;
    }
    /**
     * Check if expression contains deep wildcard
     * @returns {boolean}
     */
    hasDeepWildcard() {
      return this._hasDeepWildcard;
    }
    /**
     * Check if expression has attribute conditions
     * @returns {boolean}
     */
    hasAttributeCondition() {
      return this._hasAttributeCondition;
    }
    /**
     * Check if expression has position selectors
     * @returns {boolean}
     */
    hasPositionSelector() {
      return this._hasPositionSelector;
    }
    /**
     * Get string representation
     * @returns {string}
     */
    toString() {
      return this.pattern;
    }
  };

  // node_modules/path-expression-matcher/src/ExpressionSet.js
  var ExpressionSet = class {
    constructor() {
      this._byDepthAndTag = /* @__PURE__ */ new Map();
      this._wildcardByDepth = /* @__PURE__ */ new Map();
      this._deepWildcards = [];
      this._deepByTerminalTag = /* @__PURE__ */ new Map();
      this._patterns = /* @__PURE__ */ new Set();
      this._sealed = false;
    }
    /**
     * Add an Expression to the set.
     * Duplicate patterns (same pattern string) are silently ignored.
     *
     * @param {import('./Expression.js').default} expression - A pre-constructed Expression instance
     * @returns {this} for chaining
     * @throws {TypeError} if called after seal()
     *
     * @example
     * set.add(new Expression('root.users.user'));
     * set.add(new Expression('..script'));
     */
    add(expression) {
      if (this._sealed) {
        throw new TypeError(
          "ExpressionSet is sealed. Create a new ExpressionSet to add more expressions."
        );
      }
      if (this._patterns.has(expression.pattern)) return this;
      this._patterns.add(expression.pattern);
      if (expression.hasDeepWildcard()) {
        const lastSeg2 = expression.segments[expression.segments.length - 1];
        if (lastSeg2 && lastSeg2.type !== "deep-wildcard" && lastSeg2.tag !== "*") {
          const tag2 = lastSeg2.tag;
          if (!this._deepByTerminalTag.has(tag2)) this._deepByTerminalTag.set(tag2, []);
          this._deepByTerminalTag.get(tag2).push(expression);
        } else {
          this._deepWildcards.push(expression);
        }
        return this;
      }
      const depth2 = expression.length;
      const lastSeg = expression.segments[expression.segments.length - 1];
      const tag = lastSeg?.tag;
      if (!tag || tag === "*") {
        if (!this._wildcardByDepth.has(depth2)) this._wildcardByDepth.set(depth2, []);
        this._wildcardByDepth.get(depth2).push(expression);
      } else {
        const key = `${depth2}:${tag}`;
        if (!this._byDepthAndTag.has(key)) this._byDepthAndTag.set(key, []);
        this._byDepthAndTag.get(key).push(expression);
      }
      return this;
    }
    /**
     * Add multiple expressions at once.
     *
     * @param {import('./Expression.js').default[]} expressions - Array of Expression instances
     * @returns {this} for chaining
     *
     * @example
     * set.addAll([
     *   new Expression('root.users.user'),
     *   new Expression('root.config.setting'),
     * ]);
     */
    addAll(expressions) {
      for (const expr of expressions) this.add(expr);
      return this;
    }
    /**
     * Check whether a pattern string is already present in the set.
     *
     * @param {import('./Expression.js').default} expression
     * @returns {boolean}
     */
    has(expression) {
      return this._patterns.has(expression.pattern);
    }
    /**
     * Number of expressions in the set.
     * @type {number}
     */
    get size() {
      return this._patterns.size;
    }
    /**
     * Seal the set against further modifications.
     * Useful to prevent accidental mutations after config is built.
     * Calling add() or addAll() on a sealed set throws a TypeError.
     *
     * @returns {this}
     */
    seal() {
      this._sealed = true;
      return this;
    }
    /**
     * Whether the set has been sealed.
     * @type {boolean}
     */
    get isSealed() {
      return this._sealed;
    }
    /**
     * Test whether the matcher's current path matches any expression in the set.
     *
     * Evaluation order (cheapest → most expensive):
     *  1. Exact depth + tag bucket  — O(1) lookup, typically 0–2 expressions
     *  2. Depth-only wildcard bucket — O(1) lookup, rare
     *  3. Deep-wildcard list         — always checked, but usually small
     *
     * @param {import('./Matcher.js').default} matcher - Matcher instance (or readOnly view)
     * @returns {boolean} true if any expression matches the current path
     *
     * @example
     * if (stopNodes.matchesAny(matcher)) {
     *   // handle stop node
     * }
     */
    matchesAny(matcher) {
      return this.findMatch(matcher) !== null;
    }
    /**
    * Find and return the first Expression that matches the matcher's current path.
    *
    * Uses the same evaluation order as matchesAny (cheapest → most expensive):
    *  1. Exact depth + tag bucket
    *  2. Depth-only wildcard bucket
    *  3. Deep-wildcard list
    *
    * @param {import('./Matcher.js').default} matcher - Matcher instance (or readOnly view)
    * @returns {import('./Expression.js').default | null} the first matching Expression, or null
    *
    * @example
    * const expr = stopNodes.findMatch(matcher);
    * if (expr) {
    *   // access expr.config, expr.pattern, etc.
    * }
    */
    findMatch(matcher) {
      const depth2 = matcher.getDepth();
      const tag = matcher.getCurrentTag();
      const exactKey = `${depth2}:${tag}`;
      const exactBucket = this._byDepthAndTag.get(exactKey);
      if (exactBucket) {
        for (let i = 0; i < exactBucket.length; i++) {
          if (matcher.matches(exactBucket[i])) return exactBucket[i];
        }
      }
      const wildcardBucket = this._wildcardByDepth.get(depth2);
      if (wildcardBucket) {
        for (let i = 0; i < wildcardBucket.length; i++) {
          if (matcher.matches(wildcardBucket[i])) return wildcardBucket[i];
        }
      }
      const deepBucket = this._deepByTerminalTag.get(tag);
      if (deepBucket) {
        for (let i = 0; i < deepBucket.length; i++) {
          if (matcher.matches(deepBucket[i])) return deepBucket[i];
        }
      }
      for (let i = 0; i < this._deepWildcards.length; i++) {
        if (matcher.matches(this._deepWildcards[i])) return this._deepWildcards[i];
      }
      return null;
    }
  };

  // node_modules/path-expression-matcher/src/Matcher.js
  var MatcherView = class {
    /**
     * @param {Matcher} matcher - The parent Matcher instance to read from.
     */
    constructor(matcher) {
      this._matcher = matcher;
    }
    /**
     * Get the path separator used by the parent matcher.
     * @returns {string}
     */
    get separator() {
      return this._matcher.separator;
    }
    /**
     * Get current tag name.
     * @returns {string|undefined}
     */
    getCurrentTag() {
      const path = this._matcher.path;
      return path.length > 0 ? path[path.length - 1].tag : void 0;
    }
    /**
     * Get current namespace.
     * @returns {string|undefined}
     */
    getCurrentNamespace() {
      const path = this._matcher.path;
      return path.length > 0 ? path[path.length - 1].namespace : void 0;
    }
    /**
     * Get current node's attribute value.
     * @param {string} attrName
     * @returns {*}
     */
    getAttrValue(attrName) {
      const path = this._matcher.path;
      if (path.length === 0) return void 0;
      return path[path.length - 1].values?.[attrName];
    }
    /**
     * Check if current node has an attribute.
     * @param {string} attrName
     * @returns {boolean}
     */
    hasAttr(attrName) {
      const path = this._matcher.path;
      if (path.length === 0) return false;
      const current = path[path.length - 1];
      return current.values !== void 0 && attrName in current.values;
    }
    /**
     * Get the value of a "kept" attribute from the nearest ancestor (or
     * current node) that declared it via `push(tag, attrs, ns, { keep: [...] })`.
     * @param {string} attrName
     * @returns {*}
     */
    getAnyParentAttr(attrName) {
      return this._matcher.getAnyParentAttr(attrName);
    }
    /**
     * Check whether any ancestor (or the current node) kept the given
     * attribute via `push(tag, attrs, ns, { keep: [...] })`.
     * @param {string} attrName
     * @returns {boolean}
     */
    hasAnyParentAttr(attrName) {
      return this._matcher.hasAnyParentAttr(attrName);
    }
    /**
     * Get current node's sibling position (child index in parent).
     * @returns {number}
     */
    getPosition() {
      const path = this._matcher.path;
      if (path.length === 0) return -1;
      return path[path.length - 1].position ?? 0;
    }
    /**
     * Get current node's repeat counter (occurrence count of this tag name).
     * @returns {number}
     */
    getCounter() {
      const path = this._matcher.path;
      if (path.length === 0) return -1;
      return path[path.length - 1].counter ?? 0;
    }
    /**
     * Get current node's sibling index (alias for getPosition).
     * @returns {number}
     * @deprecated Use getPosition() or getCounter() instead
     */
    getIndex() {
      return this.getPosition();
    }
    /**
     * Get current path depth.
     * @returns {number}
     */
    getDepth() {
      return this._matcher.path.length;
    }
    /**
     * Get path as string.
     * @param {string} [separator] - Optional separator (uses default if not provided)
     * @param {boolean} [includeNamespace=true]
     * @returns {string}
     */
    toString(separator, includeNamespace = true) {
      return this._matcher.toString(separator, includeNamespace);
    }
    /**
     * Get path as array of tag names.
     * @returns {string[]}
     */
    toArray() {
      return this._matcher.path.map((n) => n.tag);
    }
    /**
     * Match current path against an Expression.
     * @param {Expression} expression
     * @returns {boolean}
     */
    matches(expression) {
      return this._matcher.matches(expression);
    }
    /**
     * Match any expression in the given set against the current path.
     * @param {ExpressionSet} exprSet
     * @returns {boolean}
     */
    matchesAny(exprSet) {
      return exprSet.matchesAny(this._matcher);
    }
  };
  var Matcher = class {
    /**
     * Create a new Matcher.
     * @param {Object} [options={}]
     * @param {string} [options.separator='.'] - Default path separator
     */
    constructor(options = {}) {
      this.separator = options.separator || ".";
      this.path = [];
      this.siblingStacks = [];
      this._pathStringCache = null;
      this._view = new MatcherView(this);
      this._keptAttrs = [];
    }
    /**
     * Push a new tag onto the path.
     * @param {string} tagName
     * @param {Object|null} [attrValues=null]
     * @param {string|null} [namespace=null]
     * @param {Object|null} [options=null]
     * @param {string[]} [options.keep] - Names of attributes (from attrValues)
     */
    push(tagName, attrValues = null, namespace = null, options = null) {
      this._pathStringCache = null;
      if (this.path.length > 0) {
        this.path[this.path.length - 1].values = void 0;
      }
      const currentLevel = this.path.length;
      let level = this.siblingStacks[currentLevel];
      if (!level) {
        level = { counts: /* @__PURE__ */ new Map(), total: 0 };
        this.siblingStacks[currentLevel] = level;
      }
      const siblingKey = namespace ? `${namespace}:${tagName}` : tagName;
      const counter = level.counts.get(siblingKey) || 0;
      const position = level.total;
      level.counts.set(siblingKey, counter + 1);
      level.total++;
      const node = {
        tag: tagName,
        position,
        counter
      };
      if (namespace !== null && namespace !== void 0) {
        node.namespace = namespace;
      }
      if (attrValues !== null && attrValues !== void 0) {
        node.values = attrValues;
      }
      this.path.push(node);
      const depth2 = this.path.length;
      const keep = options !== null ? options.keep : null;
      if (keep !== null && keep !== void 0 && keep.length > 0 && attrValues) {
        for (let i = 0; i < keep.length; i++) {
          const name = keep[i];
          if (attrValues[name] !== void 0) {
            this._keptAttrs.push({ depth: depth2, name, value: attrValues[name] });
          }
        }
      }
    }
    /**
     * Pop the last tag from the path.
     * @returns {Object|undefined} The popped node
     */
    pop() {
      if (this.path.length === 0) return void 0;
      this._pathStringCache = null;
      const node = this.path.pop();
      if (this.siblingStacks.length > this.path.length + 1) {
        this.siblingStacks.length = this.path.length + 1;
      }
      const poppedDepth = this.path.length + 1;
      while (this._keptAttrs.length > 0 && this._keptAttrs[this._keptAttrs.length - 1].depth >= poppedDepth) {
        this._keptAttrs.pop();
      }
      return node;
    }
    /**
     * Update current node's attribute values.
     * Useful when attributes are parsed after push.
     * @param {Object} attrValues
     */
    updateCurrent(attrValues) {
      if (this.path.length > 0) {
        const current = this.path[this.path.length - 1];
        if (attrValues !== null && attrValues !== void 0) {
          current.values = attrValues;
        }
      }
    }
    /**
     * Get current tag name.
     * @returns {string|undefined}
     */
    getCurrentTag() {
      return this.path.length > 0 ? this.path[this.path.length - 1].tag : void 0;
    }
    /**
     * Get current namespace.
     * @returns {string|undefined}
     */
    getCurrentNamespace() {
      return this.path.length > 0 ? this.path[this.path.length - 1].namespace : void 0;
    }
    /**
     * Get current node's attribute value.
     * @param {string} attrName
     * @returns {*}
     */
    getAttrValue(attrName) {
      if (this.path.length === 0) return void 0;
      return this.path[this.path.length - 1].values?.[attrName];
    }
    /**
     * Check if current node has an attribute.
     * @param {string} attrName
     * @returns {boolean}
     */
    hasAttr(attrName) {
      if (this.path.length === 0) return false;
      const current = this.path[this.path.length - 1];
      return current.values !== void 0 && attrName in current.values;
    }
    /**
     * Get the value of a "kept" attribute from the nearest ancestor (or
     * current node) that declared it via `push(tag, attrs, ns, { keep: [...] })`.
     * Unlike getAttrValue(), this works regardless of how deep the path has
     * gone since the attribute was pushed — but only for attribute names that
     * were explicitly marked with `keep` at push time. Cost is proportional to
     * the number of currently-kept attributes (typically 0-3), not path depth.
     * @param {string} attrName
     * @returns {*} the value, or undefined if no ancestor kept this attribute
     */
    getAnyParentAttr(attrName) {
      const kept = this._keptAttrs;
      for (let i = kept.length - 1; i >= 0; i--) {
        if (kept[i].name === attrName) return kept[i].value;
      }
      return void 0;
    }
    /**
     * Check whether any ancestor (or the current node) kept the given
     * attribute via `push(tag, attrs, ns, { keep: [...] })`.
     * @param {string} attrName
     * @returns {boolean}
     */
    hasAnyParentAttr(attrName) {
      const kept = this._keptAttrs;
      for (let i = kept.length - 1; i >= 0; i--) {
        if (kept[i].name === attrName) return true;
      }
      return false;
    }
    /**
     * Get current node's sibling position (child index in parent).
     * @returns {number}
     */
    getPosition() {
      if (this.path.length === 0) return -1;
      return this.path[this.path.length - 1].position ?? 0;
    }
    /**
     * Get current node's repeat counter (occurrence count of this tag name).
     * @returns {number}
     */
    getCounter() {
      if (this.path.length === 0) return -1;
      return this.path[this.path.length - 1].counter ?? 0;
    }
    /**
     * Get current node's sibling index (alias for getPosition).
     * @returns {number}
     * @deprecated Use getPosition() or getCounter() instead
     */
    getIndex() {
      return this.getPosition();
    }
    /**
     * Get current path depth.
     * @returns {number}
     */
    getDepth() {
      return this.path.length;
    }
    /**
     * Get path as string.
     * @param {string} [separator] - Optional separator (uses default if not provided)
     * @param {boolean} [includeNamespace=true]
     * @returns {string}
     */
    toString(separator, includeNamespace = true) {
      const sep2 = separator || this.separator;
      const isDefault = sep2 === this.separator && includeNamespace === true;
      if (isDefault) {
        if (this._pathStringCache !== null) {
          return this._pathStringCache;
        }
        const result = this.path.map(
          (n) => n.namespace ? `${n.namespace}:${n.tag}` : n.tag
        ).join(sep2);
        this._pathStringCache = result;
        return result;
      }
      return this.path.map(
        (n) => includeNamespace && n.namespace ? `${n.namespace}:${n.tag}` : n.tag
      ).join(sep2);
    }
    /**
     * Get path as array of tag names.
     * @returns {string[]}
     */
    toArray() {
      return this.path.map((n) => n.tag);
    }
    /**
     * Reset the path to empty.
     */
    reset() {
      this._pathStringCache = null;
      this.path = [];
      this.siblingStacks = [];
      this._keptAttrs = [];
    }
    /**
     * Match current path against an Expression.
     * @param {Expression} expression
     * @returns {boolean}
     */
    matches(expression) {
      const segments = expression.segments;
      if (segments.length === 0) {
        return false;
      }
      if (expression.hasDeepWildcard()) {
        return this._matchWithDeepWildcard(segments);
      }
      return this._matchSimple(segments);
    }
    /**
     * @private
     */
    _matchSimple(segments) {
      if (this.path.length !== segments.length) {
        return false;
      }
      for (let i = 0; i < segments.length; i++) {
        if (!this._matchSegment(segments[i], this.path[i], i === this.path.length - 1)) {
          return false;
        }
      }
      return true;
    }
    /**
     * @private
     */
    _matchWithDeepWildcard(segments) {
      let pathIdx = this.path.length - 1;
      let segIdx = segments.length - 1;
      while (segIdx >= 0 && pathIdx >= 0) {
        const segment = segments[segIdx];
        if (segment.type === "deep-wildcard") {
          segIdx--;
          if (segIdx < 0) {
            return true;
          }
          const nextSeg = segments[segIdx];
          let found = false;
          for (let i = pathIdx; i >= 0; i--) {
            if (this._matchSegment(nextSeg, this.path[i], i === this.path.length - 1)) {
              pathIdx = i - 1;
              segIdx--;
              found = true;
              break;
            }
          }
          if (!found) {
            return false;
          }
        } else {
          if (!this._matchSegment(segment, this.path[pathIdx], pathIdx === this.path.length - 1)) {
            return false;
          }
          pathIdx--;
          segIdx--;
        }
      }
      return segIdx < 0;
    }
    /**
     * @private
     */
    _matchSegment(segment, node, isCurrentNode) {
      if (segment.tag !== "*" && segment.tag !== node.tag) {
        return false;
      }
      if (segment.namespace !== void 0) {
        if (segment.namespace !== "*" && segment.namespace !== node.namespace) {
          return false;
        }
      }
      if (segment.attrName !== void 0) {
        if (!isCurrentNode) {
          return false;
        }
        if (!node.values || !(segment.attrName in node.values)) {
          return false;
        }
        if (segment.attrValue !== void 0) {
          if (String(node.values[segment.attrName]) !== String(segment.attrValue)) {
            return false;
          }
        }
      }
      if (segment.position !== void 0) {
        if (!isCurrentNode) {
          return false;
        }
        const counter = node.counter ?? 0;
        if (segment.position === "first" && counter !== 0) {
          return false;
        } else if (segment.position === "odd" && counter % 2 !== 1) {
          return false;
        } else if (segment.position === "even" && counter % 2 !== 0) {
          return false;
        } else if (segment.position === "nth" && counter !== segment.positionValue) {
          return false;
        }
      }
      return true;
    }
    /**
     * Match any expression in the given set against the current path.
     * @param {ExpressionSet} exprSet
     * @returns {boolean}
     */
    matchesAny(exprSet) {
      return exprSet.matchesAny(this);
    }
    /**
     * Create a snapshot of current state.
     * @returns {Object}
     */
    snapshot() {
      return {
        path: this.path.map((node) => ({ ...node })),
        siblingStacks: this.siblingStacks.map((level) => level ? { counts: new Map(level.counts), total: level.total } : level),
        keptAttrs: this._keptAttrs.map((entry) => ({ ...entry }))
      };
    }
    /**
     * Restore state from snapshot.
     * @param {Object} snapshot
     */
    restore(snapshot) {
      this._pathStringCache = null;
      this.path = snapshot.path.map((node) => ({ ...node }));
      this.siblingStacks = snapshot.siblingStacks.map((level) => level ? { counts: new Map(level.counts), total: level.total } : level);
      this._keptAttrs = (snapshot.keptAttrs || []).map((entry) => ({ ...entry }));
    }
    /**
     * Return the read-only {@link MatcherView} for this matcher.
     *
     * The same instance is returned on every call — no allocation occurs.
     * It always reflects the current parser state and is safe to pass to
     * user callbacks without risk of accidental mutation.
     *
     * @returns {MatcherView}
     *
     * @example
     * const view = matcher.readOnly();
     * // pass view to callbacks — it stays in sync automatically
     * view.matches(expr);       // ✓
     * view.getCurrentTag();     // ✓
     * // view.push(...)         // ✗ method does not exist — caught by TypeScript
     */
    readOnly() {
      return this._view;
    }
  };

  // node_modules/is-unsafe/src/contexts/html.js
  var HTML_PATTERNS = [
    {
      id: "html-script-open",
      description: "<script opening tag",
      pattern: /<script[\s>/]/i
    },
    {
      id: "html-script-close",
      description: "<\/script closing tag",
      pattern: /<\/script[\s>]/i
    },
    {
      id: "html-javascript-protocol",
      description: "javascript: URI scheme (with optional whitespace/encoding)",
      // Handles j&#x61;vascript:, j\u0061vascript:, and whitespace variants
      pattern: /j[\t\n\r ]*a[\t\n\r ]*v[\t\n\r ]*a[\t\n\r ]*s[\t\n\r ]*c[\t\n\r ]*r[\t\n\r ]*i[\t\n\r ]*p[\t\n\r ]*t[\t\n\r ]*:/i
    },
    {
      id: "html-vbscript-protocol",
      description: "vbscript: URI scheme",
      pattern: /vbscript[\t\n\r ]*:/i
    },
    {
      id: "html-data-html",
      description: "data:text/html URI \u2014 can execute scripts in browsers",
      pattern: /data[\t\n\r ]*:[\t\n\r ]*text\/html/i
    },
    {
      id: "html-data-xhtml",
      description: "data:application/xhtml+xml URI",
      pattern: /data[\t\n\r ]*:[\t\n\r ]*application\/xhtml/i
    },
    {
      id: "html-data-svg",
      description: "data:image/svg+xml URI \u2014 can execute scripts",
      pattern: /data[\t\n\r ]*:[\t\n\r ]*image\/svg\+xml/i
    },
    {
      id: "html-inline-event-handler",
      description: "Inline event handler attributes: onclick=, onerror=, onload=, etc.",
      // \bon ensures we match a word boundary so "phonetic=" is not caught
      pattern: /\bon\w{1,30}\s*=/i
    },
    {
      id: "html-entity-obfuscated-script",
      description: "HTML-entity-encoded <script (e.g. &#x3C;script or &lt;script)",
      // Entities include optional trailing semicolon: &#x3C; or &#x3C (both valid in HTML5)
      pattern: /(?:&#x0*3[Cc];?|&#0*60;?|&lt;)\s*script/i
    },
    {
      id: "html-entity-obfuscated-javascript",
      description: 'HTML-entity-encoded javascript: (partial \u2014 catches common &#106; or &#x6a; for "j")',
      pattern: /(?:&#x0*6[Aa];?|&#0*106;?)\s*(?:&#x0*61;?|a)[\s\S]{0,80}script\s*:/i
    },
    {
      id: "html-style-expression",
      description: "CSS expression() \u2014 IE-era code execution in style attributes",
      pattern: /style[\s\S]{0,20}expression\s*\(/i
    },
    {
      id: "html-object-embed",
      description: "<object or <embed tags that can load active content",
      pattern: /<(?:object|embed)[\s>/]/i
    },
    {
      id: "html-base-tag",
      description: "<base href= \u2014 can hijack all relative URLs on a page",
      pattern: /<base[\s>]/i
    },
    {
      id: "html-meta-refresh",
      description: '<meta http-equiv="refresh" \u2014 can redirect users',
      pattern: /<meta[\s\S]{0,40}http-equiv[\s\S]{0,20}refresh/i
    },
    {
      id: "html-srcdoc",
      description: "srcdoc= attribute on iframes \u2014 embeds HTML that can run scripts",
      pattern: /srcdoc\s*=/i
    },
    {
      id: "html-iframe",
      description: "<iframe tag",
      pattern: /<iframe[\s>/]/i
    },
    {
      id: "html-form",
      description: "<form tag \u2014 can be used for phishing / credential harvesting injection",
      pattern: /<form[\s>/]/i
    }
  ];
  var html_default = HTML_PATTERNS;

  // node_modules/is-unsafe/src/contexts/xml.js
  var XML_PATTERNS = [
    {
      id: "xml-cdata-injection",
      description: "CDATA section injection: <![CDATA[ breaks out of text node context",
      pattern: /<!\[CDATA\[/i
    },
    {
      id: "xml-cdata-close",
      description: "CDATA close sequence: ]]> can terminate an enclosing CDATA section",
      pattern: /\]\]>/
    },
    {
      id: "xml-processing-instruction",
      description: "XML processing instruction: <?xml-stylesheet or <?php etc.",
      pattern: /<\?(?:xml[\- ]|php|asp)/i
    },
    {
      id: "xml-doctype-injection",
      description: "DOCTYPE declaration embedded in content \u2014 can define entities",
      // Match <!DOCTYPE followed by end-of-string, whitespace, or [ (internal subset)
      pattern: /<!DOCTYPE(?:[\s[]|$)/i
    },
    {
      id: "xml-entity-system",
      description: "SYSTEM keyword \u2014 used in external entity declarations (XXE)",
      pattern: /\bSYSTEM\s+["']/i
    },
    {
      id: "xml-entity-public",
      description: "PUBLIC keyword \u2014 used in external entity declarations (XXE)",
      pattern: /\bPUBLIC\s+["']/i
    },
    {
      id: "xml-entity-declaration",
      description: "<!ENTITY declaration \u2014 defines entities, potential XXE or entity expansion",
      pattern: /<!ENTITY[\s%]/i
    },
    {
      id: "xml-billion-laughs",
      description: "Entity reference chaining / billion laughs: repeated &eX; style references",
      // Heuristic: 3+ consecutive entity refs suggests expansion attack
      pattern: /(?:&\w{1,20};){3,}/
    },
    {
      id: "xml-namespace-confusion",
      description: "xmlns: attribute injection \u2014 can redefine namespaces to confuse parsers",
      // pattern: /\bxmlns\s*(?::\w{1,40})?\s*=/i,
      pattern: /\bxmlns(?::\w{1,40})?\s*=/i
    },
    {
      id: "xml-comment-injection",
      description: "<!-- comment injection \u2014 can hide content from some parsers",
      pattern: /<!--/
    },
    {
      id: "xml-comment-close",
      description: "--> closes an enclosing XML comment",
      pattern: /-->/
    },
    {
      id: "xml-pi-close",
      description: "?> closes an enclosing processing instruction",
      pattern: /\?>/
    }
  ];
  var xml_default = XML_PATTERNS;

  // node_modules/is-unsafe/src/contexts/svg.js
  var SVG_PATTERNS = [
    {
      id: "svg-script-element",
      description: "<script element inside SVG executes JavaScript",
      pattern: /<script[\s>/]/i
    },
    {
      id: "svg-xlink-href-javascript",
      description: "xlink:href with javascript: \u2014 classic SVG XSS via <a> or <use>",
      pattern: /xlink\s*:\s*href\s*=\s*["']?\s*javascript\s*:/i
    },
    {
      id: "svg-href-javascript",
      description: "href= with javascript: in SVG context (<a>, <animate>, etc.)",
      pattern: /href\s*=\s*["']?\s*javascript\s*:/i
    },
    {
      id: "svg-foreignobject",
      description: "<foreignObject embeds HTML inside SVG \u2014 can execute scripts",
      pattern: /<foreignObject[\s>/]/i
    },
    {
      id: "svg-use-external",
      description: "<use xlink:href or href pointing to external resource (non-fragment URL)",
      // Match <use with href= where the value starts with a non-# character (external URL)
      // [\"'][^#] catches quoted values not starting with #; [^\"'#\s>] catches unquoted
      pattern: /<use[\s\S]{0,60}(?:xlink\s*:\s*)?href\s*=\s*(?:["'][^#]|[^"'#\s>])/i
    },
    {
      id: "svg-animate-href",
      description: '<animate attributeName="href" \u2014 can dynamically change href to javascript:',
      pattern: /<animate[\s\S]{0,80}attributeName\s*=\s*["'][\s]*href["']/i
    },
    {
      id: "svg-animate-xlinkhref",
      description: '<animate attributeName="xlink:href"',
      pattern: /<animate[\s\S]{0,80}attributeName\s*=\s*["'][\s]*xlink\s*:\s*href["']/i
    },
    {
      id: "svg-set-javascript",
      description: '<set to="javascript:..." \u2014 sets an attribute to a javascript: URI',
      pattern: /<set[\s\S]{0,80}to\s*=\s*["']?\s*javascript\s*:/i
    },
    {
      id: "svg-event-handler",
      description: "SVG-specific event handler attributes: onload=, onerror=, onactivate=, etc.",
      pattern: /\bon(?:load|error|activate|begin|end|repeat|focus|blur|click|mouse\w{1,20}|key\w{1,20})\s*=/i
    },
    {
      id: "svg-handler-generic",
      description: "Generic on* handler catch-all for SVG attributes",
      pattern: /\bon\w{1,30}\s*=/i
    },
    {
      id: "svg-filter-feimage",
      description: "<feImage href= \u2014 filter primitive that can load external resources",
      pattern: /<feImage[\s\S]{0,80}(?:xlink\s*:\s*)?href\s*=/i
    },
    {
      id: "svg-image-external",
      description: "<image xlink:href with http/https or javascript protocol",
      pattern: /<image[\s\S]{0,80}(?:xlink\s*:\s*)?href\s*=\s*["']?\s*(?:https?|javascript)\s*:/i
    },
    {
      id: "svg-style-javascript",
      description: "style= attribute containing javascript: (e.g. background:url(javascript:...))",
      pattern: /style\s*=[\s\S]{0,60}javascript\s*:/i
    }
  ];
  var svg_default = SVG_PATTERNS;

  // node_modules/is-unsafe/src/contexts/sql.js
  var SQL_PATTERNS = [
    {
      id: "sql-block-comment-open",
      description: "SQL block comment open: /* ... */ \u2014 unusual in legitimate user text",
      pattern: /\/\*/
    },
    {
      id: "sql-union-select",
      description: "UNION SELECT \u2014 most common SQL injection aggregation attack",
      pattern: /\bUNION\s{1,20}(?:ALL\s{1,20})?SELECT\b/i
    },
    {
      id: "sql-drop-table",
      description: "DROP TABLE \u2014 destructive DDL injection",
      pattern: /\bDROP\s{1,20}TABLE\b/i
    },
    {
      id: "sql-drop-database",
      description: "DROP DATABASE \u2014 destructive DDL injection",
      pattern: /\bDROP\s{1,20}DATABASE\b/i
    },
    {
      id: "sql-insert-into",
      description: "INSERT INTO \u2014 data injection",
      pattern: /\bINSERT\s{1,20}INTO\b/i
    },
    {
      id: "sql-delete-from",
      description: "DELETE FROM \u2014 data deletion injection",
      pattern: /\bDELETE\s{1,20}FROM\b/i
    },
    {
      id: "sql-update-set",
      description: "UPDATE ... SET \u2014 data modification injection",
      // Allows arbitrary content between UPDATE and SET (table name, alias, etc.)
      pattern: /\bUPDATE\b[\s\S]{1,60}\bSET\b/i
    },
    {
      id: "sql-exec-xp",
      description: "EXEC xp_ \u2014 MSSQL extended stored procedure execution",
      pattern: /\bEXEC(?:UTE)?\s{1,20}xp_/i
    },
    {
      id: "sql-tautology-string",
      description: `Classic string tautology: ' OR '1'='1 or " OR "1"="1"`,
      // Last quote is optional — injection may truncate it: ' OR '1'='1--
      pattern: /'\s{0,10}OR\s{0,10}'[^']{0,20}'\s*=\s*'[^']{0,20}/i
    },
    {
      id: "sql-tautology-numeric",
      description: "Numeric tautology: OR 1=1",
      pattern: /\bOR\s{1,10}1\s*=\s*1\b/i
    },
    {
      id: "sql-always-true-zero",
      description: "Numeric tautology: OR 0=0",
      pattern: /\bOR\s{1,10}0\s*=\s*0\b/i
    },
    {
      id: "sql-sleep-benchmark",
      description: "Time-based blind injection: SLEEP() or BENCHMARK()",
      pattern: /\b(?:SLEEP|BENCHMARK)\s*\(/i
    },
    {
      id: "sql-waitfor-delay",
      description: "MSSQL time-based blind injection: WAITFOR DELAY",
      pattern: /\bWAITFOR\s{1,20}DELAY\b/i
    },
    {
      id: "sql-char-function",
      description: "CHAR() function \u2014 used to obfuscate injected strings",
      pattern: /\bCHAR\s*\(\s*\d{1,3}/i
    },
    {
      id: "sql-information-schema",
      description: "INFORMATION_SCHEMA \u2014 reconnaissance query for table/column enumeration",
      pattern: /\bINFORMATION_SCHEMA\b/i
    }
  ];
  var sql_default = SQL_PATTERNS;

  // node_modules/is-unsafe/src/contexts/shell.js
  var SHELL_PATTERNS = [
    {
      id: "shell-path-traversal-unix",
      description: "Unix path traversal: ../  \u2014 climbing the directory tree",
      pattern: /\.\.\//
    },
    {
      id: "shell-path-traversal-windows",
      description: "Windows path traversal: ..\\ \u2014 climbing the directory tree",
      pattern: /\.\.\\/
    },
    {
      id: "shell-path-traversal-encoded",
      description: "URL-encoded path traversal: %2e%2e or %2f variants",
      pattern: /%2e%2e|%2f\.\.|\.\.%2f/i
    },
    {
      id: "shell-null-byte",
      description: "Null byte injection: \\x00 or %00 \u2014 truncates strings in C-backed functions",
      pattern: /\x00|%00/
    },
    {
      id: "shell-semicolon",
      description: "Semicolon command separator: cmd1; cmd2",
      pattern: /;/
    },
    {
      id: "shell-pipe",
      description: "Pipe operator: cmd1 | cmd2",
      pattern: /\|/
    },
    {
      id: "shell-and-operator",
      description: "AND operator: cmd1 && cmd2",
      pattern: /&&/
    },
    {
      id: "shell-or-operator",
      description: "OR operator: cmd1 || cmd2",
      pattern: /\|\|/
    },
    {
      id: "shell-backtick",
      description: "Backtick command substitution: `cmd`",
      pattern: /`/
    },
    {
      id: "shell-dollar-paren",
      description: "Dollar-paren command substitution: $(cmd)",
      pattern: /\$\(/
    },
    {
      id: "shell-dollar-brace",
      description: "Dollar-brace variable expansion: ${var} \u2014 can be abused for injection",
      pattern: /\$\{/
    },
    {
      id: "shell-redirect-out",
      description: "Output redirection: cmd > file or cmd >> file",
      pattern: />{1,2}/
    },
    {
      id: "shell-redirect-in",
      description: "Input redirection: cmd < file",
      pattern: /</
    },
    {
      id: "shell-newline-injection",
      description: "Newline injection: \\n or \\r \u2014 can inject new shell commands",
      pattern: /[\n\r]/
    },
    {
      id: "shell-glob-star",
      description: "Glob expansion: * or ? \u2014 can expand to unintended files",
      // Only flag when combined with path separators to reduce false positives
      pattern: /[/\\][*?]/
    },
    {
      id: "shell-absolute-root",
      description: "Absolute root path injection: string starting with / or \\ (Windows UNC)",
      pattern: /^(?:\/|\\\\)/
    },
    {
      id: "shell-windows-drive",
      description: "Windows drive letter path injection: C:\\ or D:/",
      pattern: /^[a-zA-Z]:[/\\]/
    },
    {
      id: "shell-curl-wget",
      description: "curl/wget with URL or flags \u2014 can exfiltrate data or download payloads",
      // Require a URL scheme (http/https/ftp) or a flag (-) to reduce false positives
      // "curl is a tool" won't match; "curl http://..." or "curl -s ..." will
      pattern: /\b(?:curl|wget)\s+(?:https?:\/\/|ftp:\/\/|-)/i
    }
  ];
  var shell_default = SHELL_PATTERNS;

  // node_modules/is-unsafe/src/contexts/redos.js
  var REDOS_PATTERNS = [
    {
      id: "redos-nested-quantifier-plus",
      description: "Nested + quantifier inside a group with outer quantifier: (a+)+, (.+b)*, etc.",
      // Matches any group containing a + quantifier, with an outer * or + — catches (a+)+, (.+b)*, etc.
      pattern: /\([^)]*\+[^)]*\)[+*]/
    },
    {
      id: "redos-nested-quantifier-star",
      description: "Nested * quantifier: (a*)* or (a*)+ \u2014 catastrophic backtracking",
      pattern: /\([^)]*\*[^)]*\)[*+]/
    },
    {
      id: "redos-nested-groups",
      description: "Doubly nested quantified groups: ((a+)+) \u2014 guaranteed catastrophic",
      pattern: /\(\([^)]{0,40}\)[+*]\)[+*]/
    },
    {
      id: "redos-alternation-overlap",
      description: "Overlapping alternation under quantifier: (a|a)+ \u2014 ambiguous NFA paths",
      // Detect repeated identical alternatives under a quantifier
      pattern: /\(([^|()]{1,20})\|(?:\1)(?:\|[^|()]{1,20}){0,5}\)[+*?]{1,2}/
    },
    {
      id: "redos-star-plus-concat",
      description: "(x*x)+ pattern \u2014 triggers super-linear backtracking",
      pattern: /\([^)]{0,10}\*[^)]{0,10}\)[+*]/
    },
    {
      id: "redos-dot-star-greedy",
      description: "(.*){n,} or (.+){n,} \u2014 repeated greedy dot quantifiers",
      pattern: /\(\.[*+]\)\{?\d/
    },
    {
      id: "redos-large-repetition",
      description: "Very large fixed or range repetition count {1000,} or {1000,n} \u2014 denial of service via backtracking",
      // Matches { followed by 4+ digits (≥1000), then optional ,digits }
      pattern: /\{\d{4,}(?:,\d*)?\}/
    },
    {
      id: "redos-catastrophic-alternation",
      description: "Long alternation with many similar branches \u2014 polynomial backtracking risk",
      // Heuristic: 10+ pipe-separated alternatives in a single group
      pattern: /\([^)]{0,200}(?:\|[^|)]{0,50}){9,}\)/
    }
  ];
  var redos_default = REDOS_PATTERNS;

  // node_modules/is-unsafe/src/contexts/nosql.js
  var sep = `["'\\s]*:`;
  var NOSQL_PATTERNS = [
    // ─── MongoDB $ operator injection ────────────────────────────────────────
    {
      id: "nosql-where-operator",
      description: "$where \u2014 executes arbitrary JavaScript server-side in MongoDB",
      pattern: new RegExp(`\\$where${sep}`, "i")
    },
    {
      id: "nosql-ne-operator",
      description: '$ne \u2014 "not equal" operator used to bypass equality checks',
      pattern: new RegExp(`\\$ne${sep}`, "i")
    },
    {
      id: "nosql-gt-operator",
      description: '$gt \u2014 "greater than" used to bypass password/value checks',
      pattern: new RegExp(`\\$gte?${sep}`, "i")
    },
    {
      id: "nosql-lt-operator",
      description: '$lt / $lte \u2014 "less than" bypass variants',
      pattern: new RegExp(`\\$lte?${sep}`, "i")
    },
    {
      id: "nosql-regex-operator",
      description: "$regex \u2014 can be used to extract data character by character (blind injection)",
      pattern: new RegExp(`\\$regex${sep}`, "i")
    },
    {
      id: "nosql-or-operator",
      description: "$or \u2014 logical OR; used to create always-true conditions",
      pattern: new RegExp(`\\$or${sep}\\s*\\[`, "i")
    },
    {
      id: "nosql-and-operator",
      description: "$and \u2014 logical AND operator injection",
      pattern: new RegExp(`\\$and${sep}\\s*\\[`, "i")
    },
    {
      id: "nosql-nor-operator",
      description: "$nor \u2014 logical NOR operator injection",
      pattern: new RegExp(`\\$nor${sep}\\s*\\[`, "i")
    },
    {
      id: "nosql-exists-operator",
      description: "$exists \u2014 can enumerate fields to determine schema",
      pattern: new RegExp(`\\$exists${sep}`, "i")
    },
    {
      id: "nosql-in-operator",
      description: "$in \u2014 matches any value in a list; can enumerate values",
      pattern: new RegExp(`\\$in${sep}\\s*\\[`, "i")
    },
    {
      id: "nosql-expr-operator",
      description: "$expr \u2014 allows aggregation expressions in queries (MongoDB 3.6+)",
      pattern: new RegExp(`\\$expr${sep}`, "i")
    },
    {
      id: "nosql-function-operator",
      description: "$function \u2014 executes arbitrary JavaScript in MongoDB 4.4+",
      pattern: new RegExp(`\\$function${sep}`, "i")
    },
    {
      id: "nosql-accumulator-operator",
      description: "$accumulator \u2014 custom aggregation with arbitrary JS execution",
      pattern: new RegExp(`\\$accumulator${sep}`, "i")
    },
    // ─── Prototype pollution ─────────────────────────────────────────────────
    {
      id: "nosql-proto-pollution",
      description: "__proto__ \u2014 prototype pollution via object key injection",
      pattern: /__proto__/
    },
    {
      id: "nosql-constructor-prototype",
      description: "constructor.prototype \u2014 alternative prototype pollution vector (dot notation or JSON key)",
      // Matches dot-notation (obj.constructor.prototype) and JSON key adjacency
      // ("constructor": {"prototype": ...})
      pattern: /constructor[\s"':.,{\[]*prototype/i
    },
    {
      id: "nosql-proto-bracket",
      description: '["__proto__"] \u2014 bracket-notation prototype pollution',
      pattern: /\[["']__proto__["']\]/
    }
  ];
  var nosql_default = NOSQL_PATTERNS;

  // node_modules/is-unsafe/src/contexts/log.js
  var LOG_PATTERNS = [
    // ─── CRLF / newline injection ─────────────────────────────────────────────
    {
      id: "log-crlf-injection",
      description: "CRLF injection: literal \\r or \\n embeds fake log lines",
      pattern: /[\r\n]/
    },
    {
      id: "log-url-encoded-crlf",
      description: "URL-encoded CRLF: %0d, %0a, %0D, %0A \u2014 decoded by some log parsers",
      pattern: /%0[dDaA]/
    },
    {
      id: "log-unicode-newline",
      description: "Unicode newline variants: U+2028 (line separator), U+2029 (paragraph separator)",
      pattern: /[\u2028\u2029]/
    },
    // ─── Log4Shell / JNDI injection (CVE-2021-44228) ─────────────────────────
    {
      id: "log-log4shell-jndi",
      description: "Log4Shell: ${jndi:...} triggers remote code execution in Apache Log4j",
      pattern: /\$\{jndi\s*:/i
    },
    {
      id: "log-log4shell-obfuscated",
      description: "Obfuscated Log4Shell: ${::-j}... lookup-bypass prefix used to evade WAF detection",
      // ${::- is the Log4j lookup-bypass escape sequence; presence alone is suspicious
      pattern: /\$\{::-/
    },
    {
      id: "log-log4j-lookup",
      description: "Log4j lookup syntax: ${env:...}, ${sys:...}, ${ctx:...} \u2014 data exfiltration",
      pattern: /\$\{(?:env|sys|ctx|main|map|sd|web|docker|k8s|spring)\s*:/i
    },
    // ─── Server-Side Template Injection (SSTI) in log messages ───────────────
    {
      id: "log-ssti-double-brace",
      description: "SSTI double-brace: {{expression}} \u2014 Jinja2, Twig, Handlebars, etc.",
      pattern: /\{\{[\s\S]{0,80}\}\}/
    },
    {
      id: "log-ssti-hash-brace",
      description: "SSTI hash-brace: #{expression} \u2014 Thymeleaf, Velocity, Ruby ERB",
      pattern: /#\{[\s\S]{0,80}\}/
    },
    {
      id: "log-ssti-dollar-brace",
      description: "SSTI/EL injection: ${expression with operators or method calls} \u2014 JSP EL, Freemarker, SpEL",
      // Require that the ${...} content looks like an expression, not a plain variable name.
      // Flags if the content contains: . ( * + operators, or known SSTI keywords.
      // This avoids flagging ${PATH}, ${HOME} etc. (plain shell variables).
      pattern: /\$\{[^}]*(?:\.|\(|\*|\+|\bclass\b|\bruntime\b|\bprocess\b|\bexec\b)[^}]{0,80}\}/i
    },
    {
      id: "log-ssti-percent-tag",
      description: "SSTI ERB/ASP tag: <%= expression %> \u2014 Ruby ERB, ASP",
      pattern: /<%=[\s\S]{0,80}%>/
    },
    // ─── Null byte ────────────────────────────────────────────────────────────
    {
      id: "log-null-byte",
      description: "Null byte: \\x00 or %00 \u2014 can truncate log entries in C-backed loggers",
      pattern: /\x00|%00/
    },
    // ─── ANSI escape injection ────────────────────────────────────────────────
    {
      id: "log-ansi-escape",
      description: "ANSI escape sequence: ESC[ \u2014 can manipulate terminal output when logs are tailed",
      pattern: /\x1b\[/
    }
  ];
  var log_default = LOG_PATTERNS;

  // node_modules/is-unsafe/src/contexts/sql-strict.js
  var SQL_STRICT_EXTRA = [
    {
      id: "sql-line-comment",
      description: "SQL line comment: -- followed by whitespace or end of string",
      pattern: /--(?:\s|$)/
    },
    {
      id: "sql-stacked-query",
      description: "Stacked queries: semicolon immediately followed by a SQL keyword",
      pattern: /;\s{0,10}(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b/i
    },
    {
      id: "sql-hex-encoding",
      description: "Hex-encoded string injection: 0x41414141 style (MySQL)",
      pattern: /\b0x[0-9a-f]{4,}/i
    }
  ];
  var SQL_STRICT_PATTERNS = [...sql_default, ...SQL_STRICT_EXTRA];
  var sql_strict_default = SQL_STRICT_PATTERNS;

  // node_modules/is-unsafe/src/index.js
  html_default.label = "HTML";
  xml_default.label = "XML";
  svg_default.label = "SVG";
  sql_default.label = "SQL";
  sql_strict_default.label = "SQL-STRICT";
  shell_default.label = "SHELL";
  redos_default.label = "REDOS";
  nosql_default.label = "NOSQL";
  log_default.label = "LOG";
  var VALID_CONTEXTS = Object.freeze({
    HTML: html_default,
    XML: xml_default,
    SVG: svg_default,
    SQL: sql_default,
    "SQL-STRICT": sql_strict_default,
    SHELL: shell_default,
    REDOS: redos_default,
    NOSQL: nosql_default,
    LOG: log_default
  });
  function assertString(value2) {
    if (typeof value2 !== "string") {
      throw new TypeError(
        `is-unsafe: first argument must be a string, got ${typeof value2}`
      );
    }
  }
  function assertContext(context) {
    if (context instanceof RegExp) return;
    if (Array.isArray(context)) {
      if (context.length === 0) {
        throw new TypeError("is-unsafe: context must not be an empty array");
      }
      if (Array.isArray(context[0])) {
        for (const list of context) {
          if (!Array.isArray(list) || list.length === 0) {
            throw new TypeError(
              "is-unsafe: each context in the array must be a non-empty pattern array (PatternList)"
            );
          }
        }
      }
      return;
    }
    throw new TypeError(
      `is-unsafe: second argument must be a PatternList (e.g. HTML), an array of PatternLists (e.g. [HTML, XML]), or a RegExp. Got: ${typeof context}`
    );
  }
  function normalise(context) {
    if (context instanceof RegExp) return { lists: null, regex: context };
    if (Array.isArray(context[0])) return { lists: context, regex: null };
    return { lists: [context], regex: null };
  }
  function matchList(value2, list) {
    const label = list.label ?? "CUSTOM";
    for (const rule of list) {
      if (rule.pattern.test(value2)) {
        return { context: label, id: rule.id, description: rule.description, pattern: rule.pattern };
      }
    }
    return null;
  }
  function isUnsafe(value2, context) {
    assertString(value2);
    assertContext(context);
    const { lists, regex } = normalise(context);
    if (regex) return regex.test(value2);
    for (const list of lists) {
      if (matchList(value2, list) !== null) return true;
    }
    return false;
  }

  // node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
  function extractRawAttributes(prefixedAttrs, options) {
    if (!prefixedAttrs) return {};
    const attrs = options.attributesGroupName ? prefixedAttrs[options.attributesGroupName] : prefixedAttrs;
    if (!attrs) return {};
    const rawAttrs = {};
    for (const key in attrs) {
      if (key.startsWith(options.attributeNamePrefix)) {
        const rawName = key.substring(options.attributeNamePrefix.length);
        rawAttrs[rawName] = attrs[key];
      } else {
        rawAttrs[key] = attrs[key];
      }
    }
    return rawAttrs;
  }
  function extractNamespace(rawTagName) {
    if (!rawTagName || typeof rawTagName !== "string") return void 0;
    const colonIndex = rawTagName.indexOf(":");
    if (colonIndex !== -1 && colonIndex > 0) {
      const ns = rawTagName.substring(0, colonIndex);
      if (ns !== "xmlns") {
        return ns;
      }
    }
    return void 0;
  }
  var OrderedObjParser = class {
    constructor(options, externalEntities) {
      this.options = options;
      this.currentNode = null;
      this.tagsNodeStack = [];
      this.parseXml = parseXml;
      this.parseTextData = parseTextData;
      this.resolveNameSpace = resolveNameSpace;
      this.buildAttributesMap = buildAttributesMap;
      this.isItStopNode = isItStopNode;
      this.replaceEntitiesValue = replaceEntitiesValue;
      this.readStopNodeData = readStopNodeData;
      this.saveTextToParentTag = saveTextToParentTag;
      this.addChild = addChild;
      this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
      this.entityExpansionCount = 0;
      this.currentExpandedLength = 0;
      this.doctypefound = false;
      let namedEntities = { ...XML };
      if (this.options.entityDecoder) {
        this.entityDecoder = this.options.entityDecoder;
      } else {
        if (typeof this.options.htmlEntities === "object") namedEntities = this.options.htmlEntities;
        else if (this.options.htmlEntities === true) namedEntities = { ...COMMON_HTML, ...CURRENCY };
        this.entityDecoder = new EntityDecoder({
          namedEntities: { ...namedEntities, ...externalEntities },
          numericAllowed: this.options.htmlEntities,
          limit: {
            maxTotalExpansions: this.options.processEntities.maxTotalExpansions,
            maxExpandedLength: this.options.processEntities.maxExpandedLength,
            applyLimitsTo: this.options.processEntities.appliesTo
          },
          // onExternalEntity: (name, value) => isUnsafe(value) ? 'block' : 'allow',
          onInputEntity: (name, value2) => (
            //TODO: VALID_CONTEXTS.HTML should be set only if this.options.htmlEntities
            isUnsafe(value2, [html_default, xml_default]) ? ENTITY_ACTION.BLOCK : ENTITY_ACTION.ALLOW
          )
          //postCheck: resolved => resolved
        });
      }
      this.matcher = new Matcher();
      this.readonlyMatcher = this.matcher.readOnly();
      this.isCurrentNodeStopNode = false;
      this.stopNodeExpressionsSet = new ExpressionSet();
      const stopNodesOpts = this.options.stopNodes;
      if (stopNodesOpts && stopNodesOpts.length > 0) {
        for (let i = 0; i < stopNodesOpts.length; i++) {
          const stopNodeExp = stopNodesOpts[i];
          if (typeof stopNodeExp === "string") {
            this.stopNodeExpressionsSet.add(new Expression(stopNodeExp));
          } else if (stopNodeExp instanceof Expression) {
            this.stopNodeExpressionsSet.add(stopNodeExp);
          }
        }
        this.stopNodeExpressionsSet.seal();
      }
    }
  };
  function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
    const options = this.options;
    if (val !== void 0) {
      if (options.trimValues && !dontTrim) {
        val = val.trim();
      }
      if (val.length > 0) {
        if (!escapeEntities) val = this.replaceEntitiesValue(val, tagName, jPath);
        const jPathOrMatcher = options.jPath ? jPath.toString() : jPath;
        const newval = options.tagValueProcessor(tagName, val, jPathOrMatcher, hasAttributes, isLeafNode);
        if (newval === null || newval === void 0) {
          return val;
        } else if (typeof newval !== typeof val || newval !== val) {
          return newval;
        } else if (options.trimValues) {
          return parseValue(val, options.parseTagValue, options.numberParseOptions);
        } else {
          const trimmedVal = val.trim();
          if (trimmedVal === val) {
            return parseValue(val, options.parseTagValue, options.numberParseOptions);
          } else {
            return val;
          }
        }
      }
    }
  }
  function resolveNameSpace(tagname) {
    if (this.options.removeNSPrefix) {
      const tags = tagname.split(":");
      const prefix = tagname.charAt(0) === "/" ? "/" : "";
      if (tags[0] === "xmlns") {
        return "";
      }
      if (tags.length === 2) {
        tagname = prefix + tags[1];
      }
    }
    return tagname;
  }
  var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
  function buildAttributesMap(attrStr, jPath, tagName, force = false) {
    const options = this.options;
    if (force === true || options.ignoreAttributes !== true && typeof attrStr === "string") {
      const matches2 = getAllMatches(attrStr, attrsRegx);
      const len = matches2.length;
      const attrs = {};
      const processedVals = new Array(len);
      let hasRawAttrs = false;
      const rawAttrsForMatcher = {};
      for (let i = 0; i < len; i++) {
        const attrName = this.resolveNameSpace(matches2[i][1]);
        const oldVal = matches2[i][4];
        if (attrName.length && oldVal !== void 0) {
          let val = oldVal;
          if (options.trimValues) val = val.trim();
          val = this.replaceEntitiesValue(val, tagName, this.readonlyMatcher);
          processedVals[i] = val;
          rawAttrsForMatcher[attrName] = val;
          hasRawAttrs = true;
        }
      }
      if (hasRawAttrs && typeof jPath === "object" && jPath.updateCurrent) {
        jPath.updateCurrent(rawAttrsForMatcher);
      }
      const jPathStr = options.jPath ? jPath.toString() : this.readonlyMatcher;
      let hasAttrs = false;
      for (let i = 0; i < len; i++) {
        const attrName = this.resolveNameSpace(matches2[i][1]);
        if (this.ignoreAttributesFn(attrName, jPathStr)) continue;
        let aName = options.attributeNamePrefix + attrName;
        if (attrName.length) {
          if (options.transformAttributeName) {
            aName = options.transformAttributeName(aName);
          }
          aName = sanitizeName(aName, options);
          if (matches2[i][4] !== void 0) {
            const oldVal = processedVals[i];
            const newVal = options.attributeValueProcessor(attrName, oldVal, jPathStr);
            if (newVal === null || newVal === void 0) {
              attrs[aName] = oldVal;
            } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
              attrs[aName] = newVal;
            } else {
              attrs[aName] = parseValue(oldVal, options.parseAttributeValue, options.numberParseOptions);
            }
            hasAttrs = true;
          } else if (options.allowBooleanAttributes) {
            attrs[aName] = true;
            hasAttrs = true;
          }
        }
      }
      if (!hasAttrs) return;
      if (options.attributesGroupName && !options.preserveOrder) {
        const attrCollection = {};
        attrCollection[options.attributesGroupName] = attrs;
        return attrCollection;
      }
      return attrs;
    }
  }
  var parseXml = function(xmlData) {
    xmlData = xmlData.replace(/\r\n?/g, "\n");
    const xmlObj = new XmlNode("!xml");
    let currentNode = xmlObj;
    let textData = "";
    this.matcher.reset();
    this.entityDecoder.reset();
    this.entityExpansionCount = 0;
    this.currentExpandedLength = 0;
    this.doctypefound = false;
    const options = this.options;
    const docTypeReader = new DocTypeReader(options.processEntities);
    const xmlLen = xmlData.length;
    for (let i = 0; i < xmlLen; i++) {
      const ch = xmlData[i];
      if (ch === "<") {
        const c1 = xmlData.charCodeAt(i + 1);
        if (c1 === 47) {
          const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
          let tagName = xmlData.substring(i + 2, closeIndex).trim();
          if (options.removeNSPrefix) {
            const colonIndex = tagName.indexOf(":");
            if (colonIndex !== -1) {
              tagName = tagName.substr(colonIndex + 1);
            }
          }
          tagName = transformTagName(options.transformTagName, tagName, "", options).tagName;
          if (currentNode) {
            textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher);
          }
          const lastTagName = this.matcher.getCurrentTag();
          if (tagName && options.unpairedTagsSet.has(tagName)) {
            throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
          }
          if (lastTagName && options.unpairedTagsSet.has(lastTagName)) {
            this.matcher.pop();
            this.tagsNodeStack.pop();
          }
          this.matcher.pop();
          this.isCurrentNodeStopNode = false;
          currentNode = this.tagsNodeStack.pop() || xmlObj;
          if (options.captureMetaData && currentNode) {
            currentNode.addEndIndex(closeIndex + 1);
          }
          textData = "";
          i = closeIndex;
        } else if (c1 === 63) {
          let tagData = readTagExp(xmlData, i, false, "?>");
          if (!tagData) throw new Error("Pi Tag is not closed.");
          textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher);
          const attsMap = this.buildAttributesMap(tagData.tagExp, this.matcher, tagData.tagName, true);
          if (attsMap) {
            const ver = attsMap[this.options.attributeNamePrefix + "version"];
            this.entityDecoder.setXmlVersion(Number(ver) || 1);
            docTypeReader.setXmlVersion(Number(ver) || 1);
          }
          if (options.ignoreDeclaration && tagData.tagName === "?xml" || options.ignorePiTags) {
          } else {
            const childNode = new XmlNode(tagData.tagName);
            childNode.add(options.textNodeName, "");
            if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent && options.ignoreAttributes !== true) {
              childNode[":@"] = attsMap;
            }
            this.addChild(currentNode, childNode, this.readonlyMatcher, i);
            if (options.captureMetaData) {
              currentNode.addEndIndex(tagData.closeIndex + 2);
            }
          }
          i = tagData.closeIndex + 1;
        } else if (c1 === 33 && xmlData.charCodeAt(i + 2) === 45 && xmlData.charCodeAt(i + 3) === 45) {
          const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
          if (options.commentPropName) {
            const comment = xmlData.substring(i + 4, endIndex - 2);
            textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher);
            currentNode.add(options.commentPropName, [{ [options.textNodeName]: comment }]);
          }
          i = endIndex;
        } else if (c1 === 33 && xmlData.charCodeAt(i + 2) === 68) {
          if (this.doctypefound) throw new Error("Multiple DOCTYPE declarations found.");
          this.doctypefound = true;
          const result = docTypeReader.readDocType(xmlData, i);
          this.entityDecoder.addInputEntities(result.entities);
          i = result.i;
        } else if (c1 === 33 && xmlData.charCodeAt(i + 2) === 91) {
          const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
          const tagExp = xmlData.substring(i + 9, closeIndex);
          textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher);
          let val = this.parseTextData(tagExp, currentNode.tagname, this.readonlyMatcher, true, false, true, true);
          if (val == void 0) val = "";
          if (options.cdataPropName) {
            currentNode.add(options.cdataPropName, [{ [options.textNodeName]: tagExp }]);
          } else {
            currentNode.add(options.textNodeName, val);
          }
          i = closeIndex + 2;
        } else {
          let result = readTagExp(xmlData, i, options.removeNSPrefix);
          if (!result) {
            const context = xmlData.substring(Math.max(0, i - 50), Math.min(xmlLen, i + 50));
            throw new Error(`readTagExp returned undefined at position ${i}. Context: "${context}"`);
          }
          let tagName = result.tagName;
          const rawTagName = result.rawTagName;
          let tagExp = result.tagExp;
          let attrExpPresent = result.attrExpPresent;
          let closeIndex = result.closeIndex;
          ({ tagName, tagExp } = transformTagName(options.transformTagName, tagName, tagExp, options));
          if (options.strictReservedNames && (tagName === options.commentPropName || tagName === options.cdataPropName || tagName === options.textNodeName || tagName === options.attributesGroupName)) {
            throw new Error(`Invalid tag name: ${tagName}`);
          }
          if (currentNode && textData) {
            if (currentNode.tagname !== "!xml") {
              textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher, false);
            }
          }
          const lastTag = currentNode;
          if (lastTag && options.unpairedTagsSet.has(lastTag.tagname)) {
            currentNode = this.tagsNodeStack.pop();
            this.matcher.pop();
          }
          let isSelfClosing = false;
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            isSelfClosing = true;
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            attrExpPresent = tagName !== tagExp;
          }
          let prefixedAttrs = null;
          let rawAttrs = {};
          let namespace = void 0;
          namespace = extractNamespace(rawTagName);
          if (tagName !== xmlObj.tagname) {
            this.matcher.push(tagName, {}, namespace);
          }
          if (tagName !== tagExp && attrExpPresent) {
            prefixedAttrs = this.buildAttributesMap(tagExp, this.matcher, tagName);
            if (prefixedAttrs) {
              rawAttrs = extractRawAttributes(prefixedAttrs, options);
            }
          }
          if (tagName !== xmlObj.tagname) {
            this.isCurrentNodeStopNode = this.isItStopNode();
          }
          const startIndex = i;
          if (this.isCurrentNodeStopNode) {
            let tagContent = "";
            if (isSelfClosing) {
              i = result.closeIndex;
            } else if (options.unpairedTagsSet.has(tagName)) {
              i = result.closeIndex;
            } else {
              const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
              if (!result2) throw new Error(`Unexpected end of ${rawTagName}`);
              i = result2.i;
              tagContent = result2.tagContent;
            }
            const childNode = new XmlNode(tagName);
            if (prefixedAttrs) {
              childNode[":@"] = prefixedAttrs;
            }
            childNode.add(options.textNodeName, tagContent);
            this.matcher.pop();
            this.isCurrentNodeStopNode = false;
            this.addChild(currentNode, childNode, this.readonlyMatcher, startIndex);
            if (options.captureMetaData) {
              currentNode.addEndIndex(i + 1);
            }
          } else {
            if (isSelfClosing) {
              ({ tagName, tagExp } = transformTagName(options.transformTagName, tagName, tagExp, options));
              const childNode = new XmlNode(tagName);
              if (prefixedAttrs) {
                childNode[":@"] = prefixedAttrs;
              }
              this.addChild(currentNode, childNode, this.readonlyMatcher, startIndex);
              if (options.captureMetaData) {
                currentNode.addEndIndex(closeIndex + 1);
              }
              this.matcher.pop();
              this.isCurrentNodeStopNode = false;
            } else if (options.unpairedTagsSet.has(tagName)) {
              const childNode = new XmlNode(tagName);
              if (prefixedAttrs) {
                childNode[":@"] = prefixedAttrs;
              }
              this.addChild(currentNode, childNode, this.readonlyMatcher, startIndex);
              if (options.captureMetaData) {
                currentNode.addEndIndex(result.closeIndex + 1);
              }
              this.matcher.pop();
              this.isCurrentNodeStopNode = false;
              i = result.closeIndex;
              continue;
            } else {
              const childNode = new XmlNode(tagName);
              if (this.tagsNodeStack.length > options.maxNestedTags) {
                throw new Error("Maximum nested tags exceeded");
              }
              this.tagsNodeStack.push(currentNode);
              if (prefixedAttrs) {
                childNode[":@"] = prefixedAttrs;
              }
              this.addChild(currentNode, childNode, this.readonlyMatcher, startIndex);
              currentNode = childNode;
            }
            textData = "";
            i = closeIndex;
          }
        }
      } else {
        textData += xmlData[i];
      }
    }
    return xmlObj.child;
  };
  function addChild(currentNode, childNode, matcher, startIndex) {
    if (!this.options.captureMetaData) startIndex = void 0;
    const jPathOrMatcher = this.options.jPath ? matcher.toString() : matcher;
    const result = this.options.updateTag(childNode.tagname, jPathOrMatcher, childNode[":@"]);
    if (result === false) {
    } else if (typeof result === "string") {
      childNode.tagname = result;
      currentNode.addChild(childNode, startIndex);
    } else {
      currentNode.addChild(childNode, startIndex);
    }
  }
  function replaceEntitiesValue(val, tagName, jPath) {
    const entityConfig = this.options.processEntities;
    if (!entityConfig || !entityConfig.enabled) {
      return val;
    }
    if (entityConfig.allowedTags) {
      const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
      const allowed = Array.isArray(entityConfig.allowedTags) ? entityConfig.allowedTags.includes(tagName) : entityConfig.allowedTags(tagName, jPathOrMatcher);
      if (!allowed) {
        return val;
      }
    }
    if (entityConfig.tagFilter) {
      const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
      if (!entityConfig.tagFilter(tagName, jPathOrMatcher)) {
        return val;
      }
    }
    return this.entityDecoder.decode(val);
  }
  function saveTextToParentTag(textData, parentNode, matcher, isLeafNode) {
    if (textData) {
      if (isLeafNode === void 0) isLeafNode = parentNode.child.length === 0;
      textData = this.parseTextData(
        textData,
        parentNode.tagname,
        matcher,
        false,
        parentNode[":@"] ? Object.keys(parentNode[":@"]).length !== 0 : false,
        isLeafNode
      );
      if (textData !== void 0 && textData !== "")
        parentNode.add(this.options.textNodeName, textData);
      textData = "";
    }
    return textData;
  }
  function isItStopNode() {
    if (this.stopNodeExpressionsSet.size === 0) return false;
    return this.matcher.matchesAny(this.stopNodeExpressionsSet);
  }
  function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
    let attrBoundary = 0;
    const len = xmlData.length;
    const closeCode0 = closingChar.charCodeAt(0);
    const closeCode1 = closingChar.length > 1 ? closingChar.charCodeAt(1) : -1;
    let result = "";
    let segmentStart = i;
    for (let index = i; index < len; index++) {
      const code = xmlData.charCodeAt(index);
      if (attrBoundary) {
        if (code === attrBoundary) attrBoundary = 0;
      } else if (code === 34 || code === 39) {
        attrBoundary = code;
      } else if (code === closeCode0) {
        if (closeCode1 !== -1) {
          if (xmlData.charCodeAt(index + 1) === closeCode1) {
            result += xmlData.substring(segmentStart, index);
            return { data: result, index };
          }
        } else {
          result += xmlData.substring(segmentStart, index);
          return { data: result, index };
        }
      } else if (code === 9 && !attrBoundary) {
        result += xmlData.substring(segmentStart, index) + " ";
        segmentStart = index + 1;
      }
    }
  }
  function findClosingIndex(xmlData, str, i, errMsg) {
    const closingIndex = xmlData.indexOf(str, i);
    if (closingIndex === -1) {
      throw new Error(errMsg);
    } else {
      return closingIndex + str.length - 1;
    }
  }
  function findClosingChar(xmlData, char, i, errMsg) {
    const closingIndex = xmlData.indexOf(char, i);
    if (closingIndex === -1) throw new Error(errMsg);
    return closingIndex;
  }
  function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
    const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
    if (!result) return;
    let tagExp = result.data;
    const closeIndex = result.index;
    const separatorIndex = tagExp.search(/\s/);
    let tagName = tagExp;
    let attrExpPresent = true;
    if (separatorIndex !== -1) {
      tagName = tagExp.substring(0, separatorIndex);
      tagExp = tagExp.substring(separatorIndex + 1).trimStart();
    }
    const rawTagName = tagName;
    if (removeNSPrefix) {
      const colonIndex = tagName.indexOf(":");
      if (colonIndex !== -1) {
        tagName = tagName.substr(colonIndex + 1);
        attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
      }
    }
    return {
      tagName,
      tagExp,
      closeIndex,
      attrExpPresent,
      rawTagName
    };
  }
  function readStopNodeData(xmlData, tagName, i) {
    const startIndex = i;
    let openTagCount = 1;
    const xmllen = xmlData.length;
    for (; i < xmllen; i++) {
      if (xmlData[i] === "<") {
        const c1 = xmlData.charCodeAt(i + 1);
        if (c1 === 47) {
          const closeIndex = findClosingChar(xmlData, ">", i, `${tagName} is not closed`);
          let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
          if (closeTagName === tagName) {
            openTagCount--;
            if (openTagCount === 0) {
              return {
                tagContent: xmlData.substring(startIndex, i),
                i: closeIndex
              };
            }
          }
          i = closeIndex;
        } else if (c1 === 63) {
          const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
          i = closeIndex;
        } else if (c1 === 33 && xmlData.charCodeAt(i + 2) === 45 && xmlData.charCodeAt(i + 3) === 45) {
          const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
          i = closeIndex;
        } else if (c1 === 33 && xmlData.charCodeAt(i + 2) === 91) {
          const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
          i = closeIndex;
        } else {
          const tagData = readTagExp(xmlData, i, false);
          if (tagData) {
            const openTagName = tagData && tagData.tagName;
            if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
              openTagCount++;
            }
            i = tagData.closeIndex;
          }
        }
      }
    }
  }
  function parseValue(val, shouldParse, options) {
    if (shouldParse && typeof val === "string") {
      const newval = val.trim();
      if (newval === "true") return true;
      else if (newval === "false") return false;
      else return toNumber(val, options);
    } else {
      if (isExist(val)) {
        return val;
      } else {
        return "";
      }
    }
  }
  function transformTagName(fn, tagName, tagExp, options) {
    if (fn) {
      const newTagName = fn(tagName);
      if (tagExp === tagName) {
        tagExp = newTagName;
      }
      tagName = newTagName;
    }
    tagName = sanitizeName(tagName, options);
    return { tagName, tagExp };
  }
  function sanitizeName(name, options) {
    if (criticalProperties.includes(name)) {
      throw new Error(`[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`);
    } else if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
      return options.onDangerousProperty(name);
    }
    return name;
  }

  // node_modules/fast-xml-parser/src/xmlparser/node2json.js
  var METADATA_SYMBOL2 = XmlNode.getMetaDataSymbol();
  function stripAttributePrefix(attrs, prefix) {
    if (!attrs || typeof attrs !== "object") return {};
    if (!prefix) return attrs;
    const rawAttrs = {};
    for (const key in attrs) {
      if (key.startsWith(prefix)) {
        const rawName = key.substring(prefix.length);
        rawAttrs[rawName] = attrs[key];
      } else {
        rawAttrs[key] = attrs[key];
      }
    }
    return rawAttrs;
  }
  function prettify(node, options, matcher, readonlyMatcher) {
    return compress(node, options, matcher, readonlyMatcher);
  }
  function compress(arr, options, matcher, readonlyMatcher) {
    let text2;
    const compressedObj = {};
    for (let i = 0; i < arr.length; i++) {
      const tagObj = arr[i];
      const property = propName(tagObj);
      if (property !== void 0 && property !== options.textNodeName) {
        const rawAttrs = stripAttributePrefix(
          tagObj[":@"] || {},
          options.attributeNamePrefix
        );
        matcher.push(property, rawAttrs);
      }
      if (property === options.textNodeName) {
        if (text2 === void 0) text2 = tagObj[property];
        else text2 += "" + tagObj[property];
      } else if (property === void 0) {
        continue;
      } else if (tagObj[property]) {
        let val = compress(tagObj[property], options, matcher, readonlyMatcher);
        const isLeaf = isLeafTag(val, options);
        if (Object.keys(val).length === 0 && options.alwaysCreateTextNode) {
          val[options.textNodeName] = "";
        }
        if (tagObj[":@"]) {
          assignAttributes(val, tagObj[":@"], readonlyMatcher, options);
        } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
          val = val[options.textNodeName];
        } else if (Object.keys(val).length === 0) {
          if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
          else val = "";
        }
        if (tagObj[METADATA_SYMBOL2] !== void 0 && typeof val === "object" && val !== null) {
          val[METADATA_SYMBOL2] = tagObj[METADATA_SYMBOL2];
        }
        if (compressedObj[property] !== void 0 && Object.prototype.hasOwnProperty.call(compressedObj, property)) {
          if (!Array.isArray(compressedObj[property])) {
            compressedObj[property] = [compressedObj[property]];
          }
          compressedObj[property].push(val);
        } else {
          const jPathOrMatcher = options.jPath ? readonlyMatcher.toString() : readonlyMatcher;
          if (options.isArray(property, jPathOrMatcher, isLeaf)) {
            compressedObj[property] = [val];
          } else {
            compressedObj[property] = val;
          }
        }
        if (property !== void 0 && property !== options.textNodeName) {
          matcher.pop();
        }
      }
    }
    if (typeof text2 === "string") {
      if (text2.length > 0) compressedObj[options.textNodeName] = text2;
    } else if (text2 !== void 0) compressedObj[options.textNodeName] = text2;
    return compressedObj;
  }
  function propName(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key !== ":@") return key;
    }
  }
  function assignAttributes(obj, attrMap, readonlyMatcher, options) {
    if (attrMap) {
      const keys = Object.keys(attrMap);
      const len = keys.length;
      for (let i = 0; i < len; i++) {
        const atrrName = keys[i];
        const rawAttrName = atrrName.startsWith(options.attributeNamePrefix) ? atrrName.substring(options.attributeNamePrefix.length) : atrrName;
        const jPathOrMatcher = options.jPath ? readonlyMatcher.toString() + "." + rawAttrName : readonlyMatcher;
        if (options.isArray(atrrName, jPathOrMatcher, true, true)) {
          obj[atrrName] = [attrMap[atrrName]];
        } else {
          obj[atrrName] = attrMap[atrrName];
        }
      }
    }
  }
  function isLeafTag(obj, options) {
    const { textNodeName } = options;
    const propCount = Object.keys(obj).length;
    if (propCount === 0) {
      return true;
    }
    if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
      return true;
    }
    return false;
  }

  // node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
  var XMLParser = class {
    constructor(options) {
      this.externalEntities = {};
      this.options = buildOptions(options);
    }
    /**
     * Parse XML dats to JS object 
     * @param {string|Uint8Array} xmlData 
     * @param {boolean|Object} validationOption 
     */
    parse(xmlData, validationOption) {
      if (typeof xmlData !== "string" && xmlData.toString) {
        if (xmlData instanceof Uint8Array && !(typeof Buffer !== "undefined" && Buffer.isBuffer(xmlData))) {
          xmlData = new TextDecoder("utf-8", { ignoreBOM: true }).decode(xmlData);
        } else {
          xmlData = xmlData.toString();
        }
      } else if (typeof xmlData !== "string") {
        throw new Error("XML data is accepted in String or Bytes[] form.");
      }
      if (validationOption) {
        if (validationOption === true) validationOption = {};
        const result = validate(xmlData, validationOption);
        if (result !== true) {
          throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
        }
      }
      const orderedObjParser = new OrderedObjParser(this.options, this.externalEntities);
      const orderedResult = orderedObjParser.parseXml(xmlData);
      if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
      else return prettify(orderedResult, this.options, orderedObjParser.matcher, orderedObjParser.readonlyMatcher);
    }
    /**
     * Add Entity which is not by default supported by this library
     * @param {string} key 
     * @param {string} value 
     */
    addEntity(key, value2) {
      if (value2.indexOf("&") !== -1) {
        throw new Error("Entity value can't have '&'");
      } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
        throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
      } else if (value2 === "&") {
        throw new Error("An entity with value '&' is not permitted");
      } else {
        this.externalEntities[key] = value2;
      }
    }
    /**
     * Returns a Symbol that can be used to access the metadata
     * property on a node.
     * 
     * If Symbol is not available in the environment, an ordinary property is used
     * and the name of the property is here returned.
     * 
     * The XMLMetaData property is only present when `captureMetaData`
     * is true in the options.
     */
    static getMetaDataSymbol() {
      return XmlNode.getMetaDataSymbol();
    }
  };

  // src/lib/server/camt.ts
  var parser = new XMLParser({
    removeNSPrefix: true,
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
    isArray: (name) => ["Stmt", "Bal", "Ntry", "TxDtls", "Ustrd"].includes(name)
  });
  function text(v) {
    if (v == null) return null;
    if (typeof v === "object") return v["#text"] != null ? String(v["#text"]) : null;
    return String(v);
  }
  function cents(amount2, indicator) {
    const value2 = Math.round(parseFloat(text(amount2) ?? "0") * 100);
    return text(indicator) === "DBIT" ? -value2 : value2;
  }
  function squash(s) {
    return s.replace(/\s+/g, " ").trim();
  }
  function parseCamt(xml) {
    const doc = parser.parse(xml);
    const statements = doc?.Document?.BkToCstmrStmt?.Stmt;
    if (!statements) throw new Error("Dit is geen camt.053-bankafschrift.");
    return statements.map((st) => {
      const iban = text(st.Acct?.Id?.IBAN);
      if (!iban) throw new Error("Rekeningnummer ontbreekt in het afschrift.");
      const balance = (code) => (st.Bal ?? []).find((b) => text(b.Tp?.CdOrPrtry?.Cd) === code);
      const opening = balance("OPBD") ?? balance("PRCD");
      const closing = balance("CLBD");
      const entries = [];
      for (const e of st.Ntry ?? []) {
        if (text(e.Sts) && text(e.Sts) !== "BOOK") continue;
        const amountCents = cents(e.Amt, e.CdtDbtInd);
        const bookingDate = text(e.BookgDt?.Dt) ?? text(e.BookgDt?.DtTm)?.slice(0, 10);
        if (!bookingDate) continue;
        const details = e.NtryDtls?.TxDtls?.[0] ?? {};
        const parties = details.RltdPties ?? {};
        const party = amountCents < 0 ? parties.Cdtr : parties.Dbtr;
        const partyAcct = amountCents < 0 ? parties.CdtrAcct : parties.DbtrAcct;
        const info = squash(text(e.AddtlNtryInf) ?? "");
        const family = text(e.BkTxCd?.Domn?.Fmly?.Cd);
        const sub = text(e.BkTxCd?.Domn?.Fmly?.SubFmlyCd);
        let counterparty = text(party?.Nm ?? party?.Pty?.Nm);
        let description = (details.RmtInf?.Ustrd ?? []).map(text).filter(Boolean).join(" ");
        if (!description) description = info.replace(/\s*Referentie:.*$/, "");
        if (family === "CCRD" && info.includes(">")) {
          counterparty = squash(info.split(">")[0]);
          const place = info.split(">")[1]?.match(/^[A-Za-z' -]+?(?=\s*\d|\s{2}|$)/)?.[0];
          description = place ? squash(place) : "";
        }
        entries.push({
          bankRef: text(e.NtryRef) ?? text(e.AcctSvcrRef) ?? `${bookingDate}|${amountCents}|${info}`,
          bookingDate,
          amountCents,
          counterparty: counterparty ? squash(counterparty) : null,
          counterpartyIban: text(partyAcct?.Id?.IBAN),
          description: squash(description),
          rawInfo: info,
          bankCode: family && sub ? `${family}/${sub}` : family,
          mcc: info.match(/MCC:(\d{4})/)?.[1] ?? null
        });
      }
      return {
        iban,
        openingCents: opening ? cents(opening.Amt, opening.CdtDbtInd) : null,
        openingDate: opening ? text(opening.Dt?.Dt) : null,
        closingCents: closing ? cents(closing.Amt, closing.CdtDbtInd) : null,
        closingDate: closing ? text(closing.Dt?.Dt) : null,
        entries
      };
    });
  }

  // src/lib/server/csv.ts
  var ROLES = ["date", "amount", "direction", "debit", "credit", "counterparty", "counterpartyIban", "description", "iban", "balance", "ref"];
  var NeedsInput = class extends Error {
    constructor(preview) {
      super("Kies welke kolommen datum, bedrag en omschrijving zijn.");
      __publicField(this, "preview", preview);
    }
  };
  var SYNONYMS = {
    date: ["datum", "boekingsdatum", "transactiedatum", "date", "booking date", "boekdatum", "valutadatum"],
    amount: ["bedrag", "bedrag (eur)", "amount", "transactiebedrag", "bedrag eur"],
    direction: ["af bij", "af/bij", "debet/credit", "debit/credit", "cd"],
    debit: ["af", "debet", "debit"],
    credit: ["bij", "credit"],
    counterparty: ["naam / omschrijving", "naam tegenpartij", "naam", "tegenpartij", "counterparty", "name", "begunstigde", "omschrijving-1 naam"],
    counterpartyIban: ["tegenrekening", "tegenrekening iban/bban", "tegenrekening iban", "counterparty iban", "iban tegenpartij"],
    description: ["mededelingen", "omschrijving", "omschrijving-1", "description", "betalingskenmerk", "details"],
    iban: ["rekening", "iban/bban", "iban", "rekeningnummer", "account", "eigen rekening"],
    balance: ["saldo na mutatie", "saldo na trn", "saldo", "balance"],
    ref: ["volgnr", "volgnummer", "referentie", "id", "transactie id"]
  };
  function parseCsv(text2, delimiter) {
    const rows = [];
    let row2 = [];
    let field = "";
    let quoted = false;
    const s = text2.charCodeAt(0) === 65279 ? text2.slice(1) : text2;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (quoted) {
        if (c === '"') {
          if (s[i + 1] === '"') {
            field += '"';
            i++;
          } else quoted = false;
        } else field += c;
      } else if (c === '"') quoted = true;
      else if (c === delimiter) {
        row2.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && s[i + 1] === "\n") i++;
        row2.push(field);
        field = "";
        if (row2.some((f) => f.trim() !== "")) rows.push(row2);
        row2 = [];
      } else field += c;
    }
    row2.push(field);
    if (row2.some((f) => f.trim() !== "")) rows.push(row2);
    return rows;
  }
  function detectDelimiter(text2) {
    const head = text2.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
    let best = ",";
    let bestCount = 0;
    for (const d of [";", ",", "	", "|"]) {
      let n = 0;
      let q = false;
      for (const c of head) {
        if (c === '"') q = !q;
        else if (c === d && !q) n++;
      }
      if (n > bestCount) {
        best = d;
        bestCount = n;
      }
    }
    return best;
  }
  var norm = (h) => h.trim().toLowerCase().replace(/\s+/g, " ");
  function guessMapping(headers, rows = []) {
    const mapping = {};
    const used = /* @__PURE__ */ new Set();
    for (const role of ROLES) {
      const names = SYNONYMS[role];
      const at = headers.findIndex((h, i) => !used.has(i) && names.includes(norm(h)));
      if (at >= 0) {
        mapping[role] = at;
        used.add(at);
      }
    }
    for (const [role, words2] of KEYWORDS) {
      if (mapping[role] != null) continue;
      const at = headers.findIndex((h, i) => !used.has(i) && words2.some((w) => norm(h).includes(w)));
      if (at >= 0) {
        mapping[role] = at;
        used.add(at);
      }
    }
    guessFromValues(mapping, used, headers.length, rows);
    return mapping;
  }
  function guessFromValues(mapping, used, width, allRows) {
    const rows = allRows.slice(0, 30);
    if (rows.length === 0) return;
    const values = (c) => rows.map((r) => (r[c] ?? "").trim()).filter(Boolean);
    const share = (c, test) => {
      const v = values(c);
      return v.length === 0 ? 0 : v.filter(test).length / v.length;
    };
    const free = () => Array.from({ length: width }, (_, i) => i).filter((i) => !used.has(i));
    const take = (role, col) => {
      if (col == null || mapping[role] != null) return;
      mapping[role] = col;
      used.add(col);
    };
    if (mapping.date == null) take("date", free().find((c) => share(c, (v) => v.length >= 6 && parseDate(v) != null) >= 0.8));
    if (mapping.amount == null && !(mapping.debit != null && mapping.credit != null)) {
      take("amount", free().find((c) => share(c, (v) => parseAmount(v) != null && /[.,]\d{1,2}$/.test(v)) >= 0.8));
    }
    if (mapping.iban == null || mapping.counterpartyIban == null) {
      for (const c of free().filter((c2) => share(c2, (v) => looksLikeIban(cleanIban(v))) >= 0.8)) {
        const own = new Set(values(c).map(cleanIban)).size === 1;
        if (own) take("iban", c);
        else take("counterpartyIban", c);
      }
    }
    const text2 = free().filter((c) => values(c).length > 0 && (rows.length < 2 || new Set(values(c)).size > 1) && share(c, (v) => parseAmount(v) == null && parseDate(v) == null) >= 0.8).map((c) => ({ c, len: values(c).reduce((n, v) => n + v.length, 0) / values(c).length })).sort((a, b) => a.len - b.len);
    if (mapping.counterparty == null && mapping.description == null && text2.length >= 2) {
      take("counterparty", text2[0].c);
      take("description", text2[text2.length - 1].c);
    } else if (mapping.counterparty == null && text2.length >= 1 && mapping.description != null) take("counterparty", text2[0].c);
    else if (mapping.description == null && text2.length >= 1 && mapping.counterparty != null) take("description", text2[text2.length - 1].c);
    else if (mapping.counterparty == null && mapping.description == null && text2.length === 1) take("counterparty", text2[0].c);
  }
  var KEYWORDS = [
    ["counterparty", ["naam", "name", "wie", "tegenpartij", "begunstigde", "payee", "merchant", "relatie"]],
    ["description", ["omschrijving", "mededeling", "description", "tekst", "betreft", "memo", "toelichting", "verwendungszweck", "details"]]
  ];
  var REQUIRED = ["date"];
  function missingRoles(m) {
    const missing = REQUIRED.filter((r) => m[r] == null);
    const hasAmount = m.amount != null || m.debit != null && m.credit != null;
    if (!hasAmount) missing.push("amount");
    return missing;
  }
  function parseAmount(raw) {
    let s = raw.replace(/[€\s ]/g, "");
    if (!s) return null;
    let sign = 1;
    if (/^\(.*\)$/.test(s)) {
      sign = -1;
      s = s.slice(1, -1);
    }
    if (s.startsWith("-")) {
      sign = -sign;
      s = s.slice(1);
    } else if (s.startsWith("+")) s = s.slice(1);
    if (s.endsWith("-")) {
      sign = -sign;
      s = s.slice(0, -1);
    }
    if (!/^[\d.,]+$/.test(s)) return null;
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    const decimalAt = Math.max(lastComma, lastDot);
    let whole = s;
    let frac = "";
    if (decimalAt >= 0) {
      const sep2 = s[decimalAt];
      const after = s.length - decimalAt - 1;
      const other = sep2 === "," ? "." : ",";
      const repeated = s.split(sep2).length > 2;
      if (!repeated && after >= 1 && after <= 2 && !(s.includes(other) && s.lastIndexOf(other) > decimalAt)) {
        whole = s.slice(0, decimalAt);
        frac = s.slice(decimalAt + 1);
      }
    }
    whole = whole.replace(/[.,]/g, "");
    if (!whole && !frac) return null;
    return sign * (Number(whole || "0") * 100 + Number((frac + "00").slice(0, 2)));
  }
  function parseDate(raw) {
    const s = raw.trim().slice(0, 10);
    let m = /^(\d{4})(\d{2})(\d{2})$/.exec(s) ?? /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return valid(m[1], m[2], m[3]);
    m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
    if (m) return valid(m[3], m[2], m[1]);
    m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/.exec(raw.trim());
    if (m) return valid(String(2e3 + Number(m[3])), m[2], m[1]);
    return null;
  }
  function valid(y, mo, d) {
    const month = Number(mo);
    const day = Number(d);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  var squash2 = (s) => s.replace(/\s+/g, " ").trim();
  var cleanIban = (s) => s.replace(/\s+/g, "").toUpperCase();
  var looksLikeIban = (s) => /^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(s);
  function previewCsv(text2, mapping) {
    const delimiter = mapping?.delimiter ?? detectDelimiter(text2);
    const rows = parseCsv(text2, delimiter);
    if (rows.length < 2) throw new Error("Dit bestand heeft geen boekingen.");
    const headers = rows[0].map((h) => h.trim());
    const { delimiter: _, ...given } = mapping ?? {};
    const guessed = mapping ? given : guessMapping(headers, rows.slice(1));
    return {
      headers,
      sample: rows.slice(1, 6),
      delimiter,
      mapping: guessed,
      needsIban: guessed.iban == null,
      missing: missingRoles(guessed)
    };
  }
  function parseCsvStatements(text2, options = {}) {
    const preview = previewCsv(text2, options.mapping);
    const m = preview.mapping;
    if (preview.missing.length > 0) throw new NeedsInput(preview);
    const fallbackIban = options.iban ? cleanIban(options.iban) : null;
    if (m.iban == null && !(fallbackIban && looksLikeIban(fallbackIban))) throw new NeedsInput(preview);
    const rows = parseCsv(text2, preview.delimiter).slice(1);
    const cell = (r, role) => m[role] != null ? (r[m[role]] ?? "").trim() : "";
    const byIban = /* @__PURE__ */ new Map();
    const seen = /* @__PURE__ */ new Map();
    const lastBalance = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const bookingDate = parseDate(cell(r, "date"));
      if (!bookingDate) continue;
      let amount2;
      if (m.amount != null) {
        amount2 = parseAmount(cell(r, "amount"));
        const dir = norm(cell(r, "direction"));
        if (amount2 != null && m.direction != null) {
          if (/^(af|d|debet|debit|dbit)/.test(dir)) amount2 = -Math.abs(amount2);
          else if (/^(bij|c|credit|crdt)/.test(dir)) amount2 = Math.abs(amount2);
        }
      } else {
        const out = parseAmount(cell(r, "debit"));
        const inn = parseAmount(cell(r, "credit"));
        amount2 = inn ? Math.abs(inn) : out ? -Math.abs(out) : null;
      }
      if (amount2 == null) continue;
      const iban = m.iban != null ? cleanIban(cell(r, "iban")) : fallbackIban;
      if (!looksLikeIban(iban)) continue;
      const counterparty = squash2(cell(r, "counterparty"));
      const counterpartyIban = cleanIban(cell(r, "counterpartyIban"));
      const description = squash2(cell(r, "description"));
      const explicitRef = cell(r, "ref");
      let bankRef;
      if (explicitRef) bankRef = `csv|${bookingDate}|${explicitRef}`;
      else {
        const key = `csv|${bookingDate}|${amount2}|${counterpartyIban}|${counterparty}|${description}`;
        const n = seen.get(iban + key) ?? 0;
        seen.set(iban + key, n + 1);
        bankRef = `${key}|${n}`;
      }
      const list = byIban.get(iban) ?? [];
      list.push({
        bankRef,
        bookingDate,
        amountCents: amount2,
        counterparty: counterparty || null,
        counterpartyIban: looksLikeIban(counterpartyIban) ? counterpartyIban : null,
        description,
        rawInfo: squash2([counterparty, description].filter(Boolean).join(" ")),
        bankCode: null,
        mcc: null
      });
      byIban.set(iban, list);
      const bal = m.balance != null ? parseAmount(cell(r, "balance")) : null;
      if (bal != null) {
        const prev = lastBalance.get(iban);
        if (!prev || bookingDate >= prev.date) lastBalance.set(iban, { date: bookingDate, cents: bal });
      }
    }
    if (byIban.size === 0) throw new Error("Geen boekingen gevonden. Controleer of de kolommen kloppen.");
    return [...byIban].map(([iban, entries]) => {
      const closing = lastBalance.get(iban);
      return {
        iban,
        openingCents: null,
        openingDate: null,
        closingCents: closing?.cents ?? null,
        closingDate: closing?.date ?? null,
        entries
      };
    });
  }
  function exampleCsv(text2, options = {}) {
    const preview = previewCsv(text2, options.mapping);
    const iban = preview.mapping.iban == null && !options.iban ? "NL00STAX0000000000" : options.iban;
    const statements = parseCsvStatements(text2, { mapping: options.mapping ?? preview.mapping, iban });
    const all = statements.flatMap((s) => s.entries);
    return {
      total: all.length,
      examples: all.slice(0, 4).map((e) => ({ date: e.bookingDate, amountCents: e.amountCents, counterparty: e.counterparty, description: e.description }))
    };
  }

  // src/lib/server/bankfile.ts
  function detectFormat(content) {
    return content.replace(/^﻿/, "").trimStart().startsWith("<") ? "camt" : "csv";
  }
  function parseBankFile(content, options = {}) {
    if (detectFormat(content) === "camt") return parseCamt(content);
    return parseCsvStatements(content, options);
  }
  function exampleBankFile(content, options = {}) {
    try {
      if (detectFormat(content) === "camt") {
        const all = parseCamt(content).flatMap((s) => s.entries);
        return { total: all.length, examples: all.slice(0, 4).map((e) => ({ date: e.bookingDate, amountCents: e.amountCents, counterparty: e.counterparty, description: e.description })) };
      }
      return exampleCsv(content, options);
    } catch (e) {
      if (e instanceof NeedsInput) return { total: 0, examples: [], needs: e.preview, error: e.message };
      return { total: 0, examples: [], error: e.message };
    }
  }

  // src/lib/server/importer.ts
  function ensureAccount(iban) {
    const row2 = db.prepare("SELECT id FROM accounts WHERE iban = ?").get(iban);
    if (row2) return row2.id;
    return Number(db.prepare("INSERT INTO accounts (iban, name) VALUES (?, ?)").run(iban, `Rekening ${iban.slice(-4)}`).lastInsertRowid);
  }
  function importFiles(files) {
    const results = [];
    const newAccounts = [];
    for (const file of files) {
      let statements;
      try {
        statements = parseBankFile(file.content, { mapping: file.mapping, iban: file.iban });
      } catch (e) {
        if (e instanceof NeedsInput) {
          results.push({ filename: file.name, account: "", total: 0, added: 0, needs: e.preview });
          continue;
        }
        results.push({ filename: file.name, account: "", total: 0, added: 0, error: e.message });
        continue;
      }
      for (const st of statements) {
        tx(() => {
          const existed = db.prepare("SELECT 1 FROM accounts WHERE iban = ?").get(st.iban);
          const accountId = ensureAccount(st.iban);
          if (!existed) newAccounts.push(accountId);
          const importId = Number(
            db.prepare("INSERT INTO imports (filename, account_id, n_total, n_new) VALUES (?, ?, ?, 0)").run(file.name, accountId, st.entries.length).lastInsertRowid
          );
          db.prepare(
            "INSERT INTO statements (import_id, account_id, opening_cents, opening_date, closing_cents, closing_date) VALUES (?, ?, ?, ?, ?, ?)"
          ).run(importId, accountId, st.openingCents, st.openingDate, st.closingCents, st.closingDate);
          const insert = db.prepare(
            `INSERT OR IGNORE INTO transactions
					 (account_id, import_id, bank_ref, booking_date, amount_cents, counterparty, counterparty_iban, description, raw_info, bank_code, mcc)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          );
          let added = 0;
          for (const e of st.entries) {
            const r = insert.run(accountId, importId, e.bankRef, e.bookingDate, e.amountCents, e.counterparty, e.counterpartyIban, e.description, e.rawInfo, e.bankCode, e.mcc);
            added += Number(r.changes);
          }
          db.prepare("UPDATE imports SET n_new = ? WHERE id = ?").run(added, importId);
          results.push({ filename: file.name, account: "", accountId, total: st.entries.length, added });
        });
      }
    }
    tx(() => {
      guessAccountKinds(newAccounts);
      linkTransfers();
    });
    const name = db.prepare("SELECT name FROM accounts WHERE id = ?");
    for (const r of results) if (r.accountId) r.account = name.get(r.accountId).name;
    return { results: results.map(({ accountId: _, ...r }) => r), categorized: autoCategorize() };
  }
  function guessAccountKinds(accountIds) {
    for (const id of accountIds) {
      const s = db.prepare(
        `SELECT COUNT(*) AS n,
				 SUM(bank_code LIKE 'CCRD%') AS card,
				 (SELECT COUNT(*) FROM transactions WHERE account_id = ?1 GROUP BY counterparty_iban ORDER BY COUNT(*) DESC LIMIT 1) AS top
				 FROM transactions WHERE account_id = ?1`
      ).get(id);
      if (s.n > 0 && s.card === 0 && s.top / s.n >= 0.8) {
        db.prepare("UPDATE accounts SET kind = 'spaar', name = 'Spaarrekening' WHERE id = ?").run(id);
      } else if (s.card > 0) {
        db.prepare("UPDATE accounts SET name = 'Betaalrekening' WHERE id = ? AND name LIKE 'Rekening %'").run(id);
      }
    }
  }
  function linkTransfers() {
    db.exec(`
		UPDATE transactions SET transfer_account_id = (SELECT id FROM accounts WHERE iban = transactions.counterparty_iban)
		WHERE transfer_account_id IS NULL AND counterparty_iban IN (SELECT iban FROM accounts);
	`);
    const unpaired = db.prepare("SELECT id, account_id, transfer_account_id, amount_cents, booking_date FROM transactions WHERE transfer_account_id IS NOT NULL AND transfer_tx_id IS NULL").all();
    const find2 = db.prepare(
      `SELECT id FROM transactions WHERE account_id = ? AND transfer_account_id = ? AND amount_cents = ? AND transfer_tx_id IS NULL
		 AND abs(julianday(booking_date) - julianday(?)) <= 3 ORDER BY abs(julianday(booking_date) - julianday(?)) LIMIT 1`
    );
    const link2 = db.prepare("UPDATE transactions SET transfer_tx_id = ? WHERE id = ?");
    const linked = /* @__PURE__ */ new Set();
    for (const t of unpaired) {
      if (linked.has(t.id)) continue;
      const other = find2.get(t.transfer_account_id, t.account_id, -t.amount_cents, t.booking_date, t.booking_date);
      if (!other) continue;
      linked.add(other.id);
      link2.run(other.id, t.id);
      link2.run(t.id, other.id);
    }
    db.exec(`
		DELETE FROM splits WHERE source != 'hand' AND transaction_id IN (
			SELECT t.id FROM transactions t JOIN accounts a ON a.id = t.account_id
			WHERE t.transfer_account_id IS NOT NULL AND NOT (a.kind = 'spaar' AND t.amount_cents > 0)
		);
	`);
  }

  // src/routes/api/v1/importeren/+server.ts
  function GET6() {
    const imports = db.prepare(
      `SELECT i.id, i.filename, i.imported_at, i.n_total, i.n_new, a.name AS account
			 FROM imports i JOIN accounts a ON a.id = i.account_id ORDER BY i.id DESC LIMIT 20`
    ).all();
    return json({ imports });
  }
  async function POST7({ request }) {
    const b = await request.json().catch(() => null);
    const files = Array.isArray(b?.files) ? b.files.filter((f) => typeof f?.name === "string" && typeof f?.content === "string") : [];
    if (files.length === 0) error(400, "Kies eerst een of meer bestanden (XML of CSV).");
    return json(
      importFiles(
        files.map((f) => ({
          name: f.name,
          content: f.content,
          mapping: f.mapping && typeof f.mapping === "object" ? f.mapping : void 0,
          iban: typeof f.iban === "string" ? f.iban : void 0
        }))
      )
    );
  }

  // src/routes/api/v1/importeren/voorbeeld/+server.ts
  var server_exports12 = {};
  __export(server_exports12, {
    POST: () => POST8
  });
  async function POST8({ request }) {
    const b = await request.json().catch(() => null);
    if (typeof b?.content !== "string") error(400, "Geef de inhoud van het bestand mee.");
    return json(
      exampleBankFile(b.content, {
        mapping: b.mapping && typeof b.mapping === "object" ? b.mapping : void 0,
        iban: typeof b.iban === "string" ? b.iban : void 0
      })
    );
  }

  // src/routes/api/v1/overzicht/+server.ts
  var server_exports13 = {};
  __export(server_exports13, {
    GET: () => GET7
  });
  function GET7({ url }) {
    return json(overview(url.searchParams.get("maand")));
  }

  // src/routes/api/v1/regels/+server.ts
  var server_exports14 = {};
  __export(server_exports14, {
    GET: () => GET8,
    POST: () => POST9
  });
  function GET8() {
    const tree = loadTree();
    const rules = db.prepare("SELECT id, field, op, pattern, category_id FROM rules ORDER BY field = 'mcc', created_at DESC, id DESC").all();
    const budgets = tree.flat.filter((n) => isBudgetId(tree, n.id)).map((n) => ({ id: n.id, name: n.name, path: n.path.join(" \u203A ") }));
    return json({ rules, budgets });
  }
  async function POST9({ request }) {
    const b = await request.json().catch(() => null);
    const field = String(b?.field ?? "");
    const op = b?.op === "bevat" ? "bevat" : "is";
    const pattern = String(b?.pattern ?? "").trim();
    const category = Number(b?.category_id);
    if (!pattern || !category || !["iban", "tegenpartij", "omschrijving", "mcc"].includes(field)) error(400, "Vul alle velden van de regel in.");
    if (!isBudgetId(loadTree(), category)) error(400, "Kies een budget, geen groep.");
    db.prepare(
      `INSERT INTO rules (field, op, pattern, category_id) VALUES (?, ?, ?, ?)
		 ON CONFLICT(field, op, pattern) DO UPDATE SET category_id = excluded.category_id`
    ).run(field, op, field === "iban" ? pattern.toUpperCase().replace(/\s/g, "") : pattern.toLowerCase(), category);
    return json({ applied: autoCategorize() });
  }

  // src/routes/api/v1/regels/[id]/+server.ts
  var server_exports15 = {};
  __export(server_exports15, {
    DELETE: () => DELETE2,
    PUT: () => PUT3
  });
  async function PUT3({ params, request }) {
    const b = await request.json().catch(() => null);
    const category = Number(b?.category_id);
    if (!isBudgetId(loadTree(), category)) error(400, "Kies een budget, geen groep.");
    db.prepare("UPDATE rules SET category_id = ? WHERE id = ?").run(category, Number(params.id));
    return json({ applied: autoCategorize() });
  }
  function DELETE2({ params }) {
    db.prepare("DELETE FROM rules WHERE id = ?").run(Number(params.id));
    return json({ ok: true });
  }

  // src/routes/api/v1/rekeningen/+server.ts
  var server_exports16 = {};
  __export(server_exports16, {
    GET: () => GET9
  });
  function GET9() {
    return json({ accounts: accounts() });
  }

  // src/routes/api/v1/rekeningen/[id]/+server.ts
  var server_exports17 = {};
  __export(server_exports17, {
    PUT: () => PUT4
  });
  async function PUT4({ params, request }) {
    const b = await request.json().catch(() => null);
    const name = typeof b?.name === "string" ? b.name.trim() : "";
    if (!name) error(400, "Geef de rekening een naam.");
    const done = db.prepare("UPDATE accounts SET name = ?, kind = ? WHERE id = ?").run(name, b.kind === "spaar" ? "spaar" : "betaal", Number(params.id));
    if (!done.changes) error(404, "Rekening niet gevonden.");
    return json({ ok: true });
  }

  // src/routes/api/v1/spaarpotten/+server.ts
  var server_exports18 = {};
  __export(server_exports18, {
    GET: () => GET10
  });
  function GET10() {
    return json(savings());
  }

  // src/routes/api/v1/startsaldo/+server.ts
  var server_exports19 = {};
  __export(server_exports19, {
    GET: () => GET11,
    PUT: () => PUT5
  });

  // src/lib/server/instellingen.ts
  function dayBefore(date) {
    const d = /* @__PURE__ */ new Date(date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  function startData(datum) {
    const first = db.prepare("SELECT MIN(booking_date) AS d FROM transactions").get().d;
    const suggested = first ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const startdatum = datum ?? getSetting("startdatum") ?? suggested;
    const savings2 = accounts().filter((a) => a.kind === "spaar");
    const balance = savings2.reduce((s, a) => s + (accountBalance(a.id, dayBefore(startdatum)) ?? 0), 0);
    const tree = loadTree();
    const isPot = (id) => {
      const n = id != null ? tree.byId.get(id) : void 0;
      return !!n && holdsSavings(n);
    };
    const pots = tree.flat.filter((n) => isPot(n.id)).map((n) => ({
      id: n.id,
      name: n.name,
      // Staat de bovenliggende map zelf niet in de lijst, dan tonen we het pad als context.
      context: isPot(n.parent_id) ? "" : n.path.join(" \u203A "),
      depth: n.depth,
      opening_cents: n.opening_cents,
      isGroup: n.children.length > 0
    }));
    return { startdatum, saved: getSetting("startdatum"), balance, pots, incomePot: incomePotId(tree), hasSavings: savings2.length > 0 };
  }
  function saveStart(datum, incomePot, openings) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return "Kies een geldige startdatum.";
    tx(() => {
      setSetting("startdatum", datum);
      setSetting("inkomstenpot", String(incomePot || ""));
      const update = db.prepare("UPDATE categories SET opening_cents = ? WHERE id = ?");
      for (const [id, value2] of Object.entries(openings)) update.run(typeof value2 === "number" ? value2 : parseMoney(value2) ?? 0, Number(id));
    });
    return null;
  }

  // src/routes/api/v1/startsaldo/+server.ts
  function GET11({ url }) {
    return json(startData(url.searchParams.get("datum")));
  }
  async function PUT5({ request }) {
    const b = await request.json().catch(() => null);
    const openings = {};
    for (const [id, v] of Object.entries(b?.openings ?? {})) if (Number.isInteger(v)) openings[id] = v;
    const problem = saveStart(String(b?.startdatum ?? ""), Number.isInteger(b?.income_pot) ? b.income_pot : null, openings);
    if (problem) return json({ error: problem }, { status: 400 });
    return json({ ok: true });
  }

  // core/dist/routes.gen.ts
  var ROUTES = [
    { segments: ["backup"], mod: server_exports },
    { segments: ["boekingen"], mod: server_exports2 },
    { segments: ["boekingen", "[id]"], mod: server_exports3 },
    { segments: ["boekingen", "[id]", "afsluiten"], mod: server_exports4 },
    { segments: ["boekingen", "[id]", "koppel"], mod: server_exports5 },
    { segments: ["budgetten"], mod: server_exports6 },
    { segments: ["budgetten", "[id]"], mod: server_exports7 },
    { segments: ["budgetten", "[id]", "bedrag"], mod: server_exports8 },
    { segments: ["budgetten", "[id]", "plaats"], mod: server_exports9 },
    { segments: ["budgetten", "volgorde"], mod: server_exports10 },
    { segments: ["importeren"], mod: server_exports11 },
    { segments: ["importeren", "voorbeeld"], mod: server_exports12 },
    { segments: ["overzicht"], mod: server_exports13 },
    { segments: ["regels"], mod: server_exports14 },
    { segments: ["regels", "[id]"], mod: server_exports15 },
    { segments: ["rekeningen"], mod: server_exports16 },
    { segments: ["rekeningen", "[id]"], mod: server_exports17 },
    { segments: ["spaarpotten"], mod: server_exports18 },
    { segments: ["startsaldo"], mod: server_exports19 }
  ];

  // core/searchparams.ts
  var SearchParams = class {
    constructor(query = "") {
      __publicField(this, "pairs", []);
      for (const part of query.replace(/^\?/, "").split("&")) {
        if (!part) continue;
        const [k, v = ""] = part.split("=");
        this.pairs.push([dec(k), dec(v)]);
      }
    }
    get(key) {
      return this.pairs.find(([k]) => k === key)?.[1] ?? null;
    }
    getAll(key) {
      return this.pairs.filter(([k]) => k === key).map(([, v]) => v);
    }
    has(key) {
      return this.pairs.some(([k]) => k === key);
    }
  };
  var dec = (s) => {
    try {
      return decodeURIComponent(s.replace(/\+/g, " "));
    } catch {
      return s;
    }
  };

  // core/entry.ts
  function match(path) {
    const parts = path.split("/").filter(Boolean);
    let best = null;
    for (const r of ROUTES) {
      if (r.segments.length !== parts.length) continue;
      const params = {};
      let fixed = 0;
      const ok = r.segments.every((seg, i) => {
        const m = /^\[(.+)\]$/.exec(seg);
        if (m) {
          params[m[1]] = decodeURIComponent(parts[i]);
          return true;
        }
        if (seg === parts[i]) fixed++;
        return seg === parts[i];
      });
      if (ok && (!best || fixed > best.fixed)) best = { mod: r.mod, params, fixed };
    }
    return best;
  }
  async function handle(method, path, query, body) {
    const found = match(path);
    if (!found) return { status: 404, body: JSON.stringify({ message: "Niet gevonden" }) };
    const fn = found.mod[method.toUpperCase()];
    if (!fn) return { status: 405, body: JSON.stringify({ message: "Methode niet toegestaan" }) };
    const event = {
      params: found.params,
      url: { searchParams: new SearchParams(query) },
      request: { json: async () => JSON.parse(body ?? "null") }
    };
    try {
      return await fn(event);
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, body: JSON.stringify(e.body) };
      return { status: 500, body: JSON.stringify({ message: "Internal Error" }) };
    }
  }
  return __toCommonJS(entry_exports);
})();
