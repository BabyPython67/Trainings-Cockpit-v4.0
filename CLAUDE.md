# Trainings-Cockpit — Hinweise für Claude Code

Dieses Repo ist Teil eines Mehr-Repo-Projekts für Mirko (18, Schüler): Trainings-App für
Volleyball/Laufen/Kraft/Schule/Kalender. Bei JEDER neuen Session, die dieses Repo betrifft:

1. **Zuerst komplett lesen** (Repo `BabyPython67/claude-memory`):
   - `Trainings-Cockpit — Projektkontext.txt` — Arbeitsweise/Standing Rules (Abschnitt 1),
     Versionshistorie, bewusste Entscheidungen. Diese CLAUDE.md hier ersetzt das NICHT, sie ist
     nur ein Pointer, damit das Lesen nicht bei jeder Session erneut vom Nutzer angestoßen werden muss.
   - `Trainings-Cockpit — Plan-Status.txt` — aktueller Trainings-/Krankheitsstand (Pflicht-Pflege
     nach jeder relevanten Änderung).
2. **Danach dieses Repo**: `README.md` + aktuelle `Trainings-Cockpit-vX.Y-Quellcode.txt`.

## Die wichtigsten Standing Rules auf einen Blick

(Vollständig und mit Begründung in `claude-memory`s Projektkontext.txt Abschnitt 1 — hier nur als
Kurzreferenz, damit sie auch ohne das volle Nachschlagen präsent sind.)

- **Direkt auf main mergen**, sobald getestet — kein offener PR, kein Warten auf Freigabe.
- **Planmodus bei größeren Änderungen**: kurz skizzieren (Ziel/betroffene Dateien/Datenstruktur),
  bei mehreren sinnvollen Wegen Optionen mit Trade-offs nennen statt stillschweigend zu wählen. Kleine,
  eindeutige Änderungen direkt umsetzen.
- **Qualitäts-Review vor jeder Lieferung**: dieselbe Fehlerklasse aktiv im Rest der Datei suchen,
  nicht nur die gemeldete Stelle flicken. Keine Symptom-Patches.
- **Design-Aufgaben: erst Samples-Artefakt, dann Implementierung** — bei visuell geprägten Aufgaben
  (Design-System-Umbau, externes Mockup/Prompt umsetzen, offenes ästhetisches Feedback) zuerst ein
  eigenständiges HTML-Muster als Artifact bauen und mit dem Nutzer freigeben lassen, NICHT direkt im
  App-Code iterieren. Dabei aktiv beachten (aus dem v7.12-Redesign gelernt, Details in Projektkontext.txt):
  bekannte Fallstricke aus `workflows/ship-version.md` sofort anwenden statt erst beim nächsten Mal;
  fehlende, aber angekündigte Referenzbilder aktiv ansprechen statt stillschweigend nur mit Text
  weiterzuarbeiten; vor dem ersten Zeigen eine eigene kritische Design-Abnahme durchführen (liest sich
  ein Detail als Fehler/Schaden statt als Absicht? ist es ein bekanntes "billiges" CSS-Muster?); neue,
  dauerhafte UI-Elemente als Option zur Wahl stellen statt direkt zu bauen. Ein freigegebenes Muster
  ersetzt NICHT die reguläre Verifikation (Schritt-für-Schritt-SOP unten).
- **Verifizieren statt behaupten**: bei Fragen zum eigenen Erledigt-/Gemerged-Stand die Datei/den
  Branch tatsächlich frisch prüfen, nicht aus dem Gedächtnis antworten.
- **Consultant-Personality**: aktiv eigene fachliche Einschätzung/Gegenvorschläge einbringen, nicht
  nur wörtlich 1:1 umsetzen.
- Nach mehrrundigen Feedback-Sessions (>3 Zyklen zu demselben Artefakt) von sich aus eine kurze Retro
  anbieten, statt darauf zu warten, dass der Nutzer danach fragen muss.

## Build/Test/Verify

Scripts liegen in `tools/`, der operative Ablauf inkl. bekannter Fallstricke steht in
`workflows/ship-version.md` — dort zuerst nachsehen, bevor Build-/Test-/Verify-Logik neu geschrieben
wird ("Look for existing tools first").

## Kommunikation

Mirko kennt sich nur minimal mit Code/Fachsprache aus: Erklärungen laienverständlich, ohne Jargon;
technische Details nur auf ausdrückliche Nachfrage.
