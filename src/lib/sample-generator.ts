import * as XLSX from 'xlsx';

export interface SampleOption {
  id: string;
  name: string;
  description: string;
  filename: string;
  sheetCount: number;
  rowCount: number;
}

export const SAMPLE_OPTIONS: SampleOption[] = [
  {
    id: 'financials',
    name: 'Executive Financial Model',
    description: 'Income statement, margins, quarterly forecasts, formatted currencies and percentages.',
    filename: 'Executive_Financial_Model_2024.xlsx',
    sheetCount: 2,
    rowCount: 18,
  },
  {
    id: 'sales-split',
    name: 'Regional Sales & Pagination Demo',
    description: '35 transaction rows across 4 regions with units, demonstrating intelligent slide splitting.',
    filename: 'Global_Sales_Transactions.xlsx',
    sheetCount: 2,
    rowCount: 38,
  },
  {
    id: 'kpi-scorecard',
    name: 'Corporate KPI Scorecard',
    description: 'Balanced scorecard metrics, target vs actuals, variance percentages and statuses.',
    filename: 'Corporate_KPI_Scorecard.xlsx',
    sheetCount: 3,
    rowCount: 24,
  },
];

export function generateSampleWorkbook(id: string): File {
  const wb = XLSX.utils.book_new();

  if (id === 'financials') {
    // Sheet 1: P&L
    const pnlData = [
      ['Financial Metric', 'FY23 Actual', 'FY24 Budget', 'FY24 Actual', 'Variance %'],
      ['Total Gross Revenue', 12500000, 14200000, 14850000, 0.046],
      ['Cost of Goods Sold (COGS)', -4500000, -5100000, -5250000, -0.029],
      ['Gross Profit', 8000000, 9100000, 9600000, 0.055],
      ['R&D Engineering', -2100000, -2400000, -2350000, 0.021],
      ['Sales & Marketing', -2800000, -3200000, -3150000, 0.016],
      ['General & Administrative', -1100000, -1250000, -1200000, 0.040],
      ['Operating Income (EBITDA)', 2000000, 2250000, 2900000, 0.289],
      ['Tax Provision (21%)', -420000, -472500, -609000, -0.289],
      ['Net Income', 1580000, 1777500, 2291000, 0.289],
    ];
    const wsPnl = XLSX.utils.aoa_to_sheet(pnlData);

    // Apply exact formatted text
    wsPnl['B2'].z = '$#,##0'; wsPnl['C2'].z = '$#,##0'; wsPnl['D2'].z = '$#,##0'; wsPnl['E2'].z = '+0.0%';
    wsPnl['B3'].z = '($#,##0)'; wsPnl['C3'].z = '($#,##0)'; wsPnl['D3'].z = '($#,##0)'; wsPnl['E3'].z = '-0.0%';
    wsPnl['B4'].z = '$#,##0'; wsPnl['C4'].z = '$#,##0'; wsPnl['D4'].z = '$#,##0'; wsPnl['E4'].z = '+0.0%';
    wsPnl['B5'].z = '($#,##0)'; wsPnl['C5'].z = '($#,##0)'; wsPnl['D5'].z = '($#,##0)'; wsPnl['E5'].z = '+0.0%';
    wsPnl['B6'].z = '($#,##0)'; wsPnl['C6'].z = '($#,##0)'; wsPnl['D6'].z = '($#,##0)'; wsPnl['E6'].z = '+0.0%';
    wsPnl['B7'].z = '($#,##0)'; wsPnl['C7'].z = '($#,##0)'; wsPnl['D7'].z = '($#,##0)'; wsPnl['E7'].z = '+0.0%';
    wsPnl['B8'].z = '$#,##0'; wsPnl['C8'].z = '$#,##0'; wsPnl['D8'].z = '$#,##0'; wsPnl['E8'].z = '+0.0%';
    wsPnl['B9'].z = '($#,##0)'; wsPnl['C9'].z = '($#,##0)'; wsPnl['D9'].z = '($#,##0)'; wsPnl['E9'].z = '-0.0%';
    wsPnl['B10'].z = '$#,##0'; wsPnl['C10'].z = '$#,##0'; wsPnl['D10'].z = '$#,##0'; wsPnl['E10'].z = '+0.0%';

    XLSX.utils.book_append_sheet(wb, wsPnl, 'Income Statement');

    // Sheet 2: Regional Performance
    const regData = [
      ['Territory', 'Regional Lead', 'Q1 Revenue', 'Q2 Revenue', 'Annual Run Rate', 'Margin %'],
      ['North America - East', 'Sarah Jenkins', 1850000, 2150000, 8000000, 0.425],
      ['North America - West', 'Marcus Vance', 2100000, 2450000, 9100000, 0.448],
      ['EMEA - Central', 'Hans Richter', 1420000, 1680000, 6200000, 0.385],
      ['EMEA - UK & Nordics', 'Claire O\'Connor', 1650000, 1890000, 7080000, 0.412],
      ['APAC - Japan & Korea', 'Kenji Sato', 1150000, 1380000, 5060000, 0.360],
      ['APAC - Australia & NZ', 'Liam Campbell', 850000, 990000, 3680000, 0.395],
      ['LATAM - Brazil & Mexico', 'Elena Morales', 620000, 780000, 2800000, 0.342],
    ];
    const wsReg = XLSX.utils.aoa_to_sheet(regData);
    for (let r = 2; r <= 8; r++) {
      wsReg[`C${r}`].z = '$#,##0';
      wsReg[`D${r}`].z = '$#,##0';
      wsReg[`E${r}`].z = '$#,##0';
      wsReg[`F${r}`].z = '0.0%';
    }
    XLSX.utils.book_append_sheet(wb, wsReg, 'Regional Performance');

    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    return new File([buf], 'Executive_Financial_Model_2024.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  if (id === 'sales-split') {
    // 35 rows table to show slide splitting across 4 slides with 10 rows/slide
    const headers = ['Order ID', 'Customer Account', 'Product Line', 'Quantity', 'Unit Price', 'Total Sale', 'Status'];
    const rows: any[][] = [headers];

    const products = ['Enterprise Cloud', 'Security Suite', 'AI Analytics', 'Database Engine', 'DevOps Tooling'];
    const customers = [
      'Starlight Tech', 'Apex Solutions', 'Nexus Dynamics', 'Vanguard Systems',
      'Horizon Global', 'BluePeak Corp', 'Summit Logistics', 'Pinnacle Labs',
      'Zenith Media', 'Cobalt Energy', 'Frontier Aerospace', 'Silverline Bank',
      'Crestview Health', 'AeroFlow Dynamics', 'Solaria Energy', 'Omni Retail'
    ];

    for (let i = 1; i <= 35; i++) {
      const cust = customers[(i - 1) % customers.length];
      const prod = products[(i - 1) % products.length];
      const qty = 5 + (i * 3) % 45;
      const price = 450 + (i * 75) % 1500;
      const total = qty * price;
      const status = i % 7 === 0 ? 'Pending' : i % 11 === 0 ? 'Processing' : 'Delivered';

      rows.push([
        `ORD-${10000 + i}`,
        cust,
        prod,
        qty,
        price,
        total,
        status,
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    for (let r = 2; r <= 36; r++) {
      ws[`D${r}`].z = '#,##0';
      ws[`E${r}`].z = '$#,##0.00';
      ws[`F${r}`].z = '$#,##0.00';
    }
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Log (35 Rows)');

    // Summary Sheet
    const summaryData = [
      ['Product Line', 'Total Units Sold', 'Gross Revenue', 'Average Discount'],
      ['Enterprise Cloud', 420, 588000, 0.12],
      ['Security Suite', 315, 378000, 0.08],
      ['AI Analytics', 285, 456000, 0.15],
      ['Database Engine', 390, 507000, 0.10],
      ['DevOps Tooling', 250, 275000, 0.05],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    for (let r = 2; r <= 6; r++) {
      wsSummary[`B${r}`].z = '#,##0';
      wsSummary[`C${r}`].z = '$#,##0';
      wsSummary[`D${r}`].z = '0.0%';
    }
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Product Summary');

    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    return new File([buf], 'Global_Sales_Transactions.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  // Default: KPI Scorecard
  const kpiData = [
    ['Strategic Pillar', 'Core KPI', 'Baseline', '2024 Target', 'Current Q3', 'Status'],
    ['Customer Experience', 'Net Promoter Score (NPS)', 58, 72, 74, 'Exceeded'],
    ['Customer Experience', 'First Contact Resolution', 0.68, 0.82, 0.84, 'Exceeded'],
    ['Operational Rigor', 'System Uptime SLA', 0.999, 0.9995, 0.9997, 'On Track'],
    ['Operational Rigor', 'Avg Incident Resolution (hrs)', 4.5, 2.0, 2.2, 'At Risk'],
    ['Financial Growth', 'Annual Recurring Rev (ARR)', 24000000, 32000000, 31400000, 'On Track'],
    ['Financial Growth', 'Net Revenue Retention', 1.08, 1.18, 1.19, 'Exceeded'],
    ['Team & Culture', 'Employee Retention Rate', 0.88, 0.94, 0.93, 'On Track'],
    ['Team & Culture', 'eNPS Satisfaction Score', 42, 60, 65, 'Exceeded'],
  ];
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  wsKpi['C3'].z = '0.0%'; wsKpi['D3'].z = '0.0%'; wsKpi['E3'].z = '0.0%';
  wsKpi['C4'].z = '0.000%'; wsKpi['D4'].z = '0.000%'; wsKpi['E4'].z = '0.000%';
  wsKpi['C6'].z = '$#,##0'; wsKpi['D6'].z = '$#,##0'; wsKpi['E6'].z = '$#,##0';
  wsKpi['C7'].z = '0.0%'; wsKpi['D7'].z = '0.0%'; wsKpi['E7'].z = '0.0%';
  wsKpi['C8'].z = '0.0%'; wsKpi['D8'].z = '0.0%'; wsKpi['E8'].z = '0.0%';

  XLSX.utils.book_append_sheet(wb, wsKpi, 'Executive KPIs');

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], 'Corporate_KPI_Scorecard.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
