# Dokumentation

Diese Datei beschreibt die Funktionsweise der MDX-Präsentationsanwendung. Sie ist in zwei Abschnitte unterteilt: eine für Benutzer und eine für Entwickler.

## Benutzerhandbuch

Willkommen bei der MDX-Präsentationsanwendung! Mit diesem Tool können Sie interaktive Präsentationen aus einfachen Textdateien erstellen.

### Erste Schritte

Um loszulegen, benötigen Sie eine ZIP-Datei, die Folgendes enthält:

- **Eine MDX-Datei:** Dies ist die Hauptdatei für Ihre Präsentation. Sie kann die Dateiendung `.mdx` oder `.md` haben.
- **(Optional) Mediendateien:** Bilder (PNG, JPG, SVG usw.) und Videos (MP4, WebM usw.), die Sie in Ihrer Präsentation verwenden möchten.

### So erstellen Sie Ihre Präsentation

1.  **MDX-Datei schreiben:**
    -   Erstellen Sie eine Textdatei und schreiben Sie Ihre Inhalte im Markdown-Format.
    -   Trennen Sie einzelne Folien durch eine horizontale Linie (`---`) in Ihrer Datei.
    -   Sie können auch spezielle Komponenten wie `Callout`, `CodeBlock` und `Highlight` verwenden, um Ihre Inhalte ansprechender zu gestalten.

2.  **ZIP-Datei packen:**
    -   Legen Sie Ihre MDX-Datei und alle Mediendateien in einen Ordner.
    -   Komprimieren Sie diesen Ordner zu einer ZIP-Datei.

3.  **Präsentation laden:**
    -   Öffnen Sie die Anwendung in Ihrem Webbrowser.
    -   Ziehen Sie Ihre ZIP-Datei per Drag-and-drop in das vorgesehene Feld oder klicken Sie auf "ZIP-Datei auswählen", um sie von Ihrem Computer hochzuladen.

### Navigation

-   **Scrollen:** Scrollen Sie mit dem Mausrad oder den Pfeiltasten (←/→), um zwischen den Folien zu wechseln.
-   **Zurück:** Klicken Sie auf die Schaltfläche "Zurück" oben links oder drücken Sie die `Escape`-Taste, um zur Startseite zurückzukehren.

---

## Entwicklerdokumentation

Dieser Abschnitt enthält technische Details zur Architektur und Funktionsweise der Anwendung.

### Projektstruktur

Das Projekt ist eine mit Vite erstellte React-Anwendung und hat folgende Struktur:

```
/
├── src/
│   ├── components/       # Wiederverwendbare React-Komponenten
│   │   ├── DynamicMDX.tsx    # Komponente zum dynamischen Rendern von MDX
│   │   ├── FilePicker.tsx    # Startseite zum Auswählen der ZIP-Datei
│   │   └── mdx-components.tsx # Sammlung von benutzerdefinierten MDX-Komponenten
│   ├── App.tsx             # Hauptanwendungskomponente
│   └── main.tsx            # Einstiegspunkt der Anwendung
├── index.html            # HTML-Hauptseite
├── package.json          # Projektabhängigkeiten und Skripte
└── vite.config.ts        # Vite-Konfigurationsdatei
```

### Programmfluss

1.  **Start:** Die Anwendung startet mit der `FilePicker`-Komponente, die dem Benutzer die Möglichkeit gibt, eine ZIP-Datei auszuwählen.

2.  **Dateiverarbeitung (`FilePicker.tsx`):**
    -   Wenn der Benutzer eine ZIP-Datei auswählt oder per Drag-and-drop ablegt, wird die `processZipFile`-Funktion aufgerufen.
    -   `JSZip` wird verwendet, um die ZIP-Datei im Browser zu entpacken.
    -   Die erste gefundene MDX-Datei (`.mdx` oder `.md`) wird als Hauptinhalt der Präsentation eingelesen.
    -   Alle Mediendateien (Bilder, Videos) werden als `Blob` extrahiert und über `URL.createObjectURL()` in temporäre URLs umgewandelt. Dies geschieht, um den Speicherverbrauch zu minimieren (im Gegensatz zur Verwendung von Data-URLs).

3.  **Status-Update:** Die extrahierten Daten (MDX-Inhalt, Dateiname, Medien-URLs) werden an die `App`-Komponente übergeben und im State (`loadedFile`) gespeichert.

