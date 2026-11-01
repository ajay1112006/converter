# Excel to PowerPoint Presentation Converter

A high-performance, full-stack web application built with **Next.js (App Router, TypeScript, Tailwind CSS)** on the frontend and an **in-memory Node.js/Express** processing backend.

The application converts uploaded Excel workbooks (`.xlsx`, `.xls`) into clean, beautifully styled Microsoft PowerPoint presentations (`.pptx`) with **100% data fidelity** — zero AI summarization, zero hallucination, exact cell value preservation, and native editable PowerPoint charts.

---

## 🎯 Hardest Constraint: Zero AI Invention & Exact Data Fidelity

- **Zero Summarization / No Hallucinated Content:** Every slide is generated strictly from the data present in the workbook. No AI models or heuristics invent conclusions, averages, or summaries beyond the source data.
- **Exact Numerical Representation:** Cell formats (currency signs `$`, `€`, `¥`, percentages `%`, decimals, negative accounting brackets `(1,000)`, and dates) are preserved exactly as defined in Excel.
- **Readable Slide Splitting:** Large tabular data is automatically split across consecutive slides with customizable row limits (default 10 rows per slide). Table headers are cleanly repeated on every continuation slide with a clear `(Cont. - Part N)` indicator, ensuring text is never shrunk below readable sizes.
- **Zero Disk Persistence / Privacy:** Uploads are processed 100% in-memory using RAM buffers (`multer.memoryStorage()`). No files or user workbook contents are ever written to disk or logged.

---

## ⚡ Architecture: Client-Side vs Express Server Split

| Step / Feature | Location | Rationale & Implementation Details |
| :--- | :--- | :--- |
| **File Drag & Drop & Validation** | **Client (Browser)** | Instant client-side validation of file extension (`.xlsx`, `.xls`), size, and magic bytes before uploading. |
| **Worksheet & Data Inspection** | **Client (Browser)** | Fast in-memory parsing using SheetJS in browser memory. Detects all sheets, row counts, column counts, and sample tables in milliseconds. |
| **Interactive Storyboard Outline** | **Client (Browser)** | React UI renders live miniature slide preview cards (Title slide, table chunks with row ranges, chart badges, media badges) before conversion. |
| **Presentation Theme & Row Controls** | **Client (Browser)** | User toggles sheets, chooses presentation color themes (Indigo, Slate, Emerald, Navy, Crimson), and sets rows-per-slide pagination. |
| **1-Click Verified Sample Workbooks** | **Client (Browser)** | Client-side generator produces sample workbooks (Financials, Sales Pagination, KPI Scorecard) for instant 1-click testing. |
| **OpenXML ZIP Archive Extraction** | **Express Server** | Deep extraction of `.xlsx` archive packages (`xl/charts/chart*.xml`, `xl/drawings/`, `xl/media/`) using `JSZip` and `fast-xml-parser`. |
| **Native PowerPoint Chart Creation** | **Express Server** | Maps Excel charts to native, fully editable OpenXML charts (`bar`, `column`, `line`, `pie`, `doughnut`, `scatter`, `area`) using `PptxGenJS`. |
| **High-Res Fallback Chart Rendering** | **Express Server** | For unsupported chart types (Radar, Waterfall, Treemap, Sunburst), generates a high-resolution SVG diagram with an explicit badge in the UI and slide note. |
| **Embedded Image Extraction** | **Express Server** | Extracts images from `xl/media/*` and positions them into dedicated slides. |
| **PPTX Binary Streaming** | **Express Server** | Assembles the presentation in RAM and streams the binary buffer directly with `application/vnd.openxmlformats-officedocument.presentationml.presentation` headers. |

---

## 📊 Charts & Images: Native vs High-Resolution Fallback

