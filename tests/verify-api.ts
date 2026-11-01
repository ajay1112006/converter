import * as XLSX from 'xlsx';

async function testUpload() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Quarter', 'Revenue', 'Target', 'Status'],
    ['Q1', 1250000, 1200000, 'Exceeded'],
    ['Q2', 1450000, 1400000, 'Exceeded'],
    ['Q3', 1350000, 1500000, 'Near Target'],
    ['Q4', 1800000, 1600000, 'Exceeded'],
  ]);

  ws['B2'].z = '$#,##0';
  ws['C2'].z = '$#,##0';
  ws['B3'].z = '$#,##0';
  ws['C3'].z = '$#,##0';
  ws['B4'].z = '$#,##0';
  ws['C4'].z = '$#,##0';
  ws['B5'].z = '$#,##0';
  ws['C5'].z = '$#,##0';

  XLSX.utils.book_append_sheet(wb, ws, 'QuarterlyFinancials');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const formData = new FormData();
  formData.append('file', new Blob([buf]), 'TestFinancials.xlsx');
  formData.append('themeId', 'emerald');
  formData.append('maxRowsPerSlide', '10');

  console.log('Sending POST to Next.js proxy http://127.0.0.1:3000/api/backend/convert ...');
  const res = await fetch('http://127.0.0.1:3000/api/backend/convert', {
    method: 'POST',
    body: formData,
  });

  console.log('HTTP status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Content-Disposition:', res.headers.get('content-disposition'));

  if (!res.ok) {
    const errText = await res.text();
    console.error('Error response:', errText);
    process.exit(1);
  }

  const arrayBuffer = await res.arrayBuffer();
  console.log('Returned PPTX buffer size:', arrayBuffer.byteLength, 'bytes');

  if (arrayBuffer.byteLength > 1000) {
    console.log('SUCCESS: Generated valid presentation buffer in memory!');
  } else {
    throw new Error('PPTX buffer too small');
  }
}

testUpload().catch((e) => {
  console.error(e);
  process.exit(1);
});
