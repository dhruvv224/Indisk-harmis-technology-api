const { XMLBuilder } = require("fast-xml-parser");
const R = require("./constants.js");
const C = require("./stringLiterals.js");
const fs = require("fs");
const { get } = require("request");
const { getSideArticle } = require("../controllers/sides.controller.js");
const { getDrinkArticle } = require("../controllers/drinks.controllers.js");
const { getDessertArticle } = require("../controllers/desserts.controllers.js");

const { basicList } = require("./basics_constants.js");
const { getBowlArticle } = require("../controllers/food.controller.js");
const { report } = require("../routes/xml.routes.js");
const { register } = require("module");
// const { staffData, bowlArticle, plateArticle } = require("./constants.js");

// get all data of food from mongoDB

// Details for Nørregade
// Company Name : “ Indisk by ExpatMeal “
// CVR : 37287482
// Address  :
// Nørregade 38 , ST, TH
// Pin - 8000
// City : Aarhus
const options = {
  ignoreAttributes: false,
  format: true,
};

const employees = [];
async function getAuditFile({
  fiscalYear = new Date().getFullYear(),
  startDate = `${new Date().getFullYear()}-01-01`,
  endDate = `${new Date().getFullYear()}-12-31`,
  ordersData = [],
  events = [],
  eventReports = [],
} = {}) {
  var sidesArticle = await getSideArticle();
  var dessertsArticle = await getDessertArticle();
  var drinksArticle = await getDrinkArticle();
  var bowlsArticle = await getBowlArticle();
  const auditContent = getAuditContent({
    fiscalYear: fiscalYear,
    startDate: startDate,
    endDate: endDate,
    ordersData: ordersData,
    sidesArticle: sidesArticle,
    dessertsArticle: dessertsArticle,
    drinksArticle: drinksArticle,
    bowlsArticle: bowlsArticle,
    events: events,
    eventReports: eventReports,
  });

  const fileName = "audit.xml";
  const builder = new XMLBuilder(options);
  let sampleXmlData = builder.build(auditContent);
  fs.writeFileSync(fileName, sampleXmlData);
  return fileName;
}

function getSequentialOrderNumber(date, orderNumber) {
  let dateArray = date.split("-");
  dateArray.push(orderNumber);
  return dateArray.join("");
}

function getEmployeeId(staffName) {
  // Find the staff object that matches the given staffName
  let staff = R.staffData.find((staff) => staff.staffName === staffName);

  // Return the _id of the found staff object, or null if not found
  return staff ? staff._id : null;
}

function getAuditContent({
  fiscalYear = new Date().getFullYear(),
  startDate = `${new Date().getFullYear()}-01-01`,
  endDate = `${new Date().getFullYear()}-12-31`,
  ordersData = [],
  sidesArticle = [],
  dessertsArticle = [],
  drinksArticle = [],
  bowlsArticle = [],
  events = [],
  eventReports = [],
} = {}) {
  return {
    [R.auditFileLabel]: {
      [R.auditFileHeaderLabel]: {
        ...getHeader({
          fiscalYear: fiscalYear,
          startDate: startDate,
          endDate: endDate,
          dateCreated: new Date().toISOString().split("T")[0],
          timeCreated: new Date().toISOString().split("T")[1].split(".")[0],
          auditfileVersion: "1.0",
        }),
      },
      company: {
        ...getCompany(),
        [R.generalLedgerLabel]: {
          [R.ledgerAccountLabel]: getLedgerAccount(),
        },
        [R.streetAddressLabel]: getStreetAddress(), // Default to empty object if not provided
        [R.postalAddressLabel]: getPostalAddress(), // Default to empty object if not provided
        [R.vatCodeDetailsLabel]: getVatCodeDetails(), // Default to empty array if not provided
        [R.periodsLabel]: getPeriods(), // Default to empty array if not provided
        [R.employeesLabel]: {
          [R.employeeLabel]: R.staffData.map((employee) => {
            return getEmployees({
              empID: employee._id,
              firstName: employee.staffName,
              // TODO: Add the rest of the employee data
              dateOfEntry: employee.dateOfEntry,
              timeOfEntry: employee.timeOfEntry,
              surName: employee.lastname,
              // roleType: null,
              // roleTypeDesc: null,
            });
          }),
        }, // Default to empty array if not provided
        [R.articlesLabel]: {
          [R.articleLabel]: getArticles({
            sidesArticle: sidesArticle,
            dessertsArticle: dessertsArticle,
            drinksArticle: drinksArticle,
            bowlsArticle: bowlsArticle,
          }),
        }, // Default to empty array if not provided
        [R.basicsLabel]: {
          [R.basicLabel]: basicList,
        }, // Default to empty array if not provided
        [R.locationsLabel]: {
          ...getLocations(),
          [R.locationLabel]: {
            [R.streetAddressLabel]: getStreetAddress(), // Function call for default value
            [R.cashregisterLabel]: {
              ...getCashRegister(),
              [R.cashtransactionLabel]: getCashTransactions(
                ordersData,
                sidesArticle,
                dessertsArticle,
                drinksArticle
              ), // Function call for default value
              [R.eventLabel]: getEvents(events, eventReports),
            }, // Function call for default value
          },
        }, // Default to empty object if not provided
      },
    },
  };
}

