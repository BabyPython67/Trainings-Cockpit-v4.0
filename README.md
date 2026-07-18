# Trainings-Cockpit v7.2

Volleyball · Laufen · Kraft · Schule · Kalender

Eigenständige Single-File-Web-App (React, im Browser, ohne Backend). Gehostet über GitHub Pages als `index.html`.

## Aufbau

Zweistufige Navigation: oben die Bereiche **Training**, **Kalender** und **Schule**, im Training darunter die Tabs Cockpit · Woche · Kcal · Fortschritt · Recovery. Cockpit ist die Startseite und zeigt einen Schnellblick über alles (nächste Fristen inklusive).

## Versionen

- v4.0 – Schule-Tab (Hausaufgaben & Klausuren, Fristen-Ampel)
- v4.1 – Navigation in Bereiche Training/Schule umgebaut (Vorbereitung für den Kalender)
- v5.0 – Krankheits-Logik: Krankheiten lassen sich im Recovery-Bereich eintragen (auch rückwirkend). Betroffene Einheiten gelten als „entschuldigt" statt „offen" (eigene Stufe in den Charts, Serie bleibt erhalten), harte Einheiten in den Aufbau-Tagen danach bekommen leichte Empfehlungen, und die Block-Steigerung des Laufplans verschiebt sich um die verlorenen Wochen. Wahlweise bleibt der 5-km-Testtermin fest (Endblock wird kürzer) oder der Plan verlängert sich nach hinten (Umschalter in den Einstellungen).
- v5.1 – Schule-Tab: bestehende Hausaufgaben/Klausuren lassen sich nachträglich bearbeiten (Stift-Symbol öffnet das Formular vorausgefüllt, Speichern aktualisiert den Eintrag statt einen neuen anzulegen, Abbrechen verwirft die Änderung).
- v6.0 – Großes Bündel:
  - **Kalender-Bereich** (zurück aus v4.2, an die aktuelle Logik angepasst): Monat/Woche/Tag, Training + Schule mit Filter-Chips, Farb-Punkte pro Tag, Tages-Detail per Tap. Berücksichtigt Krankheits-Verzug, Ausfälle und Ersatz-Einheiten.
  - **Volleyball-Ausfall**: Vereinstraining lässt sich im Woche-Tab als „ausgefallen" markieren (zählt dann nirgends mehr als offen) und durch eine frei wählbare Ersatz-Einheit (Sportart, Tag, Dauer, Belastung) ersetzen.
  - **Schule**: Einträge wahlweise nach Fälligkeit oder nach Fach gruppiert; Klausuren deutlich gekennzeichnet (roséfarbener Randbalken + Chip) — auch im Cockpit-Schnellblick und Kalender.
  - **Lauf-Detail-Charts**: im aufgeklappten Lauf zeigen zwei Verläufe Pace und Puls je Runde, mit den Zielbereichen aus dem Plan (HF-Bereich; Ziel-Pace ±15 s bei Intervallen/Tempo) als Band.
  - **Fortschritt je Lauftyp** ersetzt den Pace-Verlauf: Arbeits-Pace und Ø-Puls übereinander, mit denselben Zielbändern — gleiche Pace bei weniger Puls = echte Verbesserung.
  - **Klarere Charts**: erledigt/entschuldigt/offen jetzt eindeutig (voll/schraffiert/Umriss); Tooltips an der Chart-Oberkante (iPhone: Finger verdeckt nichts mehr); Beschriftungen weichen der Datenlinie automatisch aus.