### 1. Supported Native PowerPoint Charts
For the following chart types, the application builds **native, fully editable PowerPoint chart objects**. When opened in Microsoft PowerPoint, Google Slides, or Keynote, users can double-click, change series colors, edit values, or alter chart layouts:
- **Vertical Column Charts** (`col`)
- **Horizontal Bar Charts** (`bar`)
- **Line Charts** (`line`)
- **Pie Charts** (`pie`)
- **Doughnut Charts** (`doughnut`)
- **Scatter Charts** (`scatter`)
- **Area Charts** (`area`)

### 2. Non-Native Chart Types (High-Resolution Fallback)
PowerPoint OpenXML presentation specifications do not support native editable representations for certain complex or legacy Excel chart types (such as **Radar**, **Waterfall**, **Treemap**, **Sunburst**, or **Surface 3D**).

**How they are handled:**
- The server extracts the exact series, categories, and numerical values from the workbook XML.
- It renders a crisp, vector-sharp **high-resolution SVG diagram** with custom axes, data labels, series polygons/bars, and legend.
- It embeds the vector image directly into the PowerPoint slide.
- **App & Slide UI Transparency:** The slide header, footer, and web app storyboard explicitly state:
  > *"Rendered as high-resolution image (Native editable PowerPoint chart not supported for [Type] in OpenXML PPTX spec)"*.

### 3. Embedded Images
Any logos, diagrams, or graphics embedded in the workbook (`xl/media/image*.png`, `.jpg`, `.svg`) are extracted from the workbook package and placed cleanly on dedicated slides with contained aspect ratio sizing.

---

## 🛠️ Complete Project File Structure

```
converter/
├── package.json                   # Root package with concurrently dev scripts & dependencies
├── tsconfig.json                  # TypeScript compiler configuration
├── next.config.ts                 # Next.js configuration with Turbopack & Express rewrite proxy
├── vitest.config.ts               # Vitest test suite runner configuration
├── README.md                      # Project architecture, documentation, and run instructions
├── SETUP.md                       # Comprehensive setup and API reference
│
├── server/                        # Node.js / Express in-memory processing backend
│   ├── index.ts                   # Express server entry point (port 5001)
│   ├── routes/
│   │   └── convert.ts             # POST /api/convert & POST /api/inspect routes
│   ├── services/
│   │   ├── excel-parser.ts        # Workbook parser, cell format fidelity, sheet extraction
│   │   ├── chart-extractor.ts     # OpenXML ZIP parser (JSZip + XML) for native & fallback charts
│   │   ├── fallback-renderer.ts   # SVG vector renderer for non-native charts (Radar, Waterfall)
│   │   ├── table-formatter.ts     # Smart slide splitting, pagination, and header repetition
│   │   ├── pptx-generator.ts      # PptxGenJS presentation orchestrator
│   │   └── themes.ts              # Presentation color schemes & styling presets
│   └── types/
│       └── index.ts               # Backend TypeScript models and interfaces
│
├── src/                           # Next.js App Router frontend
│   ├── app/
│   │   ├── layout.tsx             # Root layout with fonts, metadata, and styling
│   │   ├── page.tsx               # Main interactive application page
│   │   └── globals.css            # Tailwind CSS styling and animations
│   ├── components/
│   │   ├── Header.tsx             # Navigation header with "Client vs Server Split" modal
│   │   ├── DropZone.tsx           # Drag & drop upload area with 1-click sample loaders
│   │   ├── SheetSelector.tsx      # Sheet detection, checkbox selector, and summary stats
│   │   ├── TablePreview.tsx       # Exact cell value tabular preview with pagination
│   │   ├── SlideStoryboard.tsx    # Live miniature slide cards previewing presentation
│   │   ├── ThemeOptions.tsx       # Presentation themes, row splitting controls, & convert button
│   │   ├── ProgressModal.tsx      # Multi-step progress modal during conversion
│   │   └── ErrorBanner.tsx        # Dismissible error alerts with diagnostic messages
│   ├── lib/
│   │   ├── client-parser.ts       # Browser-side SheetJS inspector and storyboard generator
│   │   └── sample-generator.ts    # 1-click verified sample workbook generators
│   └── types/
│       └── index.ts               # Frontend TypeScript interfaces
│
└── tests/                         # Production test suite (Vitest)
    ├── excel-parser.test.ts       # Multi-sheet, empty sheet, and corrupted buffer tests
    ├── number-fidelity.test.ts    # Exact decimal, currency, percentage, date preservation
    ├── chart-mapping.test.ts      # Native chart types & fallback SVG rendering tests
    ├── slide-splitting.test.ts    # 25-row and 37-row table splitting and header repetition tests
    ├── pptx-generation.test.ts    # End-to-end binary presentation generation buffer test
    └── verify-api.ts              # Live HTTP API multipart upload verification script
```

