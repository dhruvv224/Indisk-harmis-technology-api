const R = require("./constants.js");

// const cashBasic = getBasics({
//   basicType: "12",
//   basicID: "1",
//   predefinedBasicID: "11001",
//   basicDesc: "Cash Sale, Card Sale, Mobile Pay,(immediate payment)",
// });

// const cardBasic = getBasics({
//   basicType: "12",
//   basicID: "2",
//   predefinedBasicID: "11002",
//   basicDesc: "Credit Card",
// });

// const mobilePayBasic = getBasics({
//   basicType: "12",
//   basicID: "3",
//   predefinedBasicID: "11999",
//   basicDesc: "Mobile Pay",
// });

// const saleBasic = getBasics({
//   basicType: "05",
//   basicID: "4",
//   predefinedBasicID: "11001",
//   basicDesc: "Sale",
// });

// const plateBasic = getBasics({
//   basicType: "4",
//   basicID: "5",
//   predefinedBasicID: "2000",
//   basicDesc: "Plate",
// });

// const bowlBasic = getBasics({
//   basicType: "4",
//   basicID: "6",
//   predefinedBasicID: "2001",
//   basicDesc: "Bowl",
// });

// const sidesBasic = getBasics({
//   basicType: "4",
//   basicID: "7",
//   predefinedBasicID: "2002",
//   basicDesc: "Sides",
// });

// const drinksBasic = getBasics({
//   basicType: "4",
//   basicID: "8",
//   predefinedBasicID: "2003",
//   basicDesc: "Drinks",
// });

// const dessertsBasic = getBasics({
//   basicType: "4",
//   basicID: "9",
//   predefinedBasicID: "2004",
//   basicDesc: "Desserts",
// });

// //int toPreDefBasicId() {
// //     switch (this) {
// //       case EventType.POS_APPLICATION_START:
// //         return 13001;
// //       case EventType.POS_APPLICATION_CLOSE:
// //         return 13002;
// //       case EventType.EMPLOYEE_LOGIN:
// //         return 13003;
// //       case EventType.EMPLOYEE_LOGOUT:
// //         return 13004;
// //       // case EventType.UPDATE_POS_APP:
// //       //   return 13007;
// //       case EventType.X_REPORT:
// //         return 13008;
// //       case EventType.Z_REPORT:
// //         return 13009;
// //       // case EventType.SUSPEND_TRANSACTION:
// //       //   return 13010;
// //       // case EventType.RESUME_TRANSACTION:
// //       //   return 13011;
// //       case EventType.SALES_RECEIPT:
// //         return 13012;
// //       case EventType.STAFF_RECEIPT:
// //         return 13013;
// //       case EventType.COPY_STAFF_RECEIPT:
// //         return 13014;
// //       case EventType.COPY_SALES_RECEIPT:
// //         return 13016;
// //       // case EventType.PRO_FORMA_RECEIPT:
// //       //   return 13015;
// //       // case EventType.OTHER_REPORT_RECEIPT:
// //       //   return 13018;
// //       case EventType.EXPORT_DAILY_JOURNAL:
// //         return 13020;
// //       case EventType.PRICE_CHANGE:
// //         return 13021;
// //       case EventType.PRICE_LOOKUP:
// //         return 13022;
// //       case EventType.CARD_TRANSACTION_FAILED:
// //         return 13023;
// //       case EventType.CARD_TRANSACTION_SUCCESS:
// //         return 13024;
// //       case EventType.OTHER:
// //         return 13999;
// //     }
// //   }
// // }

// const posAppStart = getBasics({
//   basicType: "01",
//   basicID: "10",
//   predefinedBasicID: "13001",
//   basicDesc: "POS Application Start",
// });

// const posAppClose = getBasics({
//   basicType: "01",
//   basicID: "11",
//   predefinedBasicID: "13002",
//   basicDesc: "POS Application Close",
// });

// const empLogin = getBasics({
//   basicType: "01",
//   basicID: "12",
//   predefinedBasicID: "13003",
//   basicDesc: "Employee Login",
// });

// const empLogout = getBasics({
//   basicType: "01",
//   basicID: "13",
//   predefinedBasicID: "13004",
//   basicDesc: "Employee Logout",
// });

// const xReport = getBasics({
//   basicType: "01",
//   basicID: "14",
//   predefinedBasicID: "13008",
//   basicDesc: "X Report",
// });

// const zReport = getBasics({
//   basicType: "01",
//   basicID: "15",
//   predefinedBasicID: "13009",
//   basicDesc: "Z Report",
// });

