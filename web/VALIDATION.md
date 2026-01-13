Manuelle Validierungsschritte

1. Builden des WASM-Moduls (optional):
   - cd wasm
   - wasm-pack build --target web --out-dir ../web/pkg

2. Webserver starten:
   - cd web
   - python3 -m http.server 8000
   - Webseite öffnen: http://localhost:8000

3. Ziehung starten und Beobachten:
   - Klicke auf "Ziehung starten" und beobachte die Animation
   - Prüfe, dass 6 eindeutige Zahlen angezeigt werden
   - Wiederhole mehrere Ziehungen; prüfe, dass keine offensichtlichen Muster (z. B. 1,2,3,4,5,6) angezeigt werden

4. Persistenz:
   - Nach mehreren Ziehungen sollte die Seitenleiste (Letzte Ziehungen) die Ergebnisse zeigen
   - Der Eintrag liegt in `localStorage.lotto_history`

5. Fallback:
   - Wenn kein WASM verfügbar ist, wird eine JS-Fallback-Implementierung verwendet

6. Tests (Rust):
   - cd wasm
   - cargo test

Hinweis: Die Heuristiken sind bewusst konservativ - sehr seltene echte Kombis könnten theoretisch abgewiesen werden, dies reduziert aber deutlich offensichtliche Muster in den Ergebnissen.