function getHeader({
  fiscalYear, //this default value will never be used as already provided in getAuditFile
  startDate, //this default value will never be used as already provided in getAuditFile
  endDate, //this default value will never be used as already provided in getAuditFile
  dateCreated = "2021-01-01",
  timeCreated = "00:00:00",
  curCode = C.currCodeLabel,
  softwareDesc = C.softwareCompanyDescLabel,
  softwareVersion = C.softwareVersionLabel,
  softwareCompanyName = C.softwareCompanyNameLabel,
  auditfileVersion = "1.0",
  // headerComment = "Header Comment",
  // userID = "1",
} = {}) {
  return {
    [R.fiscalYearLabel]: fiscalYear,
    [R.startDateLabel]: startDate,
    [R.endDateLabel]: endDate,
    [R.curCodeLabel]: curCode,
    [R.dateCreatedLabel]: dateCreated,
    [R.timeCreatedLabel]: timeCreated,
    [R.softwareDescLabel]: softwareDesc,
    [R.softwareVersionLabel]: softwareVersion,
    [R.softwareCompanyNameLabel]: softwareCompanyName,
    [R.auditfileVersionLabel]: auditfileVersion,
    // [R.headerCommentLabel]: headerComment,
    // [R.userIDLabel]: userID,
  };
}

function getCompany({
  companyIdent = C.companyIdentLabel,
  companyName = C.companyNameLabel,
  taxRegistrationCountry = C.taxRegistrationCountryLabel,
  taxRegIdent = C.taxRegIdentLabel,
} = {}) {
  return {
    [R.companyIdentLabel]: companyIdent,
    [R.companyNameLabel]: companyName,
    [R.taxRegistrationCountryLabel]: taxRegistrationCountry,
    [R.taxRegIdentLabel]: taxRegIdent,
  };
}

function getLedgerAccount({
  accID = "1",
  accDesc = "Account Description",
} = {}) {
  return {
    [R.accIDLabel]: accID,
    [R.accDescLabel]: accDesc,
  };
}

// Details for Nørregade
// Company Name : “ Indisk by ExpatMeal “
// CVR : 37287482
// Address  :
// Nørregade 38 , ST, TH
// Pin - 8000
// City : Aarhus

function getStreetAddress({
  streetname = "Street Name",
  number = "1",
  building = "Building",
  additionalAddressDetails = "Additional Address Details",
  city = C.companyCityLabel,
  postalCode = C.companyPincodeLabel,
  country = C.companyCountryLabel,
} = {}) {
  return {
    [R.streetnameLabel]: streetname,
    [R.numberLabel]: number,
    [R.buildingLabel]: building,
    [R.additionalAddressDetailsLabel]: additionalAddressDetails,
    [R.cityLabel]: city,
    [R.postalCodeLabel]: postalCode,
    [R.countryLabel]: country,
  };
}

function getPostalAddress({
  streetname = "Street Name",
  number = "1",
  building = "Building",
  additionalAddressDetails = "Additional Address Details",
  city = "City",
  postalCode = "1234-567",
  country = "Denmark",
} = {}) {
  return {
    streetname,
    number,
    building,
    additionalAddressDetails,
    city,
    postalCode,
    country,
  };
}

function getVatCodeDetails({
  vatCode = "1",
  dateOfEntry = "VAT Code Description",
  vatDesc = "23",
  standardVatCode = "23",
} = {}) {
  return {
    [R.vatCodeDetailLabel]: [
      {
        [R.vatCodeLabel]: vatCode,
        [R.dateOfEntryLabel]: dateOfEntry,
        [R.vatDescLabel]: vatDesc,
        [R.standardVatCodeLabel]: standardVatCode,
      },
    ],
  };
}

