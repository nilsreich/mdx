import { type ReactNode, type ComponentType, useEffect, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

import React from "react";
import * as math from "mathjs";

// -----------
// 1. TYP-DEFINITIONEN
// -----------

interface Point {
  x: number;
  y: number;
  label?: string;
  /** Tailwind-Klassen für die Füllfarbe, z.B. 'fill-red-500 dark:fill-red-300' */
  color?: string;
}

interface FunctionPlotterProps {
  /** Ein Array von mathematischen Gleichungen als Strings, z.B. ['x*x', '2*x+1', 'Math.sin(x)'] */
  functionEquations: string[];
  /** Sichtbarer Bereich der X-Achse: [minX, maxX] */
  rangeX: [number, number];
  /** Sichtbarer Bereich der Y-Achse: [minY, maxY] */
  rangeY: [number, number];
  /** Optionale Punkte zum Einzeichnen */
  points?: Point[];
  /** Optionales Array von Tailwind-Klassen für die Funktionslinien */
  functionColors?: string[];
  /** Schrittweite für die X-Achsen-Beschriftung, z.B. 1 oder 0.5 */
  axisStepX?: number;
  /** Schrittweite für die Y-Achsen-Beschriftung, z.B. 1 oder 2 */
  axisStepY?: number;
  /** Gesamtbreite der SVG-Grafik */
  svgWidth?: number;
  /** Gesamthöhe der SVG-Grafik */
  svgHeight?: number;
  /** Innerer Abstand für Achsenbeschriftungen */
  padding?: number;
  /** Optionale CSS-Klassen für das SVG-Element */
  className?: string;
}

// -----------
// 2. HILFSFUNKTIONEN UND KONSTANTEN
// -----------

/**
 * Versucht, einen String mit math.js in eine JavaScript-Funktion umzuwandeln.
 * @param equation Der String, z.B. "x*x", "sin(x)" oder "2x+1"
 * @returns Eine Funktion (x: number) => number oder null bei Syntaxfehler.
 */
const parseFunctionString = (
  equation: string
): ((x: number) => number) | null => {
  try {
    // 1. Kompiliere den Ausdruck mit math.js
    const compiledExpression = math.compile(equation);

    // 2. Erzeuge eine "scope" (Bereich) für die 'x'-Variable
    //    Wir initialisieren x, um den Testlauf zu ermöglichen
    const scope = { x: 1 };

    // 3. Testaufruf, um sicherzustellen, dass es eine Zahl zurückgibt
    const testResult = compiledExpression.evaluate(scope);

    if (typeof testResult !== "number" || !isFinite(testResult)) {
      // Wenn das Ergebnis keine gültige Zahl ist (z.B. NaN, Infinity, oder eine Matrix),
      // behandeln wir es als ungültig, um den Plotter nicht zu beschädigen.
      console.error(
        `Gleichung "${equation}" ergab kein gültiges numerisches Ergebnis für x=1.`
      );
      return null;
    }

    // 4. Gebe eine Wrapper-Funktion zurück, die die kompilierte Expression auswertet
    //    Diese Funktion wird vom Plotter für jeden x-Wert aufgerufen.
    return (x: number): number => {
      scope.x = x;
      // Wir müssen das Ergebnis explizit als number casten, da math.js
      // auch komplexe Zahlen, Matrizen etc. zurückgeben kann.
      // Für den Plotter erwarten wir nur 'number'.
      return compiledExpression.evaluate(scope) as number;
    };
  } catch (error) {
    console.error(`Fehler beim Parsen der Funktion "${equation}":`, error);
    return null;
  }
};

/** Erzeugt ein Array von Zahlen für die Achsenstriche */
const generateTicks = (min: number, max: number, step: number): number[] => {
  const ticks: number[] = [];
  const start = Math.ceil(min / step) * step;
  for (let i = start; i <= max; i += step) {
    // Kleine Ungenauigkeiten bei Fließkommazahlen beheben
    ticks.push(Number(i.toFixed(10)));
  }
  return ticks;
};

/** Maximale Anzahl an Ticks, um DOM-Überlastung zu verhindern */
const MAX_TICKS = 1000;

/** Standard-Farbpalette, falls keine Farben übergeben werden */
const DEFAULT_COLORS = [
  "stroke-blue-500 dark:stroke-blue-300",
  "stroke-red-500 dark:stroke-red-300",
  "stroke-green-500 dark:stroke-green-300",
  "stroke-yellow-500 dark:stroke-yellow-300",
  "stroke-purple-500 dark:stroke-purple-300",
  "stroke-pink-500 dark:stroke-pink-300",
  "stroke-cyan-500 dark:stroke-cyan-300",
];

// -----------
// 3. DIE PLOTTER-KOMPONENTE (Optimiert für React 19 Compiler)
// -----------

export const FunctionPlotter: React.FC<FunctionPlotterProps> = ({
  functionEquations,
  rangeX,
  rangeY,
  points = [],
  functionColors = [],
  axisStepX = 1,
  axisStepY = 1,
  svgWidth = 500,
  svgHeight = 400,
  padding = 40,
  className = "",
}) => {
  const [minX, maxX] = rangeX;
  const [minY, maxY] = rangeY;
  const mathWidth = maxX - minX;
  const mathHeight = maxY - minY;

  // Abmessungen des reinen Zeichenbereichs (ohne Padding)
  const plotWidth = svgWidth - 2 * padding;
  const plotHeight = svgHeight - 2 * padding;

  // --- Prop-Validierung (Robustheit) ---
  if (
    minX >= maxX ||
    minY >= maxY ||
    axisStepX <= 0 ||
    axisStepY <= 0 ||
    plotWidth <= 0 ||
    plotHeight <= 0
  ) {
    return (
      <svg width={svgWidth} height={svgHeight} className={className}>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          className="fill-current text-red-500 dark:text-red-400 text-sm"
        >
          Ungültige Props: Überprüfe rangeX, rangeY oder axisStep.
        </text>
      </svg>
    );
  }
  if (mathWidth / axisStepX > MAX_TICKS || mathHeight / axisStepY > MAX_TICKS) {
    return (
      <svg width={svgWidth} height={svgHeight} className={className}>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          className="fill-current text-red-500 dark:text-red-400 text-sm"
        >
          Ungültige Props: axisStep ist zu klein für den gewählten Bereich.
        </text>
      </svg>
    );
  }

  // --- Transformationsfunktionen ---
  // (Kein useCallback, wird vom React Compiler memoized)

  /** Rechnet eine X-Koordinate aus dem Mathe-System in eine SVG-X-Koordinate um */
  const transformX = (mathX: number): number => {
    return ((mathX - minX) / mathWidth) * plotWidth + padding;
  };

  /** Rechnet eine Y-Koordinate aus dem Mathe-System in eine SVG-Y-Koordinate um */
  const transformY = (mathY: number): number => {
    // SVG-Y-Achse ist umgekehrt (0 ist oben)
    const y = ((mathY - minY) / mathHeight) * plotHeight;
    return plotHeight - y + padding;
  };

  // --- Achsen-Berechnungen ---
  // (Kein useMemo, wird vom React Compiler memoized)
  const origin = {
    // Position des (0,0)-Punktes im SVG-System
    // Wir klemmen die Achsen an den Rand, falls 0 außerhalb des Bereichs liegt
    x: Math.max(padding, Math.min(svgWidth - padding, transformX(0))),
    y: Math.max(padding, Math.min(svgHeight - padding, transformY(0))),
  };

  // --- Ticks (Achsenstriche & Beschriftung) ---
  // (Kein useMemo, wird vom React Compiler memoized)
  const xTicks = generateTicks(minX, maxX, axisStepX);
  const yTicks = generateTicks(minY, maxY, axisStepY);

  // --- Funktions-Kompilierung ---
  // (Wird mit React.useMemo memoized, um nicht bei jedem Render neu zu parsen)
  const compiledFunctions = React.useMemo(() => {
    return functionEquations.map(parseFunctionString);
    // Hängt nur von den String-Gleichungen ab
  }, [functionEquations]);

  // --- Funktions-Plot-Berechnung (Robustheit durch <path>) ---
  // (Kein useMemo, wird vom React Compiler memoized)
  const pathDataStrings = compiledFunctions.map((func) => {
    // Überspringe, wenn die Funktion nicht geparst werden konnte (Syntaxfehler)
    if (!func) {
      return "";
    }

    let pathData = "";
    let lastValidSvgY = null;

    // Wir iterieren über die Pixel-Breite, um eine glatte Linie zu erhalten
    for (let i = 0; i <= plotWidth; i++) {
      const mathX = minX + (i / plotWidth) * mathWidth;
      const mathY = func(mathX); // Die *kompilierte* Funktion aufrufen

      // Überspringe ungültige Werte (z.B. bei Definitionslücken)
      if (!isFinite(mathY)) {
        lastValidSvgY = null; // Signalisiert einen Bruch in der Linie
        continue;
      }

      const svgX = transformX(mathX);
      const svgY = transformY(mathY);

      // Wenn der letzte Punkt ungültig war, starte ein neues Liniensegment
      if (lastValidSvgY === null) {
        pathData += ` M ${svgX},${svgY}`; // MoveTo
      } else {
        pathData += ` L ${svgX},${svgY}`; // LineTo
      }
      lastValidSvgY = svgY;
    }
    return pathData.trim();
  });

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      className={className}
      aria-label="Funktionsgraph"
    >
      {/* === Definitionen (Pfeilspitzen, Clipping-Maske) === */}
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
          className="fill-current text-gray-500 dark:text-gray-400"
        >
          {/* Pfeilspitzen-Form */}
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
        {/* Clipping-Maske, damit Graphen nicht über den Rand ragen */}
        <clipPath id="plotArea">
          <rect x={padding} y={padding} width={plotWidth} height={plotHeight} />
        </clipPath>
      </defs>

      {/* === Achsen und Gitter === */}
      <g className="text-gray-500 dark:text-gray-400 stroke-current text-xs fill-current">
        {/* --- X-Achse Striche & Beschriftung --- */}
        {xTicks.map((t) => (
          <g key={`x-tick-${t}`} transform={`translate(${transformX(t)}, 0)`}>
            {/* Strich auf der X-Achse */}
            <line
              y1={origin.y - 4}
              y2={origin.y + 4}
              className="stroke-gray-300 dark:stroke-gray-600"
            />
            {/* Beschriftung (nicht die 0, die kommt von der Y-Achse) */}
            {t !== 0 && (
              <text y={origin.y + 16} textAnchor="middle">
                {t}
              </text>
            )}
          </g>
        ))}

        {/* --- Y-Achse Striche & Beschriftung --- */}
        {yTicks.map((t) => (
          <g key={`y-tick-${t}`} transform={`translate(0, ${transformY(t)})`}>
            {/* Strich auf der Y-Achse */}
            <line
              x1={origin.x - 4}
              x2={origin.x + 4}
              className="stroke-gray-300 dark:stroke-gray-600"
            />
            {/* Beschriftung */}
            <text x={origin.x - 8} dy="0.32em" textAnchor="end">
              {t}
            </text>
          </g>
        ))}

        {/* --- Haupt-Achsenlinien --- */}
        <g className="stroke-gray-500 dark:stroke-gray-400 stroke-1">
          {/* X-Achse */}
          <line
            x1={padding}
            y1={origin.y}
            x2={svgWidth - padding + 5} // +5 für Pfeilspitze
            y2={origin.y}
            markerEnd="url(#arrowhead)"
          />
          {/* Y-Achse */}
          <line
            x1={origin.x}
            y1={svgHeight - padding}
            x2={origin.x}
            y2={padding - 5} // -5 für Pfeilspitze
            markerEnd="url(#arrowhead)"
          />
        </g>
      </g>

      {/* === Zeichenbereich (mit Clipping) === */}
      <g clipPath="url(#plotArea)">
        {/* --- Funktionsgraphen (Iteration) --- */}
        {pathDataStrings.map((pathData, index) => {
          // Wenn der Pfad leer ist (wegen ungültiger Funktion), rendere nichts
          if (!pathData) {
            return null;
          }

          // Weise eine Farbe zu: Entwf-Array oder aus der Default-Palette
          const color =
            functionColors[index] ||
            DEFAULT_COLORS[index % DEFAULT_COLORS.length];

          return (
            <path
              key={`func-${index}`}
              d={pathData}
              fill="none"
              className={`stroke-2 ${color}`}
            />
          );
        })}

        {/* --- Punkte --- */}
        {points.map((p, i) => {
          const svgX = transformX(p.x);
          const svgY = transformY(p.y);
          const color = p.color || "fill-red-500 dark:fill-red-300";

          // Zeichne nur Punkte im sichtbaren Bereich
          if (
            svgX < padding ||
            svgX > svgWidth - padding ||
            svgY < padding ||
            svgY > svgHeight - padding
          ) {
            return null;
          }

          return (
            <g key={`point-${i}`}>
              <circle cx={svgX} cy={svgY} r="4" className={color} />
              {p.label && (
                <text
                  x={svgX + 7}
                  y={svgY + 4}
                  className="text-sm fill-current text-gray-800 dark:text-gray-100"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  ); // Fix: Closing parenthesis for the main return statement added
};

// Types
interface CalloutProps {
  children: ReactNode
  type?: 'info' | 'warning' | 'success' | 'error'
}

interface CodeBlockProps {
  children: ReactNode
  language?: string
  title?: string
}

interface HighlightProps {
  children: ReactNode
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple'
}

interface SlideProps {
  children: ReactNode
  className?: string
}

interface TwoColumnSlideProps {
  children: ReactNode
  className?: string
  leftWidth?: string
  rightWidth?: string
}

interface TwoColumnProps {
  children: ReactNode
  className?: string
  gap?: string
}

interface SpeakerNotesProps {
  children: ReactNode
}

// Slide Component for presentation-style sections
export const Slide = ({ children, className = '' }: SlideProps) => {
  return (
    <section className={`min-h-screen snap-start snap-always flex items-center ${className}`}>
      <div className="prose prose-neutral lg:prose-xl max-w-5xl mx-auto px-8 py-12 dark:prose-invert w-full">
        {children}
      </div>
    </section>
  )
}

// Two Column Slide Component
export const TwoColumnSlide = ({ 
  children, 
  className = '',
}: TwoColumnSlideProps) => {
  const childArray = React.Children.toArray(children)
  const leftContent = childArray[0]
  const rightContent = childArray[1]

  return (
    <section className={`min-h-screen snap-start snap-always flex items-center ${className}`}>
      <div className="max-w-7xl mx-auto px-8 py-12 w-full">
        <div className="grid grid-cols-2 gap-12 items-start h-full">
          <div className="prose prose-neutral lg:prose-xl dark:prose-invert w-full">
            {leftContent}
          </div>
          <div className="prose prose-neutral lg:prose-xl dark:prose-invert w-full">
            {rightContent}
          </div>
        </div>
      </div>
    </section>
  )
}

// Two Column Component (inline, not a slide)
export const TwoColumn = ({ 
  children, 
  className = '',
  gap = 'gap-4'
}: TwoColumnProps) => {
  const childArray = React.Children.toArray(children)
  
  return (
    <div className={`grid grid-cols-2 ${gap} ${className}`}>
      {childArray.map((child, index) => (
        <div key={index}>
          {child}
        </div>
      ))}
    </div>
  )
}

// Speaker Notes Component (only visible in presenter view)
export const SpeakerNotes = ({ children }: SpeakerNotesProps) => {
  return (
    <div className="speaker-notes hidden" data-speaker-notes>
      {children}
    </div>
  )
}

// Callout Component
export const Callout = ({ children, type = 'info' }: CalloutProps) => {
  const typeStyles: Record<CalloutProps['type'] & string, string> = {
    info: 'border-l-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
    warning: 'border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    success: 'border-l-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
    error: 'border-l-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
  }

  return (
    <div className={`px-6 py-4 my-6 rounded-lg border-l-4 ${typeStyles[type] || typeStyles.info}`}>
      {children}
    </div>
  )
}

// Code Block Component
export const CodeBlock = ({ children, language = 'javascript', title }: CodeBlockProps) => {
  const code = typeof children === 'string' ? children : String(children)
  const [isDark, setIsDark] = useState(true)
  
  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(isDarkMode)
    }
    
    checkDarkMode()
    
    // Watch for changes in dark mode
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    // Also listen to system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => checkDarkMode()
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])
  
  return (
    <div className={`my-6 rounded-lg overflow-hidden shadow-lg min-w-[800px] ${isDark ? 'bg-slate-900' : 'bg-gray-100'}`}>
      {title && (
        <div className={`px-4 py-3 text-sm font-semibold border-b ${
          isDark 
            ? 'bg-slate-950 text-slate-400 border-slate-700' 
            : 'bg-gray-200 text-gray-700 border-gray-300'
        }`}>
          {title}
        </div>
      )}
      <SyntaxHighlighter
        language={language}
        style={isDark ? vscDarkPlus : vs}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          background: isDark ? '#0f172a' : '#f8f9fa',
          fontSize: '0.875rem',
          lineHeight: '1.6',
        }}
        showLineNumbers={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

// Highlight Component
export const Highlight = ({ children, color = 'yellow' }: HighlightProps) => {
  const colorStyles: Record<HighlightProps['color'] & string, string> = {
    yellow: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
    blue: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
    green: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100',
    pink: 'bg-pink-100 text-pink-900 dark:bg-pink-900 dark:text-pink-100',
    purple: 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100',
  }

  return (
    <span className={`px-1 py-0.5 rounded font-medium ${colorStyles[color] || colorStyles.yellow}`}>
      {children}
    </span>
  )
}

// Custom heading components with anchor links
const createHeading = (level: 1 | 2 | 3 | 4 | 5 | 6): ComponentType<{ children?: ReactNode }> => {
  const Heading = ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => {
    const id = typeof children === 'string' 
      ? children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      : undefined
    
    return React.createElement(
      `h${level}`,
      { id, ...props },
      children
    )
  }
  Heading.displayName = `Heading${level}`
  return Heading
}

// Export all custom components
export const components = {
  // Custom components
  Slide,
  TwoColumnSlide,
  TwoColumn,
  SpeakerNotes,
  Callout,
  CodeBlock,
  Highlight,
  FunctionPlotter,
  
  // Custom heading components
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  
  // You can override default HTML elements here
  // For example, custom paragraph or link styling
  // p: (props) => <p className="custom-paragraph" {...props} />,
  // a: (props) => <a className="custom-link" {...props} />,
}