// const salesReceipt = getBasics({
//   basicType: "01",
//   basicID: "16",
//   predefinedBasicID: "13012",
//   basicDesc: "Sales Receipt",
// });

// const staffReceipt = getBasics({
//   basicType: "01",
//   basicID: "17",
//   predefinedBasicID: "13013",
//   basicDesc: "Staff Receipt",
// });

// const copyStaffReceipt = getBasics({
//   basicType: "01",
//   basicID: "18",
//   predefinedBasicID: "13014",
//   basicDesc: "Copy Staff Receipt",
// });

// const copySalesReceipt = getBasics({
//   basicType: "01",
//   basicID: "19",
//   predefinedBasicID: "13016",
//   basicDesc: "Copy Sales Receipt",
// });

// const exportDailyJournal = getBasics({
//   basicType: "01",
//   basicID: "20",
//   predefinedBasicID: "13020",
//   basicDesc: "Export Daily Journal",
// });

// const priceChange = getBasics({
//   basicType: "01",
//   basicID: "21",
//   predefinedBasicID: "13021",
//   basicDesc: "Price Change",
// });

// const priceLookup = getBasics({
//   basicType: "01",
//   basicID: "22",
//   predefinedBasicID: "13022",
//   basicDesc: "Price Lookup",
// });

// const cardTransactionFailed = getBasics({
//   basicType: "01",
//   basicID: "23",
//   predefinedBasicID: "13023",
//   basicDesc: "Card Transaction Failed",
// });

// const cardTransactionSuccess = getBasics({
//   basicType: "01",
//   basicID: "24",
//   predefinedBasicID: "13024",
//   basicDesc: "Card Transaction Success",
// });

// const other = getBasics({
//   basicType: "01",
//   basicID: "25",
//   predefinedBasicID: "13999",
//   basicDesc: "Other",
// });

// const basicList = [
//   cashBasic,
//   cardBasic,
//   mobilePayBasic,
//   saleBasic,
//   plateBasic,
//   bowlBasic,
//   sidesBasic,
//   drinksBasic,
//   dessertsBasic,
//   posAppStart,
//   posAppClose,
//   empLogin,
//   empLogout,
//   xReport,
//   zReport,
//   salesReceipt,
//   staffReceipt,
//   copyStaffReceipt,
//   copySalesReceipt,
//   exportDailyJournal,
//   priceChange,
//   priceLookup,
//   cardTransactionFailed,
//   cardTransactionSuccess,
//   other,
// ];

// export default basicList;
const cashBasic = getBasics({
  basicType: "12",
  basicID: "1",
  predefinedBasicID: "11001", // Cash Sale, Card Sale, Mobile Pay (immediate payment)
  basicDesc: "Cash, Card, Mobile Pay, (immediate payment)",
});

const cardBasic = getBasics({
  basicType: "12",
  basicID: "6",
  predefinedBasicID: "11002", // Credit Card
  basicDesc: "Credit Card",
});

const mobilePayBasic = getBasics({
  basicType: "12",
  basicID: "7",
  predefinedBasicID: "11999", // Mobile Pay
  basicDesc: "Mobile Pay",
});

// Sale Types
const saleBasic = getBasics({
  basicType: "05",
  basicID: "8",
  predefinedBasicID: "11001", // Sale
  basicDesc: "Sale",
});

// Products (Predefined Product Types)
const plateBasic = getBasics({
  basicType: "4",
  basicID: "5",
  predefinedBasicID: "2000", // Plate
  basicDesc: "Plate",
});

const bowlBasic = getBasics({
  basicType: "4",
  basicID: "4",
  predefinedBasicID: "2001", // Bowl
  basicDesc: "Bowl",
});

const sidesBasic = getBasics({
  basicType: "4",
  basicID: "3",
  predefinedBasicID: "2002", // Sides
  basicDesc: "Sides",
});

const drinksBasic = getBasics({
  basicType: "4",
  basicID: "2",
  predefinedBasicID: "2003", // Drinks
  basicDesc: "Drinks",
});

const dessertsBasic = getBasics({
  basicType: "1",
  basicID: "9",
  predefinedBasicID: "2004", // Desserts
  basicDesc: "Desserts",
});

// POS Application Events
const posAppStart = getBasics({
  basicType: "01",
  basicID: "10",
  predefinedBasicID: "13001", // POS Application Start
  basicDesc: "POS Application Start",
});

const posAppClose = getBasics({
  basicType: "01",
  basicID: "11",
  predefinedBasicID: "13002", // POS Application Close
  basicDesc: "POS Application Close",
});