function getPeriods({
  periodNumber = "1",
  periodDesc = "January",
  startDatePeriod = "2020-01-01",
  startTimePeriod = "06:53:44",
  endDatePeriod = "2020-01-31",
  endTimePeriod = "23:50:50",
} = {}) {
  return {
    [R.periodLabel]: [
      {
        [R.periodNumberLabel]: periodNumber,
        [R.periodDescLabel]: periodDesc,
        [R.startDatePeriodLabel]: startDatePeriod,
        [R.startTimePeriodLabel]: startTimePeriod,
        [R.endDatePeriodLabel]: endDatePeriod,
        [R.endTimePeriodLabel]: endTimePeriod,
      },
    ],
  };
}

function getEmployees({
  empID = "1001",
  dateOfEntry = "2019-05-20",
  timeOfEntry = "14:05:35",
  firstName = "Lene",
  surName = "Nielsen",
} = {}) {
  var manager = "prasad";
  return {
    [R.empIDLabel]: empID,
    [R.dateOfEntryLabel]: dateOfEntry,
    [R.timeOfEntryLabel]: timeOfEntry,
    [R.firstNameLabel]: firstName,
    [R.surNameLabel]: surName,
    [R.employeeRoleLabel]: {
      [R.roleTypeLabel]: firstName !== manager ? "Staff" : "Manager",
      [R.roleTypeDescLabel]: firstName !== manager ? "Staff" : "Manager",
    },
  };
}

function getArticles({
  sidesArticle = [],
  dessertsArticle = [],
  drinksArticle = [],
  bowlsArticle = [],
} = {}) {
  var articles = [];

  sidesArticle.map((article) => {
    const article2 = {
      [R.artIDLabel]: article.artID,
      [R.dateOfEntryLabel]: article.dateOfEntry,
      [R.artGroupIDLabel]: article.artGroupID,
      [R.artDescLabel]: article.artDesc,
    };
    articles.push(article2);
  });
  dessertsArticle.map((article) => {
    const article2 = {
      [R.artIDLabel]: article.artID,
      [R.dateOfEntryLabel]: article.dateOfEntry,
      [R.artGroupIDLabel]: article.artGroupID,
      [R.artDescLabel]: article.artDesc,
    };
    articles.push(article2);
  });
  drinksArticle.map((article) => {
    const article3 = {
      [R.artIDLabel]: article.artID,
      [R.dateOfEntryLabel]: article.dateOfEntry,
      [R.artGroupIDLabel]: article.artGroupID,
      [R.artDescLabel]: article.artDesc,
    };
    articles.push(article3);
  });
  bowlsArticle.map((article) => {
    const article4 = {
      [R.artIDLabel]: article.artID,
      [R.dateOfEntryLabel]: article.dateOfEntry,
      [R.artGroupIDLabel]: article.artGroupID,
      [R.artDescLabel]: article.artDesc,
    };
    articles.push(article4);
  });
  articles.push(R.plateArticle);
  return articles;
}

// enum EventType {
//   X_REPORT,
//   Z_REPORT,
//   PRICE_CHANGE;

//   int toPreDefBasicId() {
//     switch (this) {
//       case EventType.X_REPORT:
//         return 13008;
//       case EventType.Z_REPORT:
//         return 13009;
//       case EventType.PRICE_CHANGE:
//         return 13021;
//     }
//   }
// }
// enum EventType {

//
function getLocations({ locationName = "Default Location Name" } = {}) {
  return {
    [R.locationLabel]: [
      {
        [R.locationNameLabel]: locationName,
      },
    ],
  };
}

