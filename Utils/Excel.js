import ExcelJS from 'exceljs';




export const exportToExcel = async (res, fileName, columns, data) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Income Report');

    sheet.columns = columns;
    sheet.addRows(data);

    
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '007BFF' }
    };

    
    sheet.getColumn(3).numFmt = '$#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
};