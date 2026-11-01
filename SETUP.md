# Setup & Technical Architecture Guide

## Quick Start

### Prerequisites
- Node.js `v18.0.0` or higher (tested on Node v24)
- npm `v9.0.0` or higher (tested on npm 11)

### Installation
Clone or navigate to the repository directory and run:
```bash
npm install
```

### Starting the Application
```bash
npm run dev
```
This starts:
- **Next.js App Router Frontend**: `http://localhost:3000`
- **Express Backend API Server**: `http://localhost:5001`

---

## API Specifications (Express In-Memory Backend)

### 1. `POST /api/convert`
Converts an uploaded Excel workbook into a downloadable PowerPoint `.pptx` presentation.

- **Content-Type**: `multipart/form-data`
- **Request Fields**:
  - `file` (File, required): The `.xlsx` or `.xls` file (up to 50MB).
  - `themeId` (string, optional): One of `'indigo'`, `'slate'`, `'emerald'`, `'navy'`, `'crimson'`. Default: `'indigo'`.
  - `maxRowsPerSlide` (number, optional): Maximum rows per table slide before splitting (range 5–25). Default: `10`.
  - `includeTitleSlide` (boolean, optional): Whether to generate a title slide. Default: `true`.
  - `includeSlideNumbers` (boolean, optional): Whether to include slide footer and attribution. Default: `true`.
  - `selectedSheets` (string / JSON array, optional): Array of sheet names to convert (e.g. `["Sheet1", "Financials"]`).
- **Response**:
  - Binary PowerPoint file (`application/vnd.openxmlformats-officedocument.presentationml.presentation`)
  - Header: `Content-Disposition: attachment; filename="<WorkbookName>_Presentation.pptx"`
  - Status: `200 OK` on success, `400 Bad Request` with `{ error: string }` on failure.

---

### 2. `POST /api/inspect`
Inspects an Excel workbook in memory and returns detected structure without generating presentation slides.

- **Content-Type**: `multipart/form-data`
- **Request Fields**:
  - `file` (File, required): The `.xlsx` or `.xls` file.
- **Response** (`application/json`):
  ```json
  {
    "filename": "Financial_Model.xlsx",
    "metadata": {
      "title": "Financial Model",
      "author": "Corporate Finance",
      "created": "10/31/2026"
    },
    "totalRows": 28,
    "sheets": [
      {
        "name": "P&L",
        "index": 0,
        "rowCount": 12,
        "colCount": 5,
        "isEmpty": false,
        "headers": ["Metric", "Q1", "Q2", "Q3", "Q4"],
        "previewRows": [
          ["Gross Revenue", "$1,200,000", "$1,450,000", "$1,600,000", "$1,900,000"]
        ]
      }
    ],
    "charts": [
      {
        "id": "xl/charts/chart1.xml",
        "title": "Quarterly Revenue",
        "type": "col",
        "isNativeSupported": true,
        "seriesCount": 1
      }
    ],
    "imageCount": 1
  }
  ```

---

### 3. `GET /api/health`
Health check endpoint.
- **Response** (`application/json`):
  ```json
  {
    "status": "healthy",
    "uptime": 120.4,
    "timestamp": "2026-10-31T16:00:00.000Z"
  }
  ```

---

## Error Handling Matrix

| Scenario | System Behavior | User Experience in UI |
| :--- | :--- | :--- |
| **0-Byte Empty File** | Rejected at client & server validation. | Clean rose error banner: *"The selected file is empty (0 bytes). Please upload a valid Excel workbook."* |
| **Invalid Non-Excel File** | Magic bytes inspected (`PK` for `.xlsx` or `0xD0CF11E0` for `.xls`). | Clean error banner: *"Corrupted or invalid file format. The file does not have a valid Excel signature."* |
| **Empty Worksheet** | Handled gracefully without crash. | Tagged with *"Empty"* badge in worksheet selector and renders a clean empty worksheet placeholder slide. |
| **Table with 50+ Rows** | Automatically split into multiple slides with repeating headers. | Storyboard immediately shows Part 1 (Rows 1–10), Part 2 (Rows 11–20), etc. No tiny unreadable text. |
| **Unsupported Chart (Radar, Waterfall)** | Detected from OpenXML and mapped to vector SVG fallback. | Storyboard & slides display: *"Rendered as high-resolution image (Non-native chart type in OpenXML PPTX spec)"*. |