function getEvents(events, eventReports) {
  var arr = [];
  events.map((event) => {
    const eventToAdd = {
      eventID: event.eventID,
      eventType: event.eventTyp,
      // transID: "123"
      empID: event.empID,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
    };
    arr.push(eventToAdd);
  });
  eventReports.map((eventRpt) => {
    const eventID = eventRpt.eventID;
    const eventType = eventRpt.eventType;
    const empID = eventRpt.empID;
    const eventDate = eventRpt.eventDate;
    const eventTime = eventRpt.eventTime;
    const eventToAdd = {
      eventID: eventID,
      eventType: eventType,
      empID: empID,
      eventDate: eventDate,
      eventTime: eventTime,
      eventReport: {
        reportID: eventRpt.reportID,
        reportType: eventRpt.reportType,
        companyIdent: eventRpt.companyIdent,
        companyName: eventRpt.companyName,
        reportDate: eventRpt.reportDate,
        reportTime: eventRpt.reportTime,
        registerID: eventRpt.registerId,
        reportTotalCashSales: {
          reportTotalCashSale: {
            totalCashSaleAmnt: eventRpt.reportTotalCashSales.totalCashSaleAmnt,
          },
        },
        reportArtGroups: {
          reportArtGroup: eventRpt.reportArtGroups.map((artGroup) => {
            return {
              artGroupID: artGroup.artGroupID,
              artGroupNum: artGroup.artGroupNum,
              artGroupAmnt: artGroup.artGroupAmnt,
            };
          }),
        },
        reportPayments: {
          reportPayment: eventRpt.reportPayments.map((payment) => {
            return {
              paymentType: payment.paymentType,
              paymentNum: payment.paymentNum,
              paymentAmnt: payment.paymentAmnt,
            };
          }),
        },
        reportEmpPayments: {
          reportEmpPayment: eventRpt.reportEmpPayments.map((empPayment) => {
            return empPayment;
          }),
        },
        reportCashSalesVat: {
          reportCashSaleVat: eventRpt.reportCashSalesVat,
        },
        reportOpeningChangeFloat: eventRpt.reportOpeningChangeFloat,
        reportReceiptNum: eventRpt.reportReceiptNum,
        reportOpenCashBoxNum: eventRpt.reportOpenCashBoxNum,
        reportReceiptCopyNum: eventRpt.reportReceiptCopyNum,
        reportReceiptCopyAmnt: eventRpt.reportReceiptCopyAmnt,
        reportReceiptProformaNum: eventRpt.reportReceiptProformaNum,
        reportReceiptProformaAmnt: eventRpt.reportReceiptProformaAmnt,
        reportReturnNum: eventRpt.reportReturnNum,
        reportReturnAmnt: eventRpt.reportReturnAmnt,
        reportDiscountNum: eventRpt.reportDiscountNum,
        reportDiscountAmnt: eventRpt.reportDiscountAmnt,
        reportVoidTransNum: eventRpt.reportVoidTransNum,
        reportVoidTransAmnt: eventRpt.reportVoidTransAmnt,
        reportCorrLines: {
          reportCorrLine: eventRpt.reportCorrLines,
        },
        reportPriceInquiries: {
          reportPriceInquiry: eventRpt.reportPriceInquiries,
        },
        reportOtherCorrs: {
          reportOtherCorr: eventRpt.reportOtherCorrs,
        },
        reportReceiptDeliveryNum: eventRpt.reportReceiptDeliveryNum,
        reportReceiptDeliveryAmnt: eventRpt.reportReceiptDeliveryAmnt,
        reportTrainingNum: eventRpt.reportTrainingNum,
        reportTrainingAmnt: eventRpt.reportTrainingAmnt,
        reportGrandTotalSales: eventRpt.reportGrandTotalSales,
        reportGrandTotalReturn: eventRpt.reportGrandTotalReturn,
        reportGrandTotalSalesNet: eventRpt.reportGrandTotalSalesNet,
      },
    };
    arr.push(eventToAdd);
  });
  return arr;
}

function getCashRegister({
  registerID = "1",
  regDesc = "Cash Register Description",
} = {}) {
  return {
    [R.registerIDLabel]: registerID,
    [R.regDescLabel]: regDesc,
    //[R.eventLabel]: getEvents(), // Uncomment and modify if needed
  };
}

function getCashTransactions(
  orderData = [],
  sidesArticle = [],
  dessertsArticle = [],
  drinksArticle = []
) {
  var arr = [];
  var articleMap = new Map();
  sidesArticle.map((article) => {
    articleMap.set(article.artDesc, article);
  });
  dessertsArticle.map((article) => {
    articleMap.set(article.artDesc, article);
  });
  drinksArticle.map((article) => {
    articleMap.set(article.artDesc, article);
  });
  orderData.map((order) => {
    let nr = getSequentialOrderNumber(order.date, order.order.orderNumber);

    arr.push({
      [R.ctLineLabel]: getCTLines(nr, order, articleMap), // Function call for default value
      [R.vatLabel]: getVatTransactionLevel({
        vatPerc: 20.0,
        vatAmnt: order.order.totalAmount * 0.2,
        vatAmntTp: "C",
      }), // Function call for default value
      [R.paymentLabel]: getPayments(
        order,
        getEmployeeId(order.order.staffName),
        order.order.modeOfPaymentName == "Card"
          ? "Credit Card"
          : order.order.modeOfPaymentName
      ), // Function call for default value
      ...getCashTransaction({
        nr: nr,
        transID: nr,
        transType: "11001", //fix as
        transAmntIn: order.order.totalAmount.toFixed(2),
        transAmntEx: (order.order.totalAmount * 0.8).toFixed(2),
        amntTp: "C",
        empID: getEmployeeId(order.order.staffName),
        transDate: order.date,
        transTime: order.time,
        signature: order.signature,
        keyVersion: order.keyVersion,
        certificateData: order.certificateData,
        voidTransaction: true,
        trainingId: false,
      }),
    });
  });
  return arr;
}