4.  **MDX-Rendering (`DynamicMDX.tsx`):**
    -   Sobald `loadedFile` gesetzt ist, wird die `DynamicMDX`-Komponente gerendert.
    -   Die Komponente verwendet die `@mdx-js/mdx`-Bibliothek, um den MDX-String zur Laufzeit in eine React-Komponente zu kompilieren.
    -   **`remarkSlides` Plugin:** Ein benutzerdefiniertes `remark`-Plugin teilt den MDX-Inhalt an jeder `---`-Trennlinie und verpackt die einzelnen Abschnitte in eine `<Slide>`-Komponente.
    -   **Medien-Handling:** Benutzerdefinierte `img`- und `video`-Komponenten werden an den MDX-Renderer übergeben. Diese sorgen dafür, dass die relativen Pfade aus der MDX-Datei den temporären Blob-URLs zugeordnet werden, die beim Entpacken der ZIP-Datei erstellt wurden.

5.  **Darstellung und Interaktion:**
    -   Die kompilierte MDX-Komponente wird gerendert. Jede `<Slide>`-Komponente nimmt die volle Bildschirmhöhe ein.
    -   CSS-Eigenschaften (`scroll-snap`) sorgen dafür, dass beim Scrollen immer eine Folie im sichtbaren Bereich einrastet.
    -   Ein `useEffect`-Hook fügt Event-Listener für Tastatur- und Scroll-Ereignisse hinzu, um die Navigation und die Fortschrittsanzeige zu steuern.

### MDX-Komponenten (`mdx-components.tsx`)

Diese Datei exportiert eine Sammlung von React-Komponenten, die direkt in den MDX-Dateien verwendet werden können:

-   `Slide`: Container für eine einzelne Folie.
-   `Callout`: Hervorgehobener Kasten für Notizen, Warnungen usw.
-   `CodeBlock`: Formatierter Code-Block mit Syntax-Highlighting.
-   `Highlight`: Inline-Texthervorhebung.

Zusätzlich werden Standard-HTML-Überschriften (`h1`, `h2` usw.) so angepasst, dass sie automatisch eine `id` für Anker-Links erhalten.

### Performance-Analyse und Optimierungen

Bei der Untersuchung der Anwendung wurden mehrere potenzielle Leistungsengpässe identifiziert und behoben:

1.  **Hoher Speicherverbrauch durch Data-URLs:**
    -   **Problem:** Das Einlesen von Bildern und Videos als Base64-Data-URLs in der `FilePicker`-Komponente führte dazu, dass große Mediendateien den Arbeitsspeicher des Browsers stark belasteten.
    -   **Lösung:** Anstatt Data-URLs wird nun `URL.createObjectURL()` verwendet. Diese Methode erstellt eine temporäre, eindeutige URL für ein `Blob`-Objekt. Der Browser kann die Mediendatei direkt aus dem Speicher laden, ohne sie als langen String im JavaScript-Speicher halten zu müssen. Die nicht mehr benötigten URLs werden mit `URL.revokeObjectURL()` freigegeben, um Speicherlecks zu verhindern.

2.  **Langsames Rendern bei vielen Folien:**
    -   **Problem:** Die ursprüngliche Implementierung hat alle Folien der Präsentation gleichzeitig im DOM gerendert. Bei sehr langen Präsentationen mit vielen komplexen Komponenten (z. B. Code-Blöcken oder interaktiven Elementen) führte dies zu einer spürbaren Verlangsamung und einer hohen Speichernutzung.
    -   **Lösung:** Es wurde eine "Virtualisierungs"-Strategie für die Folien implementiert:
        -   **Lazy Rendering:** Anstatt alle `<Slide>`-Komponenten zu rendern, werden nur die aktuell sichtbare Folie sowie die unmittelbar davor und danach liegende Folie vollständig dargestellt.
        -   **Platzhalter:** Für alle anderen Folien wird ein einfacher `<div>` mit der Höhe einer Folie (`100vh`) als Platzhalter gerendert. Dies stellt sicher, dass die Scroll-Leiste des Browsers korrekt funktioniert und die Gesamtgröße der Präsentation widerspiegelt, ohne dass alle Inhalte tatsächlich im DOM vorhanden sein müssen.
        -   **Dynamisches Laden:** Der Zustand der aktuell sichtbaren Folie (`currentSlide`) wird über den Scroll-Event-Listener verfolgt. Sobald der Benutzer scrollt, wird der Zustand aktualisiert und die jeweils relevanten Folien werden neu gerendert.