---

## 📦 Dependency List & Installation

### Core Dependencies
- `next` (v16): App Router frontend framework
- `react` & `react-dom` (v19): UI components
- `express` (v5): Node.js HTTP server
- `cors`: Cross-Origin Resource Sharing middleware
- `multer`: In-memory multipart file upload handling
- `xlsx` (SheetJS): High-fidelity Excel workbook reading and formatting
- `pptxgenjs`: Microsoft PowerPoint presentation builder
- `jszip`: OpenXML `.xlsx` archive unzipping and inspection
- `fast-xml-parser`: Fast, lightweight XML parser for chart definitions
- `lucide-react`: Modern icons

### Development & Testing Dependencies
- `typescript` (v5): Static typing
- `tailwindcss` (v4): Modern CSS design system
- `vitest` (v5): Ultra-fast unit & integration test runner
- `vite`: Build engine and module resolution for Vitest
- `tsx`: Fast TypeScript executor for Express server
- `concurrently`: Runs Next.js frontend and Express backend concurrently with one command
- `@types/express`, `@types/cors`, `@types/multer`, `@types/node`, `@types/react`

### Installation Command
```bash
npm install
```

---

## 🚀 Run Instructions

### 1. Run Development Server (Frontend + Express Backend)
A single command starts both the Next.js dev server on port `3000` and the Express backend on port `5001`:

```bash
npm run dev
```

Open your browser to:
```
http://localhost:3000
```

### 2. Run Individual Services (Optional)
If you prefer running services in separate terminals:
```bash
# Terminal 1: Next.js Frontend (Port 3000)
npm run dev:client

# Terminal 2: Express Backend (Port 5001)
npm run dev:server
```

### 3. Run Automated Tests
Execute the comprehensive test suite covering workbook parsing, number formatting fidelity, chart mapping, slide splitting, and presentation generation:

```bash
npm test
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Automated Test Coverage Summary

All test suites pass with 100% success:

1. **`tests/excel-parser.test.ts`**:
   - Multi-sheet workbook parsing.
   - Empty sheets handling without crashing.
   - 0-byte file rejection with descriptive error.
   - Corrupted non-Excel file signature rejection.
   - Selective sheet filtering.

2. **`tests/number-fidelity.test.ts`**:
   - Exact currency preservation (`$1,250.75`).
   - Exact percentage preservation (`45.82%`).
   - Accounting bracket negative numbers `(500.00)` and standard minus signs `-1,200`.
   - Small decimal precision preservation (`0.000125`).
   - Formatted date preservation (`2024-05-18`).
   - Left/right/center column alignments.

3. **`tests/chart-mapping.test.ts`**:
   - Native mapping for all 7 supported PowerPoint chart types.
   - SVG vector fallback generation for Radar charts.
   - SVG vector fallback generation for Waterfall charts.
   - Validation of category labels and fallback reason banners.

4. **`tests/slide-splitting.test.ts`**:
   - 25-row table correctly chunked into 3 slides with 10 rows/slide max.
   - Header row repeated on every slide chunk with styling.
   - Data row conservation without dropping or duplicating items.
   - Proportional column width calculations fitting widescreen slides.

5. **`tests/pptx-generation.test.ts`**:
   - End-to-end binary presentation buffer generation.
   - OpenXML / ZIP `PK` magic number verification.
   - Inspection of internal `[Content_Types].xml`, `ppt/presentation.xml`, and slide XML.