function getCashTransaction({
  nr = "123456789",
  transID = "11334455",
  transType = "CASHSAL",
  transAmntIn = "1250.00",
  transAmntEx = "1250.00",
  amntTp = "C",
  empID = "1003",
  custSupID = "100",
  periodNumber = "1",
  transDate = "2020-01-10",
  transTime = "11:30:00",
  signature = "signature",
  keyVersion = "keyVersion",
  certificateData = "certificateData",
  voidTransaction = false, // Default value, adjust if needed
  trainingId = false, // Permanent default value
  // receiptNum = "2", // Optional and commented out
  // receiptCopyNum = "0", // Optional and commented out
} = {}) {
  //return multiple cash transactions as array
  //get all transcations from that fiscalYear from mongoDB, and then parse them here
  // [{}, {}, {}, {}, {}];
  return {
    [R.nrLabel]: nr,
    [R.transIDLabel]: transID,
    [R.transTypeLabel]: transType,
    [R.transAmntInLabel]: transAmntIn,
    [R.transAmntExLabel]: transAmntEx,
    [R.amntTpLabel]: amntTp,
    [R.empIDLabel]: empID,
    // [R.custSupIDLabel]: custSupID, optional
    // [R.periodNumberLabel]: periodNumber,optional
    [R.transDateLabel]: transDate,
    [R.transTimeLabel]: transTime,
    [R.signatureLabel]: signature,
    [R.keyVersionLabel]: keyVersion,
    [R.certificateDataLabel]: certificateData,
    [R.voidTransactionLabel]: voidTransaction,
    [R.trainingIdLabel]: trainingId,
    // [R.receiptNumLabel]: receiptNum, // Optional and commented out
    // [R.receiptCopyNumLabel]: receiptCopyNum, // Optional and commented out
  };
}

function getCTLines(nr, order, articleMap) {
  //multiple ctlines
  var arr = [];

  var curryRiceBowlOrders = order.order.curryRiceBowlOrders || [];
  var indianPlateOrders = order.order.indianPlateOrders || [];
  var sidesOrders = order.order.sidesOrders || [];
  var drinksOrders = order.order.drinksOrders || [];
  var dessertsOrders = order.order.dessertsOrders || [];
  var lineID = 1;
  var isTakeAway = order.order.isTakeAway;
  curryRiceBowlOrders.map((curryRiceBowlOrder) => {
    var quantity = curryRiceBowlOrder["totalSmallBowlQuantity"];
    if (quantity == 0) return;
    var amount =
      (isTakeAway
        ? curryRiceBowlOrder["smallDiscountPrice"]
        : curryRiceBowlOrder["smallPrice"]) * quantity;
    var ctLine = getCTLine({
      nr: nr,
      lineID: lineID++,
      //TODO: add the lineType in basics table later.
      lineType: "Sale",
      //TODO: add the artGroupID in basics table later.
      //TODO: add the artID in basics table later.
      artID: 17,
      artGroupID: 4,
      qnt: quantity,
      lineAmntIn: amount,
      lineAmntEx: amount * 0.8,
      amntTp: "C",
    });
    arr.push(ctLine);
  });

  indianPlateOrders.map((indianPlateOrder) => {
    var quantity = indianPlateOrder["quantity"];
    if (quantity == 0) return;
    var takeAwayChargesPerItem = 5;
    var amount =
      (isTakeAway
        ? indianPlateOrder["price"]
        : indianPlateOrder["price"] + takeAwayChargesPerItem) * quantity;

    var ctLine = getCTLine({
      nr: nr,
      lineID: lineID++,
      lineType: "Sale",
      artGroupID: 5,
      artID: 18,
      qnt: quantity,
      lineAmntIn: amount,
      lineAmntEx: amount * 0.8,
      amntTp: "C",
    });
    arr.push(ctLine);
  });

  sidesOrders.map((sidesOrder) => {
    var quantity = sidesOrder["quantity"];
    var article = articleMap.get(sidesOrder["name"].split(" - ")[0]);
    if (quantity == 0) return;
    var amount = sidesOrder["price"] * quantity;
    var ctLine = getCTLine({
      nr: nr,
      lineID: lineID++,
      lineType: "Sale",
      artGroupID: article == undefined ? "3" : article["artGroupID"], //game,,
      artID: article == undefined ? "0" : article["artID"], //game,,
      qnt: quantity,
      lineAmntIn: amount,
      lineAmntEx: amount * 0.8,
      amntTp: "C",
    });
    arr.push(ctLine);
  });

  drinksOrders.map((drinksOrder) => {
    var article = articleMap.get(drinksOrder["name"]);

    var quantity = drinksOrder["quantity"];
    if (quantity == 0) return;
    var amount = drinksOrder["price"] * quantity;
    var ctLine = getCTLine({
      nr: nr,
      lineID: lineID++,
      lineType: "Sale",
      artGroupID: article == undefined ? "2" : article["artGroupID"], //game,,
      artID: article == undefined ? "0" : article["artID"], //id of the article i.e. product id
      qnt: quantity,
      lineAmntIn: amount,
      lineAmntEx: amount * 0.8,
      amntTp: "C",
    });
    arr.push(ctLine);
  });

  dessertsOrders.map((dessertsOrder) => {
    var quantity = dessertsOrder["quantity"];
    var article = articleMap.get(dessertsOrder["name"]);
    if (quantity == 0) return;
    var amount = dessertsOrder["price"] * quantity;
    var ctLine = getCTLine({
      nr: nr,
      lineID: lineID++,
      lineType: "Sale",
      artGroupID: article == undefined ? "1" : article["artGroupID"], //game,,
      artID: article == undefined ? "0" : ["artID"], //id of the article i.e. product id
      qnt: quantity,
      lineAmntIn: amount,
      lineAmntEx: amount * 0.8,
      amntTp: "C",
    });
    arr.push(ctLine);
  });

  return arr;
}

