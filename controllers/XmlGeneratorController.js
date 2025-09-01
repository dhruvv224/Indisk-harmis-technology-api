const fs = require('fs');
const path = require('path');
const { create } = require('xmlbuilder2');
const calendar = require('node-calendar'); // for month names

// SAF-T Generator Controller
const generateSaftXml = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year parameter is required (e.g. ?year=2024)',
      });
    }

    // Correct namespace for SAF-T 1.2
    const NS_URI = 'urn:dk:saft:cashregister:1.2';

    // Get current date and time for file creation
    const now = new Date();
    const dateCreated = now.toISOString().split('T')[0];
    const timeCreated = now.toISOString().split('T')[1].split('.')[0];
    const fiscalYear = year;

    // Build XML
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('d1:auditfile', { 'xmlns:d1': NS_URI })

      // ===== HEADER (Section 2.2) =====
      .ele('d1:header')
        .ele('d1:fiscalYear').txt(fiscalYear).up()
        .ele('d1:startDate').txt(`${year}-01-01`).up()
        .ele('d1:endDate').txt(`${year}-12-31`).up()
        .ele('d1:curCode').txt('DKK').up()
        .ele('d1:dateCreated').txt(dateCreated).up()
        .ele('d1:timeCreated').txt(timeCreated).up()
        .ele('d1:softwareDesc').txt('ExamplePOS SAF-T Generator').up()
        .ele('d1:softwareVersion').txt('1.0').up()
        .ele('d1:softwareCompanyName').txt('Example POS Vendor A/S').up()
        .ele('d1:auditfileVersion').txt('1.2.1').up()
        .ele('d1:auditfileSender') // Section 2.3
          .ele('d1:companyIdent').txt('99999999').up()
          .ele('d1:companyName').txt('Example POS Vendor A/S').up()
          .ele('d1:taxRegistrationCountry').txt('DK').up()
          .ele('d1:taxRegIdent').txt('99999999').up()
          .ele('d1:streetAddress') // Section 2.4
            .ele('d1:streetname').txt('Vendorvej').up()
            .ele('d1:number').txt('1').up()
            .ele('d1:city').txt('København').up()
            .ele('d1:postalCode').txt('1111').up()
            .ele('d1:country').txt('DK').up()
          .up()
        .up()
      .up() // Close header

      // ===== COMPANY (Section 3.1) =====
      .ele('d1:company')
        .ele('d1:companyIdent').txt('99999999').up()
        .ele('d1:companyName').txt('Selskabet ApS').up()
        .ele('d1:taxRegistrationCountry').txt('DK').up()
        .ele('d1:taxRegIdent').txt('99999999').up()
        .ele('d1:streetAddress') // Section 3.2
          .ele('d1:streetname').txt('Vejen').up()
          .ele('d1:number').txt('13').up()
          .ele('d1:city').txt('Nørreby').up()
          .ele('d1:postalCode').txt('7913').up()
          .ele('d1:country').txt('DK').up()
        .up()
        .ele('d1:postalAddress') // Section 3.3
          .ele('d1:streetname').txt('Vejen').up()
          .ele('d1:number').txt('13').up()
          .ele('d1:city').txt('Nørreby').up()
          .ele('d1:postalCode').txt('7913').up()
          .ele('d1:country').txt('DK').up()
        .up()
        .ele('d1:vatCodeDetails') // Section 3.10
          .ele('d1:vatCodeDetail') // Section 3.11
            .ele('d1:vatCode').txt('1').up()
            .ele('d1:dateOfEntry').txt('2020-01-01').up()
            .ele('d1:vatDesc').txt('Salgsmoms varer og ydelser, 25 %').up()
            .ele('d1:standardVatCode').txt('1').up()
          .up()
          .ele('d1:vatCodeDetail')
            .ele('d1:vatCode').txt('0').up()
            .ele('d1:dateOfEntry').txt('2020-01-01').up()
            .ele('d1:vatDesc').txt('Salg fritaget moms, 0 %').up()
            .ele('d1:standardVatCode').txt('2').up()
          .up()
        .up()
        .ele('d1:periods') // Section 3.12
    for (let month = 1; month <= 12; month++) {
      const lastDay = new Date(year, month, 0).getDate();
      const monthName = new Date(year, month - 1).toLocaleString('da-DK', { month: 'long' });
      doc.last()
        .ele('d1:period') // Section 3.13
          .ele('d1:periodNumber').txt(month).up()
          .ele('d1:periodDesc').txt(monthName).up()
          .ele('d1:startDatePeriod').txt(`${year}-${String(month).padStart(2, '0')}-01`).up()
          .ele('d1:startTimePeriod').txt('00:00:00').up()
          .ele('d1:endDatePeriod').txt(`${year}-${String(month).padStart(2, '0')}-${lastDay}`).up()
          .ele('d1:endTimePeriod').txt('23:59:59').up()
        .up();
    }
    doc.up() // Close periods

        .ele('d1:employees') // Section 3.14
          .ele('d1:employee') // Section 3.15
            .ele('d1:empID').txt('1003').up()
            .ele('d1:dateOfEntry').txt('2020-01-08').up()
            .ele('d1:timeOfEntry').txt('08:00:00').up()
            .ele('d1:firstName').txt('Jens').up()
            .ele('d1:surName').txt('Hansen').up()
            .ele('d1:employeeRole') // Section 3.16
              .ele('d1:roleType').txt('Manager').up()
              .ele('d1:roleTypeDesc').txt('Butikschef').up()
            .up()
          .up()
        .up()
        .ele('d1:articles') // Section 3.17
          .ele('d1:article') // Section 3.18
            .ele('d1:artID').txt('22654').up()
            .ele('d1:dateOfEntry').txt('2019-01-08').up()
            .ele('d1:artGroupID').txt('100').up()
            .ele('d1:artDesc').txt('Mørkt rugbrød, 750 g').up()
          .up()
        .up()
        .ele('d1:basics') // Section 3.19
          .ele('d1:basic') // Section 3.20
            .ele('d1:basicType').txt('11').up()
            .ele('d1:basicID').txt('CASHSAL').up()
            .ele('d1:predefinedBasicID').txt('11001').up()
            .ele('d1:basicDesc').txt('Kontantsalg').up()
          .up()
          .ele('d1:basic')
            .ele('d1:basicType').txt('12').up()
            .ele('d1:basicID').txt('Cash').up()
            .ele('d1:predefinedBasicID').txt('12001').up()
            .ele('d1:basicDesc').txt('Kontant betaling').up()
          .up()
          .ele('d1:basic')
            .ele('d1:basicType').txt('13').up()
            .ele('d1:basicID').txt('DRAWOPEN').up()
            .ele('d1:predefinedBasicID').txt('13001').up()
            .ele('d1:basicDesc').txt('Åbning af pengeskuffe').up()
          .up()
        .up()
        .ele('d1:customersSuppliers') // Section 3.4
          .ele('d1:customerSupplier') // Section 3.5
            .ele('d1:custSupID').txt('100').up()
            .ele('d1:custSupName').txt('Kunden ApS').up()
            .ele('d1:custSupType').txt('Customer').up()
            .ele('d1:taxRegistrationCountry').txt('DK').up()
            .ele('d1:taxRegIdent').txt('88888888').up()
          .up()
        .up()
        .ele('d1:locations') // Section 4.1
          .ele('d1:location')
            .ele('d1:locID').txt('LOC-001').up()
            .ele('d1:locDesc').txt('Butik - Nørreby').up()
            .ele('d1:cashregisters') // Section 4.3
              .ele('d1:cashregister')
                .ele('d1:regID').txt('123.45678-A').up()
                .ele('d1:regDesc').txt('Ved indgangen til butikken.').up()

                // ===== EVENT (Section 5.1) =====
                .ele('d1:event')
                  .ele('d1:eventID').txt('500').up()
                  .ele('d1:eventType').txt('DRAWOPEN').up()
                  .ele('d1:empID').txt('1003').up()
                  .ele('d1:eventDate').txt(`${year}-01-10`).up()
                  .ele('d1:eventTime').txt('10:13:45').up()
                  .ele('d1:eventReport') // Section 5.2 (Mandatory if `eventType` is `13008` or `13009`)
                    .ele('d1:reportID').txt('123').up()
                    .ele('d1:reportType').txt('Z report').up()
                    .ele('d1:companyIdent').txt('99999999').up()
                    .ele('d1:companyName').txt('Selskabet ApS').up()
                    .ele('d1:reportDate').txt(`${year}-01-10`).up()
                    .ele('d1:reportTime').txt('23:58:10').up()
                    .ele('d1:registerID').txt('123.45678-A').up()
                    .ele('d1:reportTotalCashSales') // Section 5.3
                      .ele('d1:totalCashSaleAmnt').txt('1000.00').up()
                      .ele('d1:accID').txt('1010').up()
                      .ele('d1:accDesc').txt('Salg af varer og ydelser m/moms').up()
                    .up()
                    .ele('d1:reportArtGroups') // Section 5.4
                      .ele('d1:reportArtGroup') // Section 5.5
                        .ele('d1:artGroupID').txt('100').up()
                        .ele('d1:artGroupNum').txt('1.000000').up()
                        .ele('d1:artGroupAmnt').txt('1000.00').up()
                      .up()
                    .up()
                    .ele('d1:reportPayments') // Section 5.8
                      .ele('d1:reportPayment') // Section 5.9
                        .ele('d1:paymentType').txt('Cash').up()
                        .ele('d1:paymentNum').txt('1.000000').up()
                        .ele('d1:paymentAmnt').txt('1250.00').up()
                      .up()
                    .up()
                    .ele('d1:reportEmpPayments') // Section 5.10
                      .ele('d1:reportEmpPayment') // Section 5.11
                        .ele('d1:empID').txt('1003').up()
                        .ele('d1:paymentType').txt('Cash').up()
                        .ele('d1:paymentNum').txt('1.000000').up()
                        .ele('d1:paymentAmnt').txt('1250.00').up()
                      .up()
                    .up()
                    .ele('d1:reportCashSalesVat') // Section 5.13
                      .ele('d1:reportCashSaleVat') // Section 5.14
                        .ele('d1:vatCode').txt('1').up()
                        .ele('d1:vatPerc').txt('25.00').up()
                        .ele('d1:cashSaleAmnt').txt('1000.00').up()
                        .ele('d1:vatAmnt').txt('250.00').up()
                        .ele('d1:vatAmntTp').txt('C').up()
                      .up()
                    .up()
                    .ele('d1:reportOpeningChangeFloat').txt('0.00').up() // Mandatory, but can be 0.00
                    .ele('d1:reportEmpOpeningChangeFloats') // Section 5.15
                      .ele('d1:reportEmpOpeningChangeFloat') // Section 5.16
                        .ele('d1:empID').txt('1003').up()
                        .ele('d1:openingChangeFloatAmnt').txt('0.00').up()
                      .up()
                    .up()
                    .ele('d1:reportReceiptNum').txt('1').up()
                    .ele('d1:reportOpenCashBoxNum').txt('1').up()
                    .ele('d1:reportReceiptCopyNum').txt('0').up()
                    .ele('d1:reportReceiptCopyAmnt').txt('0.00').up()
                    .ele('d1:reportReceiptProformaNum').txt('0').up()
                    .ele('d1:reportReceiptProformaAmnt').txt('0.00').up()
                    .ele('d1:reportReturnNum').txt('0').up()
                    .ele('d1:reportReturnAmnt').txt('0.00').up()
                    .ele('d1:reportDiscountNum').txt('0').up()
                    .ele('d1:reportDiscountAmnt').txt('0.00').up()
                    .ele('d1:reportVoidTransNum').txt('0').up()
                    .ele('d1:reportVoidTransAmnt').txt('0.00').up()
                    .ele('d1:reportCorrLines') // Section 5.17
                      .ele('d1:reportCorrLine') // Section 5.18
                        .ele('d1:corrLineType').txt('NONE').up()
                        .ele('d1:corrLineNum').txt('0').up()
                        .ele('d1:corrLineAmnt').txt('0.00').up()
                      .up()
                    .up()
                    .ele('d1:reportPriceInquiries') // Section 5.19
                      .ele('d1:reportPriceInquiry') // Section 5.20
                        .ele('d1:priceInquiryGroup').txt('NONE').up()
                        .ele('d1:priceInquiryNum').txt('0').up()
                        .ele('d1:priceInquiryAmnt').txt('0.00').up()
                      .up()
                    .up()
                    .ele('d1:reportOtherCorrs') // Section 5.21
                      .ele('d1:reportOtherCorr') // Section 5.22
                        .ele('d1:otherCorrType').txt('NONE').up()
                        .ele('d1:otherCorrNum').txt('0').up()
                        .ele('d1:otherCorrAmnt').txt('0.00').up()
                      .up()
                    .up()
                    .ele('d1:reportReceiptDeliveryNum').txt('0').up()
                    .ele('d1:reportReceiptDeliveryAmnt').txt('0.00').up()
                    .ele('d1:reportTrainingNum').txt('0').up()
                    .ele('d1:reportTrainingAmnt').txt('0.00').up()
                    .ele('d1:reportGrandTotalSales').txt('1250.00').up()
                    .ele('d1:reportGrandTotalReturn').txt('0.00').up()
                    .ele('d1:reportGrandTotalSalesNet').txt('1250.00').up()
                  .up() // Close eventReport
                .up() // Close event

                // ===== TRANSACTION (Section 6.1) =====
                .ele('d1:cashtransaction')
                  .ele('d1:nr').txt('123456789').up()
                  .ele('d1:transID').txt('11334455').up()
                  .ele('d1:transType').txt('CASHSAL').up()
                  .ele('d1:transAmntIn').txt('125.00').up()
                  .ele('d1:transAmntEx').txt('100.00').up()
                  .ele('d1:amntTp').txt('C').up()
                  .ele('d1:empID').txt('1003').up()
                  .ele('d1:custSupID').txt('100').up()
                  .ele('d1:periodNumber').txt('1').up()
                  .ele('d1:transDate').txt(`${year}-01-10`).up()
                  .ele('d1:transTime').txt('12:45:31').up()
                  .ele('d1:invoiceID').txt('4567893').up()
                  .ele('d1:refID').txt('Bord 17').up()
                  .ele('d1:desc').txt('Eksempelsalg').up()
                  .ele('d1:ctLines') // Container for lines
                    .ele('d1:ctLine') // Section 6.2
                      .ele('d1:nr').txt('123456789').up()
                      .ele('d1:lineID').txt('1').up()
                      .ele('d1:lineType').txt('Sale').up()
                      .ele('d1:artID').txt('22654').up()
                      .ele('d1:qnt').txt('1.0000').up()
                      .ele('d1:lineAmntEx').txt('100.00').up()
                      .ele('d1:lineAmntIn').txt('125.00').up()
                      .ele('d1:amntTp').txt('C').up()
                      .ele('d1:vat') // Section 6.9
                        .ele('d1:vatCode').txt('1').up()
                        .ele('d1:vatPerc').txt('25.00').up()
                        .ele('d1:vatAmnt').txt('25.00').up()
                        .ele('d1:vatAmntTp').txt('C').up()
                        .ele('d1:vatBasAmnt').txt('100.00').up()
                      .up()
                    .up()
                  .up() // Close ctLines
                  .ele('d1:payment') // Section 6.8
                    .ele('d1:paymentType').txt('Cash').up()
                    .ele('d1:paidAmnt').txt('125.00').up()
                    .ele('d1:empID').txt('1003').up()
                    .ele('d1:curCode').txt('DKK').up()
                    .ele('d1:exchRt').txt('1.000000').up()
                    .ele('d1:paymentRefID').txt('123-6543-123').up()
                  .up()
                  .ele('d1:signature').txt('MIICWgIBAAKBgQCsN...').up() // Example signature
                  .ele('d1:keyVersion').txt('1').up()
                  .ele('d1:certificateData').txt('-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----').up() // Example cert
                  .ele('d1:voidTransaction').txt('false').up()
                  .ele('d1:trainingID').txt('false').up()
                .up() // Close cashtransaction
              .up()
            .up()
          .up()
        .up()
      .up() // Close company
    .up(); // Close auditfile

    const xml = doc.end({ prettyPrint: true });

    // Save XML file
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `saft_${year}_${Date.now()}.xml`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, xml);

    // Respond with file
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error('Error generating SAF-T XML:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating SAF-T XML',
      error: error.message,
    });
  }
};

module.exports = { generateSaftXml };