- v6.1 – Feedback aus dem ersten Testlauf: das aufgeklappte Ersatz-Formular bei einem ausgefallenen Volleyball-Training war komplett ausgegraut (nur die durchgestrichene Kopfzeile sollte das sein); Laufökonomie zurück zur kombinierten Doppelachsen-Ansicht (im direkten Vergleich bevorzugt).
- v6.2 – Weiteres Feedback-Bündel:
  - **Cockpit**: toter externer „Lauf-Tracker"-Link ersetzt durch eine große Fortschrittskarte „Laufplan-Fortschritt" (X von Y Laufeinheiten, live berechnet — 58 ist nur der Basisfall ohne Krankheit; je nach Krankheitsverlauf kann die echte Zahl höher, z. B. durch einen Nachhol-Effekt bei „dynamic", oder niedriger liegen, z. B. durch die Kürzung bei „fixed").
  - **Laufökonomie, Pace-HF-Verhältnis und VO₂max-Schätzung** in einer Karte mit Segment-Umschalter statt drei einzelnen Cards; Laufökonomie und Pace-HF zusätzlich nach Lauftyp filterbar; beide bekommen (wie VO₂max) einen fett hervorgehobenen „aktueller Wert"-Kopf.
  - **Zeitraum-Filter** (Letzte 10 Einheiten / 2 Wochen / 30 Tage / 90 Tage / Alle) an praktisch jedem Verlaufs-Chart, jeweils einzeln wählbar: 5K-Prognose, Fortschritt je Lauftyp, die drei Smart-Charts, Kraftwerte, Schlaf-Verlauf, Gewicht, Kalorien-Verlauf.
  - **Motivations-Feinschliff**: Wochenrhythmus-Vergleich jetzt als fette Zahl mit Trend-Badge statt kleinem grauem Text; neue „Bestwerte"-Karte bei den Kraftwerten (gab es bei Laufen schon, bei Kraft bisher nicht).
  - **Lauf-Detail neu gedacht**: statt zwei getrennter Pace-/Puls-Verläufe je Runde jetzt ein Pace-Puls-Streudiagramm (chronologisch verbunden, Farbverlauf hell→rose = früh→spät im Lauf) plus eine Entkopplungs-Kennzahl („+X % HF-Drift") — zeigt den Bezug zwischen Pace und Puls direkt, nicht nur beide Werte nebeneinander.
- v6.3 – Feedback aus dem zweiten Testlauf:
  - **Einzellauf-Chart erneut überarbeitet**: das Streudiagramm aus v6.2 erfüllte seinen Zweck nicht (alle Runden sollten gleichzeitig sichtbar und direkt vergleichbar sein, der Zielbereich pro Runde sofort als „innerhalb/außerhalb" erkennbar). Zurück zur bewährten Runden-Liste, jetzt erweitert: die Pace-Balken-Spur zeigt bei Intervalle/Tempo den Zielbereich als schattierte Zone um die Zielmarke (Balkenspitze sichtbar drin oder draußen), der Puls-Wert bekommt eine farbige Markierung (grün = im Plan-Bereich, rose = außerhalb). Die Entkopplungs-Kennzahl bleibt als Kopfzeile erhalten.
  - **Achsenbeschriftung bei langem Zeitraum repariert**: bei „Alle"/„90 Tage" (seit v6.2 möglich) überlappten sich die Datums-Beschriftungen auf mehreren Charts, u. a. hatte der Kalorien-Verlauf ein hartcodiertes Intervall, das nur zur alten festen 14-Tage-Ansicht passte. Alle Zeitreihen-Charts nutzen jetzt Recharts' eingebauten „preserveStartEnd"-Modus statt eines festen Intervalls — verdichtet die Beschriftungen automatisch je nach Datenmenge, ohne dass (wie bei einem selbstgebauten festen Intervall) die letzte Beschriftung am Rand abgeschnitten wird.
- v6.4 – Feedback aus dem dritten Testlauf, Lauf-Detail:
  - **Puls-Verlaufschart zusätzlich zur Rundenliste**: die Pace-Rundenliste bleibt (Stärke: alle Runden gleichzeitig vergleichbar), bekommt aber ein eigenes Puls-Verlaufschart darunter statt einer Puls-Zahl pro Zeile — Pace-Vergleich und Puls-Verlauf sind unterschiedliche Fragen und bekommen jetzt je eine passende Darstellung, statt in einer Zeile zusammengequetscht zu sein.
  - **Intervall-HF-Bewertung ehrlicher**: der Rundendurchschnitt wird bei Intervallen durch die Anlaufzeit nach jeder Pause (Cardiac Lag) gedrückt — eine ganze Session konnte dadurch fälschlich komplett als „außerhalb des Ziels" markiert werden, obwohl der Puls pro Runde tatsächlich ins Zielband hineinlief. Genutzt wird jetzt der Rundenpeak (aus einer bisher ungenutzten Spalte im Garmin-CSV-Rundenexport) minus einer kleinen Toleranz statt des Durchschnitts; die erste Arbeitsrunde bleibt immer neutral bewertet.
  - **Aufgeklappte Runde entrümpelt**: die generische Kollaps-Übersichtszeile (Ø bpm/spm/Höhenmeter/kcal) wird ausgeblendet, sobald die Runden-Details offen sind — die stapelten sich sonst mit der präziseren Kopfzeile der Rundenliste.
  - **Neue Build-/Test-Infrastruktur**: `tools/` (Build-, Test- und Browser-Verifikationsscripts) und `workflows/ship-version.md` (Ablauf-SOP inkl. bekannter Fallstricke) liegen jetzt im Repo statt nur in einer einzelnen Session — künftige Versionen bauen auf denselben, bereits erprobten Tools auf.
- v7.0 – Gesamtstatistik, Auszeichnungen und Arbeitsabschnitt-Fixes:
  - **Gesamtstatistik im Cockpit** (Garmin-inspiriert): Kacheln für abgehakte Einheiten (alle drei Sportarten), Gesamt-Distanz und Gesamt-Laufzeit; persönliche Rekorde (längster Lauf, 5/10 km anteilig aus Läufen ≥ der Distanz, beste Trainingswoche); Kilometer-pro-Monat-Balkenchart.
  - **Auszeichnungen** (kuratiert, bewusst KEIN Punkte-/Level-System): Lifetime-Abzeichen mit rückwirkend korrektem Erreichungsdatum aus der Historie (Lauf-km 25–1000, Krafteinheiten 10–200 als eindeutige Trainingstage, Volleyball 20–200, längste Wochen-Serie, Laufplan komplett) und Live-Serien-Abzeichen (4/8/12/16 Wochen), die bewusst wieder verschwinden, wenn die Serie reißt. Cockpit-Karte mit Serie-Hero, "Neueste Erfolge", "Nächste Ziele" mit Fortschrittsbalken und aufklappbaren Stufen-Leitern (Zukunft ausgegraut); Pop-up bei frisch erreichtem Abzeichen, heute Erreichtes wird angepinnt; einzelne Abzeichen in den Einstellungen ausblendbar. Alles rein aus den Logs abgeleitet, nichts wird als "erreicht"-Flag gespeichert.
  - **Aufbau-nach-Krankheit greift jetzt wirklich ein** (Bugfix): Im 3-Tage-Aufbaufenster werden Tempo/Intervalle zur echten Easy-Einheit der Woche (Easy-HF-Band, kein Pace-Ziel, Last 3) und Kraft zum Mobility-Block — vorher stand nur ein Hinweistext neben unveränderten harten Zielwerten. Turniertag bei Krankheit: Text ersetzt statt widersprüchlich angehängt ("Start nur in Absprache … dann mit Vorsicht Bestleistung anstreben").
  - **Puls-Verlaufschart konsistent** (Bugfix): Geplotteter Wert und Punktfarbe kommen aus einer Quelle — Intervalle plotten und bewerten Rundenpeak−Toleranz, alle anderen Lauftypen den Runden-Ø. Vorher konnte ein grüner Punkt sichtbar unterhalb des Zielbands hängen (Linie = Ø, Farbe = Peak).
  - **Arbeitsabschnitt konsequent überall** (Bugfix): Rundenlisten-Anker bei Easy/Lang/Test jetzt Arbeits-Pace statt Gesamtschnitt inkl. Warm-up/Cool-down (Kopfzeile "Lauf-Abschnitt Ø …"; Mini-Restrunden zählen nicht als Arbeit); Pace-HF-Verhältnis und VO₂max nutzen bei allen Steady-Läufen die Arbeitswerte. Vollständiger Audit aller Pace-/HF-Verwendungen: verbleibende Gesamtwerte (Lauf-Listenzeile, Import-Vorschau, Kcal) sind bewusste Gesamt-Infos.
  - **.FIT-Export entfernt** (Nutzer-Feedback: praktisch nicht nutzbar) — das Workout-Rezept mit "Kopieren" + Garmin-Connect-Anleitung bleibt und reicht (einmal pro Blockwechsel anlegen).
- v7.1 – Feedback aus dem ersten v7.0-Testlauf:
  - **Fortschritt je Lauftyp**: Werte waren zu subtil (nur eine kleine Ablesezeile nach Tap). Jetzt ein fett hervorgehobener Pace-/Puls-Kopf wie bei den Smart-Charts, live sichtbar, und der angetippte Punkt hebt sich im Chart selbst sichtbar ab (größer, mit Ring) statt nur eine dünne Linie zu verschieben.
  - **Ausgefallene Einheiten** wurden im „Wochenrhythmus" (Cockpit) und in „Diese Woche: Plan vs. Ist" (Recovery) bisher komplett rausgefiltert und sahen dadurch wie ein nie geplanter Ruhetag aus. Beide Charts zeigen Ausfälle jetzt als eigenen, grau gestrichelten Zustand (Tooltip + Legende), getrennt von echten Ruhetagen und von offenen Einheiten.
  - **Gesamtstatistik**: Laufzeit als Dezimalstunden (z. B. „4.2 h") statt h:min, auf Nutzerwunsch.
  - **„Längste Wochen-Serie"-Abzeichen** zeigte bisher nur Titel + Datum, nie die tatsächlich erreichte Wochenzahl — jetzt steht sie sichtbar in der Kachel.
  - **Abzeichen-Icons** bekommen eine Ring-Eskalation: mit jeder einzelnen Stufe wachsen Zackenzahl (gedeckelt), Ringbreite, Glow und Farbsättigung sichtbar weiter — angelehnt an klassische Rang-/Prestige-Abzeichen, jede Stufe unterscheidet sich von der vorherigen.
- v7.2 – Genauere Auswertung der Garmin-Rundendaten (Nutzer-Feedback):
  - **Gesamtstatistik**: eigene Kachel-Zeile „Davon Arbeitsabschnitt" (Distanz + Laufzeit ohne Warm-up/Cool-down), gleich groß wie die Gesamt-Kacheln — bewusst nicht als kleine Unterzeile, sondern gleichwertig.
  - **Übersichtszeile bei den Läufen**: Pace/Ø Puls/Kadenz zeigen jetzt konsequent den Arbeitsabschnitt statt den Gesamtschnitt inkl. Warm-up/Cool-down (Gesamt-Pace erscheint nur noch als kleiner Zusatz, wenn sie abweicht); Höhenmeter/Kalorien/Distanz/Gesamtzeit blieben unverändert aus der CSV-Übersichtszeile.
  - **Ausreißer-Runden erkannt**: die bislang ungenutzte Spalte „Zeit in Bewegung" pro Runde deckt Stopps innerhalb einer Runde auf (z. B. Ampel). Betroffene Runden bekommen eine korrigierte Pace aus der Bewegungszeit statt der Rundenzeit, ihr Puls fließt nicht mehr in Durchschnittswerte (Pace-HF-Verhältnis, VO₂max, Drift-Kennzahl, Puls-Verlaufschart) ein — sichtbar markiert (● + Erklärzeile) statt kommentarlos verworfen.
  - **Kadenz/Schrittlänge** werden jetzt zusätzlich pro Runde eingelesen (bisher nur aus der Gesamtzeile) und in der Laufökonomie-Karte auf den Arbeitsabschnitt umgestellt.
  - Bugfix währenddessen gefunden: eine stopp-korrigierte, künstlich schnell wirkende Pace konnte bei Intervallen die Arbeit/Pause-Cluster-Erkennung kippen und echte Arbeitsrunden fälschlich als Pause einstufen — behoben, indem die Cluster-Erkennung auf der unkorrigierten Rundenzeit-Pace arbeitet, nicht auf der bereits korrigierten Anzeige-Pace.

## Dateien

- `index.html` – fertige, ausgelieferte App (gebaut)
- `Trainings-Cockpit-v7.2-Quellcode.txt` – lesbare Quellfassung (Basis für künftige Builds)
- `tools/` – Build-/Test-/Verifikations-Scripts, `workflows/ship-version.md` – Ablauf-SOP für neue Versionen