function getCTLine({
  nr = 1,
  lineID = 1,
  lineType = "CASHSAL",
  artGroupID = 1,
  artID = 1,
  qnt = 1,
  lineAmntIn = 100,
  lineAmntEx = 100,
  amntTp = "C",
  ppu = 100,
  vat = getVatItemCTLevel({
    vatPerc: 20.0,
    vatAmnt: lineAmntIn * 0.2,
    vatAmntTp: "C",
  }),
  // savings = {},
  // discount = {},
  // raise = {},
} = {}) {
  return {
    [R.nrLabel]: nr,
    [R.lineIDLabel]: lineID,
    [R.lineTypeLabel]: lineType,
    [R.artGroupIDLabel]: artGroupID, //have to create this, its optionla but create it,
    [R.artIDLabel]: artID, //id of the article i.e. product id
    [R.qntLabel]: qnt,
    [R.lineAmntInLabel]: lineAmntIn,
    [R.lineAmntExLabel]: lineAmntEx,
    [R.amntTpLabel]: amntTp,
    [R.ppuLabel]: ppu,
    [R.vatLabel]: vat,
  };
}

function getVatItemCTLevel({
  vatPerc = 20.0,
  vatAmnt = 1,
  vatAmntTp = 1,
} = {}) {
  return {
    [R.vatPercLabel]: vatPerc,
    [R.vatAmntLabel]: vatAmnt,
    [R.vatAmntTpLabel]: vatAmntTp,
  };
}

function getVatTransactionLevel({
  vatPerc = 20.0,
  vatAmnt = 1,
  vatAmntTp = "C",
} = {}) {
  return {
    [R.vatPercLabel]: vatPerc,
    [R.vatAmntLabel]: vatAmnt,
    [R.vatAmntTpLabel]: vatAmntTp,
  };
}

function getPayments(order, empID, paymentBasicType) {
  var arr = [];
  arr.push(
    getPayment({
      paymentType: paymentBasicType,
      paidAmnt: order.order.totalAmount,
      empID: empID,
      curCode: "DKK",
    })
  );
  return arr;
}

function getPayment({
  paymentType = 1,
  paidAmnt = 1,
  empID = 1,
  curCode = 1,
} = {}) {
  return {
    [R.paymentTypeLabel]: paymentType,
    [R.paidAmntLabel]: paidAmnt,
    [R.empIDLabel]: empID,
    [R.curCodeLabel]: curCode,
  };
}

module.exports = {
  getAuditFile,
};
