# Lottozahlengenerator (WASM)

Minimaler Lottozahlengenerator mit WebAssembly (Rust) und einer ansprechenden Web-UI.

Funktionen:
- Ziehung von 6 eindeutigen Zahlen zwischen 1 und 49
- Ziehung wird animiert (physikalische Ziehung simuliert)
- Alle Kombinationen werden lokal gespeichert (localStorage)
- Heuristiken blockieren offensichtliche Muster (z.B. lange aufeinanderfolgende Reihen, zu viele "Geburtstagszahlen")

## Aufbau
- `/wasm` - Rust-Quellcode für das WebAssembly-Modul
- `/web` - Web-Frontend (HTML/CSS/JS)

## Build & Run
Voraussetzungen:
- Rust + wasm-pack

1. Build des WASM-Moduls:

   cd wasm
   wasm-pack build --target web --out-dir ../web/pkg

2. Webserver starten (z.B. mit Python):

   cd web
   python3 -m http.server 8000

   Dann `http://localhost:8000` im Browser öffnen.

Hinweis: Wenn kein WASM-Binary vorhanden ist, verwendet die Seite eine gleiche JS-Fallback-Implementierung.

Tastenkürzel: Du kannst **F5**, **Strg+R** (Windows/Linux) oder **Cmd+R** (macOS) drücken, um statt der Browser-Neuladen-Funktion eine Ziehung zu starten (die Seite verhindert dann das Reload). Falls du F5 auf einer anderen Seite innerhalb dieses Hosts drückst, leitet die Seite den Browser zur Generator‑Seite weiter und startet die Ziehung automatisch (`?auto=1`). Alternativ kann die Seite automatisch eine Ziehung starten, wenn du sie mit `?auto=1` oder `?draw=1` öffnest, z.B. `http://localhost:8000?auto=1`. (Hinweis: globale Browser-Shortcuts außerhalb dieses Hosts können nicht verändert werden.)

## Sicherheit & Zufälligkeit
Das WASM-Modul verwendet `getrandom` für gute Entropie (System-Krypto). Die Kombinationen werden durch Mischen (Fisher–Yates) erzeugt, wodurch jede Kombination gleichverteilt ist.

## Lizenz
MIT