const empLogin = getBasics({
  basicType: "01",
  basicID: "12",
  predefinedBasicID: "13003", // Employee Login
  basicDesc: "Employee Login",
});

const empLogout = getBasics({
  basicType: "01",
  basicID: "13",
  predefinedBasicID: "13004", // Employee Logout
  basicDesc: "Employee Logout",
});

// Reports and Receipts
const xReport = getBasics({
  basicType: "01",
  basicID: "14",
  predefinedBasicID: "13008", // X Report
  basicDesc: "X Report",
});

const zReport = getBasics({
  basicType: "01",
  basicID: "15",
  predefinedBasicID: "13009", // Z Report
  basicDesc: "Z Report",
});

const salesReceipt = getBasics({
  basicType: "01",
  basicID: "16",
  predefinedBasicID: "13012", // Sales Receipt
  basicDesc: "Sales Receipt",
});

const staffReceipt = getBasics({
  basicType: "01",
  basicID: "17",
  predefinedBasicID: "13013", // Staff Receipt
  basicDesc: "Staff Receipt",
});

const copyStaffReceipt = getBasics({
  basicType: "01",
  basicID: "18",
  predefinedBasicID: "13014", // Copy Staff Receipt
  basicDesc: "Copy Staff Receipt",
});

const copySalesReceipt = getBasics({
  basicType: "01",
  basicID: "19",
  predefinedBasicID: "13016", // Copy Sales Receipt
  basicDesc: "Copy Sales Receipt",
});

const exportDailyJournal = getBasics({
  basicType: "01",
  basicID: "20",
  predefinedBasicID: "13020", // Export Daily Journal
  basicDesc: "Export Daily Journal",
});

// Price and Transaction Handling
const priceChange = getBasics({
  basicType: "01",
  basicID: "21",
  predefinedBasicID: "13021", // Price Change
  basicDesc: "Price Change",
});

const priceLookup = getBasics({
  basicType: "01",
  basicID: "22",
  predefinedBasicID: "13022", // Price Lookup
  basicDesc: "Price Lookup",
});

const cardTransactionFailed = getBasics({
  basicType: "01",
  basicID: "23",
  predefinedBasicID: "13023", // Card Transaction Failed
  basicDesc: "Card Transaction Failed",
});

const cardTransactionSuccess = getBasics({
  basicType: "01",
  basicID: "24",
  predefinedBasicID: "13024", // Card Transaction Success
  basicDesc: "Card Transaction Success",
});

// Miscellaneous
const other = getBasics({
  basicType: "01",
  basicID: "25",
  predefinedBasicID: "13999", // Other
  basicDesc: "Other",
});

const saleTransaction = getBasics({
  basicType: "05", // BasicType for lineType
  basicID: "99", // Unique ID for this lineType
  predefinedBasicID: "11001", // Predefined ID for Sale transaction
  basicDesc: "Sale", // Description for the lineType
});

function getBasics({
  basicType = "11",
  basicID = "100",
  predefinedBasicID = "11001",
  basicDesc = "Kontantsalg",
} = {}) {
  //return list of basic elements
  //   Description: The Basics element is used to define various master data, and translate system specific codes into predefined standard codes.
  // Master data relevant to the Danish SAF-T Cash Register are primarily the transaction codes, codes for mode of payment, codes of events and
  // codes for raise.
  // In recording the various transactions and events in a cash register, the system specific codes are written to the Danish SAF-T Cash Register
  // datafile. There should ALWAYS be a corresponding basics element for each (system specific) code included in a Danish SAF-T Cash Register
  // datafile.
  // Mandatory, Repetitions: 1..U
  // Parent: auditfile/company/basics/
  // (section: 3.19)
  // Children:
  return {
    [R.basicTypeLabel]: basicType,
    [R.basicIDLabel]: basicID,
    [R.predefinedBasicIDLabel]: predefinedBasicID,
    [R.basicDescLabel]: basicDesc,
  };
}

const basicList = [
  cashBasic,
  cardBasic,
  mobilePayBasic,
  saleBasic,
  plateBasic,
  bowlBasic,
  sidesBasic,
  drinksBasic,
  dessertsBasic,
  posAppStart,
  posAppClose,
  empLogin,
  empLogout,
  xReport,
  zReport,
  salesReceipt,
  staffReceipt,
  copyStaffReceipt,
  copySalesReceipt,
  exportDailyJournal,
  priceChange,
  priceLookup,
  cardTransactionFailed,
  cardTransactionSuccess,
  other,
  saleTransaction,
];

module.exports = {
  basicList,
  getBasics,
};
